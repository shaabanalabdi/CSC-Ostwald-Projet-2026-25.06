// ============================================================
// TeamMember.js — Entité Membre de l'équipe / service civique / bénévole.
//
// Adossée à la table `team_member`. Affichage seul — aucune association
// d'authentification. Voir database.sql §5.
//
// `toPublicJSON()` est le contrat invoqué par le TeamController public
// — le garder explicite (plutôt que de surcharger le toJSON par défaut)
// rend facile de voir QUEL endpoint renvoie quelle forme.
//
// Aujourd'hui `toPublicJSON()` renvoie la ligne complète car la page
// publique « Qui sommes-nous » VEUT afficher l'e-mail professionnel +
// le téléphone de chaque membre. La règle admin (documentée dans
// CLAUDE.md) est : n'ajouter que des coordonnées PROFESSIONNELLES
// (adresses @csc-ostwald.fr, téléphones publics du CSC) aux entrées qui
// doivent apparaître sur le site public. Les bénévoles / services
// civiques avec des adresses personnelles devraient soit (a) être
// ajoutés avec email = NULL et phone = NULL, soit (b) attendre d'avoir
// une adresse professionnelle.
// ============================================================

import { Entity } from '../core/Entity.js';

export class TeamMember extends Entity {
  /**
   * Sérialisation sûre pour le public. Renvoie tous les champs
   * aujourd'hui, mais conservée comme méthode séparée afin qu'une future
   * préoccupation de confidentialité (ex. masquer l'e-mail sauf si un
   * drapeau `is_public_email` est défini) puisse être implémentée ici
   * sans toucher chaque consommateur.
   */
  toPublicJSON() {
    return { ...this };
  }
}
