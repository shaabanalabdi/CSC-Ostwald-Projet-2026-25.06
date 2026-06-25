// ============================================================
// TeamMemberRepository.js — CRUD pour la table `team_member`.
//
// Ajoute `findAllOrdered` pour la page publique « Qui sommes-nous » —
// renvoie chaque membre de l'équipe trié par display_order (curé par
// l'admin) puis par id (départage stable) afin que l'ordre sur la page
// publique soit prévisible.
// ============================================================

import { Repository } from '../core/Repository.js';
import { TeamMember } from '../entity/TeamMember.js';
import { pool } from '../config/database.js';

class TeamMemberRepository extends Repository {
  constructor() {
    super('team_member', TeamMember);
  }

  /**
   * Requête de page publique : chaque membre, trié selon l'ordre curé
   * par l'admin. `display_order` est INT NOT NULL DEFAULT 0, donc les
   * lignes nouvellement créées se placent en tête jusqu'à ce qu'un admin
   * réorganise.
   */
  findAllOrdered = async () => {
    const [rows] = await pool.query('SELECT * FROM team_member ORDER BY display_order ASC, id ASC');
    return rows.map((row) => new TeamMember(row));
  };
}

export const teamMemberRepository = new TeamMemberRepository();
