// ============================================================
// User.js — Entité Utilisateur administrateur.
//
// Les visiteurs n'ont pas de compte sur ce site (le paiement est délégué
// à HelloAsso). La table `user` ne contient que des comptes admin / editor.
//
// Le toJSON() personnalisé retire le hash bcrypt avant la sérialisation
// afin qu'il ne puisse jamais fuiter via `res.json(user)` ou un log
// accidentel. C'est le correctif issu du post-mortem Pokédex référencé
// dans CLAUDE.md.
// ============================================================

import { Entity } from '../core/Entity.js';

export class User extends Entity {
  /**
   * Hook de sérialisation JSON. Express appelle `JSON.stringify` sur le
   * corps de la réponse ; cette méthode s'exécute d'abord et retire le
   * hash du mot de passe. À utiliser chaque fois qu'un User franchit la
   * frontière de l'API.
   */
  toJSON() {
    // eslint-disable-next-line no-unused-vars
    const { password, ...safe } = this;
    return safe;
  }
}
