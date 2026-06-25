// ============================================================
// isAuthenticated.js — Garde d'authentification par cookie JWT.
//
// Lit le cookie `jwt_token` (cookie-parser doit s'exécuter avant dans
// server.js), vérifie le JWT, et hydrate `req.user` avec l'entité User
// complète afin que les handlers en aval puissent l'utiliser directement.
//
// Le post-mortem Pokédex nous a rappelé que les middlewares ASYNC
// DOIVENT être `await`és dans les appelants — la gestion async
// automatique d'Express 5 rend cela plus sûr qu'Express 4, mais le
// contrat exige toujours que ce middleware s'exécute jusqu'au bout avant
// le handler de route.
// ============================================================

import { authService } from '../service/AuthService.js';
import { userRepository } from '../repository/UserRepository.js';
import { UnauthorizedException } from '../error/HttpException.js';
import { COOKIE_NAME } from '../config/env.js';

/**
 * @returns {Promise<void>}
 * @throws {UnauthorizedException} pas de cookie, token invalide, ou utilisateur disparu.
 */
export async function isAuthenticated(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException('Authentification requise');
    }

    const payload = authService.verifyToken(token);

    // Re-récupère l'utilisateur à chaque requête pour qu'un compte
    // supprimé/rétrogradé perde l'accès immédiatement, sans attendre
    // l'expiration du JWT.
    const user = await userRepository.find(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Compte introuvable');
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}
