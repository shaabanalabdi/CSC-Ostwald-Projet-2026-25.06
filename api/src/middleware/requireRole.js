// ============================================================
// requireRole.js — Garde d'autorisation basée sur les rôles.
//
// DOIT s'exécuter APRÈS isAuthenticated — il s'attend à ce que `req.user`
// soit hydraté. L'enum `user.role` a deux valeurs dans le schéma
// aujourd'hui (`admin` et `editor`) ; les routes existantes les
// traitent comme équivalentes. Ce middleware est la brique de base pour
// les différencier sur les endpoints sensibles :
//
//   - admin  → pleins pouvoirs (supprimer un utilisateur, changer le
//              statut d'une inscription, etc.)
//   - editor → CRUD de contenu (activités, événements, équipe, news, partenaires)
//
// Utilisation dans un fichier de routes :
//   router.delete('/:id', requireRole('admin'), AdminController.remove);
//
// On accepte soit une chaîne de rôle unique, soit un tableau de rôles.
// ============================================================

import { ForbiddenException, UnauthorizedException } from '../error/HttpException.js';

export function requireRole(...allowedRoles) {
  // Aplatit au cas où l'appelant a passé un tableau.
  const allowed = new Set(allowedRoles.flat());
  if (allowed.size === 0) {
    throw new Error('requireRole(): at least one allowed role must be specified.');
  }
  return function roleGuard(req, _res, next) {
    if (!req.user) {
      // isAuthenticated doit s'être exécuté avant. Sinon, c'est un bug de câblage.
      return next(new UnauthorizedException('Authentification requise'));
    }
    if (!allowed.has(req.user.role)) {
      return next(
        new ForbiddenException(
          `Accès refusé : ce rôle (${req.user.role}) n'a pas la permission requise.`,
        ),
      );
    }
    return next();
  };
}
