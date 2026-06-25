// ============================================================
// csrfProtection.js — Garde CSRF par double-submit cookie.
//
// Modèle de menace : le JWT vit dans un cookie HttpOnly, ce qui signifie
// qu'un attaquant CSRF (une page malveillante que l'admin visite alors
// qu'il est connecté) peut ENVOYER des requêtes modifiant l'état avec le
// cookie de l'admin attaché. SameSite=strict bloque la plupart des flux
// de cookies cross-site, mais (a) on veut une défense en profondeur et
// (b) le code supporte DÉJÀ COOKIE_SAMESITE=none pour les déploiements
// cross-site — auquel cas SameSite disparaît et les tokens CSRF sont la
// seule protection.
//
// Fonctionnement du double-submit :
//   1. À la connexion, AuthController pose deux cookies :
//        - `jwt_token`  → HttpOnly  (le JS ne peut pas le lire)
//        - `csrf_token` → PAS HttpOnly (le JS PEUT le lire)
//      Les deux sont SameSite=strict + Secure (prod).
//   2. Le frontend lit `csrf_token` depuis `document.cookie` et renvoie
//      sa valeur comme en-tête `X-CSRF-Token` sur chaque appel POST /
//      PATCH / PUT / DELETE à l'API.
//   3. Ce middleware compare l'en-tête au cookie. Égaux ET non vides
//      => on continue. Sinon 403.
//
// Pourquoi ça marche : la page malveillante de l'attaquant PEUT faire en
// sorte que le navigateur envoie automatiquement le cookie `csrf_token`,
// MAIS elle ne peut PAS lire sa valeur (la same-origin policy bloque
// `document.cookie` cross-origin), donc elle ne peut PAS positionner
// l'en-tête `X-CSRF-Token` correspondant. L'en-tête + le cookie doivent
// venir d'un script qui a un accès same-origin au cookie, c.-à-d. le
// frontend légitime.
//
// Ce que ce middleware ne couvre pas :
//   - GET / HEAD / OPTIONS — non modifiants, et le pre-flight CORS les
//     gère. On saute la vérification sur ces méthodes.
//   - Les endpoints SANS auth — ils ne peuvent pas être CSRF'és de
//     manière dommageable (aucune identité privilégiée à abuser). Le
//     middleware reste sûr à monter devant des POST publics mais
//     n'apporte aucun bénéfice réel là ; aujourd'hui on ne l'applique
//     que sous `/api/admin/*`.
// ============================================================

import { timingSafeEqual } from 'node:crypto';
import { ForbiddenException } from '../error/HttpException.js';

export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token'; // express normalise les clés d'en-tête en minuscules

/** Méthodes qui modifient l'état du serveur — la vérification CSRF s'y applique. */
const PROTECTED_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Comparaison en temps constant de deux chaînes de même longueur.
 * Retombe sur false quand les entrées diffèrent en longueur
 * (timingSafeEqual lèverait une erreur). Utiliser `===` pour la
 * comparaison de token divulguerait la position du premier écart via le
 * timing — pertinent pour tout attaquant capable d'observer la latence
 * de réponse.
 */
function safeStringEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Middleware Express. À appliquer APRÈS `cookieParser` et APRÈS tout
 * middleware d'auth qui lit le même jeu de cookies.
 */
export function csrfProtection(req, res, next) {
  if (!PROTECTED_METHODS.has(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get(CSRF_HEADER_NAME) ?? req.get('X-CSRF-Token');

  if (
    typeof cookieToken !== 'string' ||
    typeof headerToken !== 'string' ||
    cookieToken.length < 16 ||
    !safeStringEqual(cookieToken, headerToken)
  ) {
    return next(new ForbiddenException('Jeton CSRF invalide ou manquant'));
  }
  return next();
}
