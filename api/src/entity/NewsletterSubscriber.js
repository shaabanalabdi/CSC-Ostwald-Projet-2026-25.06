// ============================================================
// NewsletterSubscriber.js — Entité du domaine pour la newsletter.
//
// Corps vide à dessein : la classe de base `Entity` hydrate les champs
// d'instance via `Object.assign(this, data)`, donc une ligne de MySQL
// devient un objet typé sans code de mapping par fonctionnalité.
//
// Colonnes du schéma (voir database.sql §9) :
//   id, email, is_confirmed, confirmation_token,
//   confirmed_at, unsubscribed_at, subscribed_at
// ============================================================

import { Entity } from '../core/Entity.js';

export class NewsletterSubscriber extends Entity {
  /**
   * Retire le confirmation_token avant la sérialisation. C'est un secret
   * à usage unique servant à vérifier le lien e-mail — le divulguer dans
   * les réponses admin permettrait à quiconque a un accès admin de forger
   * une confirmation. Même motif défensif que User.toJSON() retirant le
   * hash du mot de passe.
   */
  toJSON() {
    // eslint-disable-next-line no-unused-vars
    const { confirmation_token, ...safe } = this;
    return safe;
  }
}
