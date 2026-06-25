// ============================================================
// TeamMemberAdminController.js — Couche HTTP admin des membres de l'équipe.
// CRUD complet : list/getOne/create/update/delete.
// ============================================================

import { teamMemberService } from '../service/TeamMemberService.js';
import { BadRequestException } from '../error/HttpException.js';

export class TeamMemberAdminController {
  /**
   * GET /api/admin/team?page=1&perPage=50
   * 200 → { items, total, page, perPage, totalPages }
   */
  static list = async (req, res) => {
    const result = await teamMemberService.listPaginated({
      page: req.query.page,
      perPage: req.query.perPage,
    });
    return res.status(200).json(result);
  };

  /** GET /api/admin/team/:id */
  static getOne = async (req, res) => {
    const member = await teamMemberService.getOne(Number(req.params.id));
    return res.status(200).json(member);
  };

  /**
   * POST /api/admin/team
   * 201 → TeamMember | 422 → erreurs de champ
   */
  static create = async (req, res) => {
    const member = await teamMemberService.create(req.body);
    return res.status(201).json(member);
  };

  /**
   * PATCH /api/admin/team/:id
   * 200 → TeamMember | 404 → introuvable | 422 → erreurs de champ
   */
  static update = async (req, res) => {
    const member = await teamMemberService.update(Number(req.params.id), req.body);
    return res.status(200).json(member);
  };

  /** DELETE /api/admin/team/:id → 204 */
  static remove = async (req, res) => {
    await teamMemberService.remove(Number(req.params.id));
    return res.status(204).send();
  };

  /**
   * PATCH /api/admin/team/reorder
   * Body: { ids: number[] }  — le nouvel ordre d'affichage, le plus haut affiché en premier.
   * 204 en cas de succès, 400 si ids n'est pas un tableau d'entiers positifs.
   */
  static reorder = async (req, res) => {
    const raw = req.body?.ids;
    if (!Array.isArray(raw)) {
      throw new BadRequestException('Body { ids: number[] } requis');
    }
    const ids = raw.map((v) => Number(v));
    if (!ids.every((id) => Number.isInteger(id) && id > 0)) {
      throw new BadRequestException('Chaque id doit être un entier positif');
    }
    await teamMemberService.reorder(ids);
    return res.status(204).send();
  };
}
