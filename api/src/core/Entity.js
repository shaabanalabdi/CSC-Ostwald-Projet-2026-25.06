// ============================================================
// Entity.js — Classe de base de toutes les entités du domaine.
//
// Chaque entité concrète (User, Activity, Message, …) étend cette classe.
// Le constructeur initialise `id = null` (écrasé par `Object.assign`
// quand la ligne en possède déjà un) afin que les nouvelles instances
// aient toujours une forme stable — important pour le code en aval qui
// déstructure `{ id, ... }` sans optional-chaining partout.
// ============================================================

export class Entity {
  /**
   * @param {object} [data] - Ligne brute issue de la base de données, ou
   *                          objet partiel lors de la création d'une
   *                          nouvelle entité en mémoire.
   */
  constructor(data = {}) {
    this.id = null;
    Object.assign(this, data);
  }
}
