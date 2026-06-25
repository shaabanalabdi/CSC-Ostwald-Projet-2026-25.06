// ============================================================
// MessageRepository.js — CRUD pour la table `message`.
//
// Export singleton — chaque consommateur partage une seule instance
// (convention Pokédex référencée dans CLAUDE.md).
// ============================================================

import { Repository } from '../core/Repository.js';
import { Message } from '../entity/Message.js';

class MessageRepository extends Repository {
  constructor() {
    super('message', Message);
  }

  // Les requêtes du domaine arrivent ici quand le dashboard admin en a
  // besoin (ex. `findUnreadOldestFirst()`, `markAsRead(id)`).
}

export const messageRepository = new MessageRepository();
