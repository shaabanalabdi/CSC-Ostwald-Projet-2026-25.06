// ============================================================
// helloasso.js — Configuration du paiement HelloAsso.
//
// `HELLOASSO_MODE` détermine si le service appelle la vraie API HelloAsso
// (`real`) ou court-circuite avec des URLs factices (`mock`). Le mode mock
// permet de tester tout le parcours d'inscription en dev sans compte
// HelloAsso réel — l'appel de checkout renvoie une URL locale qui, une
// fois visitée, marque l'inscription comme payée immédiatement.
//
// Passer en `real` uniquement quand :
//   1. Le CSC dispose d'un compte organisation HelloAsso.
//   2. `HELLOASSO_CLIENT_ID`, `HELLOASSO_CLIENT_SECRET`, `HELLOASSO_ORG_SLUG`
//      sont renseignés dans .env.
//   3. Le tableau de bord HelloAsso a l'URL de webhook configurée pour
//      pointer vers /api/payment/webhook sur le backend déployé.
//   4. `HELLOASSO_WEBHOOK_SECRET` correspond à celui défini dans HelloAsso.
// ============================================================

import { IS_PROD } from './env.js';

/**
 * Interrupteur général de la fonctionnalité d'inscription payante Jeunesse.
 *
 *   - `false` → les routes /api/payment/* ne sont PAS montées (voir
 *     router/index.js) et les contrôles d'amorçage HelloAsso ci-dessous
 *     sont SAUTÉS — l'API démarre donc en production SANS identifiants
 *     HelloAsso. Sert à mettre le site en ligne avant que le compte
 *     organisation HelloAsso ne soit prêt.
 *   - `true`  → la fonctionnalité est active ; en production HELLOASSO_MODE
 *     doit valoir `real` et les quatre identifiants doivent être renseignés,
 *     sinon le serveur refuse de démarrer.
 *
 * Défaut `true` pour que les déploiements existants gardent leur comportement.
 * Le frontend a son propre drapeau VITE_PAYMENTS_ENABLED — garder les deux
 * synchronisés (même logique que CORS_ORIGIN côté client/serveur).
 */
export const PAYMENTS_ENABLED = (process.env.PAYMENTS_ENABLED ?? 'true').toLowerCase() !== 'false';

export const HELLOASSO_MODE = (process.env.HELLOASSO_MODE ?? 'mock').toLowerCase();
export const HELLOASSO_IS_MOCK = HELLOASSO_MODE !== 'real';

export const HELLOASSO_BASE_URL = process.env.HELLOASSO_BASE_URL ?? 'https://api.helloasso.com';
export const HELLOASSO_CLIENT_ID = process.env.HELLOASSO_CLIENT_ID ?? '';
export const HELLOASSO_CLIENT_SECRET = process.env.HELLOASSO_CLIENT_SECRET ?? '';
export const HELLOASSO_ORG_SLUG = process.env.HELLOASSO_ORG_SLUG ?? '';
export const HELLOASSO_WEBHOOK_SECRET = process.env.HELLOASSO_WEBHOOK_SECRET ?? '';

/**
 * URL utilisée par le frontend pour rediriger les utilisateurs après le
 * succès ou l'échec du checkout. Configurée au niveau du checkout HelloAsso ;
 * transmise à l'appel API.
 */
export const HELLOASSO_RETURN_URL =
  process.env.HELLOASSO_RETURN_URL ?? 'http://localhost:5173/jeunesse/inscription-confirmee';

export const HELLOASSO_CANCEL_URL =
  process.env.HELLOASSO_CANCEL_URL ?? 'http://localhost:5173/jeunesse';

// Échec immédiat en production si le mode est `real` mais que les
// identifiants sont encore vides. Mieux vaut planter au démarrage que de
// retomber silencieusement sur le mode mock en prod.
// Sauté quand PAYMENTS_ENABLED=false — la fonctionnalité est désactivée,
// HelloAsso n'est donc jamais appelé.
if (PAYMENTS_ENABLED && IS_PROD && HELLOASSO_MODE === 'real') {
  const missing = [];
  if (!HELLOASSO_CLIENT_ID) missing.push('HELLOASSO_CLIENT_ID');
  if (!HELLOASSO_CLIENT_SECRET) missing.push('HELLOASSO_CLIENT_SECRET');
  if (!HELLOASSO_ORG_SLUG) missing.push('HELLOASSO_ORG_SLUG');
  if (!HELLOASSO_WEBHOOK_SECRET) missing.push('HELLOASSO_WEBHOOK_SECRET');
  if (missing.length > 0) {
    throw new Error(
      `FATAL: HELLOASSO_MODE=real in production but missing env vars: ${missing.join(', ')}`,
    );
  }
}

// Échec immédiat en production si le mode mock est encore actif ALORS QUE
// la fonctionnalité de paiement est active — un site payant tournant en
// mock enregistrerait chaque « checkout » comme payé sans débiter
// réellement, ET exposerait la route /mock-success sujette à l'open
// redirect. Mieux vaut planter au démarrage que d'accepter silencieusement
// de faux paiements.
// Quand PAYMENTS_ENABLED=false, les routes /api/payment/* ne sont pas
// montées du tout — aucun de ces deux risques n'existe, on laisse donc
// démarrer (c'est le cas « site en ligne avant que HelloAsso soit prêt »).
if (PAYMENTS_ENABLED && IS_PROD && HELLOASSO_MODE !== 'real') {
  throw new Error(
    'FATAL: HELLOASSO_MODE must be "real" in production. Set HELLOASSO_MODE=real and configure HelloAsso credentials before going live.',
  );
}

/**
 * Liste blanche des origines d'URL de retour vers lesquelles `mockSuccess`
 * (dev uniquement) est autorisé à rediriger. Dérivée des `HELLOASSO_RETURN_URL`
 * et `HELLOASSO_CANCEL_URL` configurées — tout ce qui sort de cet ensemble
 * est traité comme une tentative d'open redirect et ignoré.
 */
function _safeOrigin(rawUrl) {
  try {
    return new URL(rawUrl).origin;
  } catch {
    return null;
  }
}
export const RETURN_URL_ALLOWED_ORIGINS = new Set(
  [_safeOrigin(HELLOASSO_RETURN_URL), _safeOrigin(HELLOASSO_CANCEL_URL)].filter(Boolean),
);
