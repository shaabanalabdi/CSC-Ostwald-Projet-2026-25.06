// ============================================================
// AuthController.js — Couche HTTP pour /api/auth/*.
//
// Stratégie de cookie :
//   - HTTPOnly        → le JS ne peut pas le lire (résistant au XSS)
//   - SameSite=Strict → les requêtes cross-site ne le transportent pas (résistant au CSRF)
//   - Secure (prod)   → envoyé uniquement en HTTPS en production
//   - Max-Age         → correspond au TTL du JWT pour que le cookie expire avec le token
// ============================================================

import { randomBytes } from 'node:crypto';
import { authService } from '../service/AuthService.js';
import { COOKIE_NAME, JWT_TTL_SECONDS, IS_PROD, COOKIE_SAMESITE } from '../config/env.js';
import { CSRF_COOKIE_NAME } from '../middleware/csrfProtection.js';

/** Options du cookie JWT HttpOnly — le JS ne peut pas le lire (résistant au XSS). */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: COOKIE_SAMESITE,
  maxAge: JWT_TTL_SECONDS * 1000, // express attend des millisecondes, le JWT utilise des secondes
  path: '/',
};

/**
 * Options du cookie CSRF NON-HttpOnly — le frontend légitime le lit via
 * `document.cookie` et le renvoie comme en-tête `X-CSRF-Token` sur chaque
 * POST/PATCH/DELETE admin. Mêmes SameSite + Secure que le cookie JWT pour
 * qu'une page cross-site malveillante ne voie jamais ni l'un ni l'autre.
 */
const CSRF_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: IS_PROD,
  sameSite: COOKIE_SAMESITE,
  maxAge: JWT_TTL_SECONDS * 1000,
  path: '/',
};

export class AuthController {
  /**
   * POST /api/auth/login
   * Body:  { email, password }
   * 200 →  { id, email, role, created_at }   + Set-Cookie: jwt_token=...
   * 400 →  { message }                        forme de payload invalide
   * 401 →  { message }                        e-mail inconnu OU mot de passe incorrect
   */
  static signIn = async (req, res) => {
    const { user, token } = await authService.signIn(req.body);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    // Émet un nouveau token CSRF lié à cette session. 32 octets aléatoires
    // → 64 caractères hex, bien au-delà du minimum de 16 imposé par le middleware.
    const csrfToken = randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, csrfToken, CSRF_COOKIE_OPTIONS);
    // user.toJSON() retire le hash du mot de passe (surcharge de l'entité User).
    return res.status(200).json(user.toJSON());
  };

  /**
   * POST /api/auth/logout
   * Efface les deux cookies. Réussit toujours (idempotent).
   * 204 No Content.
   */
  static signOut = async (req, res) => {
    // Reprend les attributs utilisés au set afin que les navigateurs
    // effacent réellement le cookie au lieu de traiter la requête comme
    // une nouvelle écriture.
    res.clearCookie(COOKIE_NAME, {
      path: '/',
      httpOnly: true,
      secure: IS_PROD,
      sameSite: COOKIE_SAMESITE,
    });
    res.clearCookie(CSRF_COOKIE_NAME, {
      path: '/',
      httpOnly: false,
      secure: IS_PROD,
      sameSite: COOKIE_SAMESITE,
    });
    return res.status(204).send();
  };

  /**
   * GET /api/auth/me
   * Nécessite que le middleware isAuthenticated se soit exécuté avant.
   * 200 → { id, email, role, created_at }
   * 401 → géré en amont par isAuthenticated.
   *
   * Effet de bord : rafraîchit le cookie CSRF s'il est absent — couvre le
   * cas où le cookie JWT survit au cookie CSRF (TTL différents par le
   * passé, éviction de cookie par le navigateur, etc.). Le frontend a
   * toujours un token utilisable après avoir appelé /me.
   */
  static me = async (req, res) => {
    if (!req.cookies?.[CSRF_COOKIE_NAME]) {
      res.cookie(CSRF_COOKIE_NAME, randomBytes(32).toString('hex'), CSRF_COOKIE_OPTIONS);
    }
    return res.status(200).json(req.user.toJSON());
  };

  /**
   * POST /api/auth/forgot-password
   * Body : { email }
   * 204 → toujours (même si l'e-mail est inconnu — protection énumération)
   * 400 → format d'e-mail invalide
   */
  static forgotPassword = async (req, res) => {
    await authService.forgotPassword(req.body?.email);
    return res.status(204).send();
  };

  /**
   * POST /api/auth/reset-password
   * Body : { token, password }
   * 204 → mot de passe mis à jour avec succès
   * 400 → token invalide/expiré ou mot de passe trop court
   */
  static resetPassword = async (req, res) => {
    await authService.resetPassword(req.body?.token, req.body?.password);
    return res.status(204).send();
  };
}
