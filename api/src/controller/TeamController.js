// ============================================================
// TeamController.js — Couche HTTP publique des membres de l'équipe.
//
// Endpoint unique pour la page « Qui sommes-nous ». Utilise
// TeamMember.toPublicJSON() pour retirer les e-mails personnels — voir
// l'entité pour la justification.
// ============================================================

import { teamMemberService } from '../service/TeamMemberService.js';

export class TeamController {
  /**
   * GET /api/team
   * 200 → TeamMember[] (ordonnés, sans champ e-mail personnel).
   */
  static list = async (req, res) => {
    const members = await teamMemberService.listAllOrdered();
    return res.status(200).json(members.map((m) => m.toPublicJSON()));
  };
}
