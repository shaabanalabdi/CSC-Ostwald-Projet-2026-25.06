// ============================================================
// PartnerRepository.js — CRUD pour la table `partner`.
//
// Ajoute `findAllOrdered` pour la page publique des partenaires. L'ordre
// est curé par l'admin via display_order, avec id comme départage stable.
// `findByCategory` filtre institutionnel / associatif quand la page
// publique souhaite les regrouper.
// ============================================================

import { Repository } from '../core/Repository.js';
import { Partner } from '../entity/Partner.js';
import { pool } from '../config/database.js';

class PartnerRepository extends Repository {
  constructor() {
    super('partner', Partner);
  }

  /** Trié par display_order puis id (départage stable). */
  findAllOrdered = async () => {
    const [rows] = await pool.query('SELECT * FROM partner ORDER BY display_order ASC, id ASC');
    return rows.map((row) => new Partner(row));
  };
}

export const partnerRepository = new PartnerRepository();
