// ============================================================
// env.js — Source unique de la configuration d'environnement.
//
// `dotenv.config()` est appelé EXACTEMENT UNE FOIS ici. Tous les autres
// modules importent les exports nommés de ce fichier au lieu de lire
// `process.env` directement. Cela évite le bug de l'ère Pokédex où dotenv
// était chargé à 4 endroits ou plus et produisait silencieusement un état
// incohérent lorsqu'il était chargé dans le mauvais ordre.
// ============================================================

import dotenv from 'dotenv';

dotenv.config();

// ─── Serveur ───────────────────────────────────────────────
export const PORT = parseInt(process.env.PORT ?? '3001', 10);
export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const IS_PROD = NODE_ENV === 'production';

/**
 * Origines CORS autorisées. Accepte une seule origine (défaut en dev) ou
 * une liste séparée par des virgules (production avec les variantes apex
 * et www) :
 *   CORS_ORIGIN=https://csc-ostwald.fr,https://www.csc-ostwald.fr
 * Les espaces et slashes en fin de chaîne sont retirés pour qu'une faute
 * de frappe dans la variable d'env ne bloque pas silencieusement le frontend.
 */
const rawCors = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
export const CORS_ORIGIN = rawCors
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

// ─── Base de données (MySQL) ───────────────────────────────
export const DB_HOST = process.env.DB_HOST ?? 'localhost';
export const DB_PORT = parseInt(process.env.DB_PORT ?? '3306', 10);
export const DB_USER = process.env.DB_USER ?? 'root';
export const DB_PASSWORD = process.env.DB_PASSWORD ?? '';
export const DB_NAME = process.env.DB_NAME ?? 'csc_ostwald';

// ─── TLS base de données ───────────────────────────────────
// Les MySQL managés (Aiven, PlanetScale, RDS, ...) imposent TLS. Sans
// `ssl`, mysql2 se connecte en clair et le serveur rejette la connexion
// ("Connections using insecure transport are prohibited").
//   DB_SSL=true    → active le chiffrement TLS.
//   DB_SSL_CA=<PEM> → (optionnel) certificat CA pour vérifier le serveur ;
//                     fourni, on exige un certificat valide. Absent, la
//                     connexion reste chiffrée mais le certificat n'est pas
//                     vérifié (rejectUnauthorized:false) — suffisant pour un
//                     petit site, à durcir avec le CA si besoin.
// Reste désactivé par défaut, donc le MySQL local en clair fonctionne tel quel.
export const DB_SSL = (process.env.DB_SSL ?? 'false').toLowerCase() === 'true';
const DB_SSL_CA = process.env.DB_SSL_CA || '';
export const DB_SSL_OPTIONS = DB_SSL
  ? DB_SSL_CA
    ? { ca: DB_SSL_CA, rejectUnauthorized: true }
    : { rejectUnauthorized: false }
  : undefined;

// ─── JWT ───────────────────────────────────────────────────
// Échec immédiat en production si le secret est absent, vide, égal à la
// valeur de repli de dev, ou trop court pour résister au brute-force —
// un repli silencieux est pire qu'un crash au démarrage.
const DEV_JWT_FALLBACK = 'dev-only-secret-do-not-use-in-prod';
export const JWT_SECRET = process.env.JWT_SECRET || DEV_JWT_FALLBACK;
export const JWT_TTL_SECONDS = parseInt(process.env.JWT_TTL_SECONDS ?? '86400', 10);

if (IS_PROD) {
  if (JWT_SECRET === DEV_JWT_FALLBACK) {
    throw new Error(
      'FATAL: JWT_SECRET is not configured in production. Set it in the host env before starting the server.',
    );
  }
  if (JWT_SECRET.length < 32) {
    throw new Error(
      `FATAL: JWT_SECRET is too short (${JWT_SECRET.length} chars). Use at least 32 random chars — e.g. \`openssl rand -base64 64\`.`,
    );
  }
}

// ─── Cookie d'authentification ─────────────────────────────
// Surchargeable via .env si un nom différent est nécessaire (ex. quand
// plusieurs services du CSC partagent un domaine et entreraient sinon
// en collision).
export const COOKIE_NAME = process.env.COOKIE_NAME ?? 'jwt_token';

/**
 * Attribut SameSite du cookie JWT. Choix possibles :
 *   - 'strict' (défaut, le plus sûr) — fonctionne quand le frontend et
 *     l'API partagent une origine (réécritures Vercel /api/* vers Render,
 *     recommandé).
 *   - 'lax'  — comme ci-dessus + autorise les navigations GET de premier niveau.
 *   - 'none' — requis quand le frontend et l'API sont sur des sites
 *     différents (ex. csc-ostwald.fr ↔ api.csc-ostwald.fr). DOIT être
 *     associé à un cookie Secure, donc la variable d'env est rejetée sauf
 *     si IS_PROD ou si le déploiement est en HTTPS.
 */
const rawSameSite = (process.env.COOKIE_SAMESITE ?? 'strict').toLowerCase();
if (!['strict', 'lax', 'none'].includes(rawSameSite)) {
  throw new Error(`Invalid COOKIE_SAMESITE: "${rawSameSite}". Use 'strict', 'lax', or 'none'.`);
}
if (rawSameSite === 'none' && !IS_PROD) {
  // Les navigateurs rejettent SameSite=None sur http://, ce qui casserait
  // silencieusement la connexion en local. Échec immédiat.
  throw new Error(
    "COOKIE_SAMESITE='none' requires NODE_ENV=production (the browser refuses None cookies over HTTP).",
  );
}
export const COOKIE_SAMESITE = rawSameSite;

// ─── SMTP (récupération de mot de passe) ───────────────────
export const SMTP_HOST = process.env.SMTP_HOST ?? 'sandbox.smtp.mailtrap.io';
export const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? '2525', 10);
export const SMTP_USER = process.env.SMTP_USER ?? '';
export const SMTP_PASS = process.env.SMTP_PASS ?? '';
export const SMTP_FROM = process.env.SMTP_FROM ?? 'noreply@csc-ostwald.fr';
export const RESET_TOKEN_TTL_MINUTES = parseInt(process.env.RESET_TOKEN_TTL_MINUTES ?? '15', 10);
export const APP_URL = process.env.APP_URL ?? 'http://localhost:5174';
