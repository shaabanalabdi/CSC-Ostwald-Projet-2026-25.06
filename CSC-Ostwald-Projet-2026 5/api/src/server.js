// ============================================================
// server.js — Point d'entrée Express 5.
//
// Ordre de démarrage :
//   1. Charger l'env (un seul dotenv.config dans config/env.js).
//   2. Configurer CORS pour l'origine du frontend.
//   3. Parser les corps JSON (express.json() — pas de body-parser ; redondant).
//   4. Enregistrer les routes.
//   5. Enregistrer le catch-all 404 (doit venir APRÈS les routes).
//   6. Enregistrer errorHandler EN DERNIER (signature à 4 arguments).
//
// Pièges évités (repris du post-mortem Pokédex) :
//   - `dotenv.config()` est appelé dans config/env.js UNIQUEMENT.
//   - Les contrôleurs/handlers de route font toujours `return res.status(...)`
//     pour que l'exécution ne retombe jamais sur un middleware suivant.
//   - `express.json()` seul ; pas de body-parser séparé.
//   - Les middlewares async DOIVENT être await'és là où ils sont appelés.
// ============================================================

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { PORT, CORS_ORIGIN, NODE_ENV } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { UPLOAD_DIR_PATH } from './middleware/uploadImage.js';
import apiRouter from './router/index.js';

const app = express();

// Fait confiance au premier saut de proxy pour qu'express-rate-limit (et
// toute future logique basée IP) voie la vraie IP client via
// X-Forwarded-For. Sur Render, Vercel et la plupart des hébergeurs
// managés, le proxy de la plateforme pose cet en-tête. La valeur `1` ne
// fait confiance qu'à un saut — plus sûr que `true` qui accepterait
// n'importe quelle valeur XFF usurpée.
app.set('trust proxy', 1);

// Log de requête structuré, une ligne par requête, sur stdout. Monté EN
// PREMIER pour que chaque requête — même celles rejetées par helmet/cors
// — obtienne une entrée de log. `req.id` est attaché pour que les
// services en aval puissent corréler.
app.use(requestLogger);

// En-têtes HTTP défensifs (X-Content-Type-Options: nosniff, X-Frame-Options:
// SAMEORIGIN, Strict-Transport-Security en prod, Referrer-Policy, …).
//
// Stratégie CSP :
//   - En production, nginx (OVH) et Vercel posent une CSP plus riche et
//     consciente de l'app en périphérie. On garde délibérément la CSP de
//     Helmet DÉSACTIVÉE là pour éviter des politiques dupliquées/en
//     conflit — si les deux couches envoient l'en-tête, les navigateurs
//     les croisent et la politique devient fragile.
//   - L'API répond aussi DIRECTEMENT à des consommateurs JSON (moniteurs
//     d'uptime, health checks via curl, futures apps natives) qui ne
//     passent jamais par la périphérie. Ces réponses bénéficient quand
//     même d'une CSP minimale qui interdit tout — aucune réponse d'API ne
//     devrait jamais être parsée comme du HTML.
//
//   La CSP minimale « tout interdire » ci-dessous est montée comme FILET
//   DE SÉCURITÉ : si la CSP de périphérie disparaît un jour (édition de
//   config nginx, bug d'en-tête Vercel), l'API expédie quand même une
//   politique saine.
//
// crossOriginResourcePolicy est mis à `cross-origin` pour que les images
// /uploads/* se chargent encore quand le frontend est sur une autre
// origine (ex. csc-ostwald.vercel.app ↔ csc-ostwald-api.onrender.com).
app.use(
  helmet({
    // `useDefaults: false` pour déclarer chaque directive explicitement.
    // Pas de script-src / style-src dans les réponses JSON par design —
    // l'API ne sert pas de HTML, donc désactiver les scripts en CSP est
    // correct.
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        'default-src': ["'none'"],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'none'"],
        'form-action': ["'none'"],
        // Autorise les <img> same-origin pour l'endpoint statique
        // /uploads/* quand il est accédé directement (ex. un admin
        // ouvrant l'URL dans un onglet).
        'img-src': ["'self'", 'data:'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

// CORS — autorise l'origine du frontend configurée, avec les
// identifiants pour que le cookie JWT admin puisse circuler entre le
// client et le serveur.
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  }),
);

// IMPORTANT : le webhook HelloAsso a besoin du corps de requête BRUT pour
// vérifier sa signature HMAC-SHA256. On monte `express.raw()` pour ce
// seul chemin AVANT le parser JSON global — si `express.json()` tournait
// d'abord, il consommerait le flux et `req.body` serait un objet parsé,
// pas les octets que HelloAsso a signés. Le contrôleur parse le buffer
// lui-même après la vérification de signature.
app.use('/api/payment/webhook', express.raw({ type: 'application/json', limit: '1mb' }));

app.use(express.json({ limit: '1mb' }));
// cookie-parser remplit `req.cookies` (utilisé par isAuthenticated pour
// lire le JWT). Express 5 ne l'inclut PAS d'origine.
app.use(cookieParser());

// ─── Statique : /uploads/* ──────────────────────────────────
// Sert les fichiers écrits par l'endpoint d'upload admin. `maxAge: 1y`
// car les noms de fichier sont adressés par contenu (hash) — la même URL
// = toujours les mêmes octets, donc une mise en cache agressive est sûre.
app.use(
  '/uploads',
  express.static(UPLOAD_DIR_PATH, {
    maxAge: '1y',
    immutable: true,
    fallthrough: true,
  }),
);

// ─── Routes /api/* ──────────────────────────────────────────
// Toutes les routes de domaine (health check, newsletter, contact, ...)
// sont câblées dans router/index.js — garde ce fichier concentré sur la
// config Express.
app.use('/api', apiRouter);

// ─── Catch-all 404 (APRÈS les routes) ───────────────────────
app.use((req, res) => {
  return res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Handler d'erreur (EN DERNIER) ──────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.info(`✓ CSC Ostwald API running on http://localhost:${PORT}`);
  console.info(`  Health: http://localhost:${PORT}/api/health`);
  console.info(`  Env:    ${NODE_ENV}`);
});
