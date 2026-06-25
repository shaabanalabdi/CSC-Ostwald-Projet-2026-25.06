// ============================================================
// requestLogger.js — Journalisation de requêtes minimale et structurée.
//
// Une ligne JSON par requête, écrite sur stdout. Le format correspond
// volontairement à ce que Render / Vercel / Datadog ingèrent
// nativement, donc passer à `pino` plus tard ne change rien pour le
// collecteur de logs.
//
// Pourquoi ne pas avoir intégré `pino` ?
//   - Zéro nouvelle dépendance (évite de gonfler la surface de npm audit).
//   - C'est un site de centre social à faible trafic ; le gain de perf
//     du worker thread de pino est ici sans importance.
//   - Quand la télémétrie sera en place, remplacer ce fichier par
//     `import pino` et le reste de la stack reste inchangé.
//
// Choses délibérément NON journalisées :
//   - Les corps de requête (divulgueraient des données personnelles des
//     soumissions contact / newsletter / bénévole). Utiliser des logs
//     ciblés dans les services si un champ précis compte.
//   - L'en-tête `Cookie` (contient le JWT admin + le token CSRF).
//   - L'en-tête `Authorization` (reflète le JWT).
// ============================================================

import { randomUUID } from 'node:crypto';

/**
 * Middleware Express. Journalise UNE ligne structurée par requête une
 * fois la réponse terminée, incluant le code de statut final et la durée
 * totale. Attache un `req.id` (uuid v4) afin que les logs des services
 * en aval puissent être corrélés.
 */
export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  req.id = randomUUID();
  res.setHeader('X-Request-Id', req.id);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    // Garde le log petit — l'objectif est une ligne parsable par
    // requête, pas un dump de débogage. N'ajouter des champs que quand
    // ils valent leur coût en octets.
    const entry = {
      ts: new Date().toISOString(),
      reqId: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durMs: Math.round(durationMs * 10) / 10,
      // `req.ip` respecte le `trust proxy` posé dans server.js — vraie IP
      // client derrière nginx/Vercel/Render, pas celle du load balancer.
      ip: req.ip,
    };
    // Étiquette les lignes bruyantes pour qu'un filtre de log puisse les
    // masquer à la source. `/api/health` est frappé toutes les ~30 s par
    // la sonde d'uptime de la plateforme et noierait sinon le signal.
    if (req.originalUrl === '/api/health') entry.healthCheck = true;
    process.stdout.write(`${JSON.stringify(entry)}\n`);
  });

  next();
}
