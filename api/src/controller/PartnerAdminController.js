// ============================================================
// PartnerAdminController.js — Couche HTTP admin des partenaires.
// CRUD complet : list/getOne/create/update/delete.
// ============================================================

import { partnerService } from '../service/PartnerService.js';
import { BadRequestException } from '../error/HttpException.js';

export class PartnerAdminController {
  /** GET /api/admin/partners?page=1&perPage=50 */
  static list = async (req, res) => {
    const result = await partnerService.listPaginated({
      page: req.query.page,
      perPage: req.query.perPage,
    });
    return res.status(200).json(result);
  };

  /** GET /api/admin/partners/:id */
  static getOne = async (req, res) => {
    const partner = await partnerService.getOne(Number(req.params.id));
    return res.status(200).json(partner);
  };

  /** POST /api/admin/partners — 201 → Partner | 400 → enum invalide | 422 → erreurs de champ */
  static create = async (req, res) => {
    const partner = await partnerService.create(req.body);
    return res.status(201).json(partner);
  };

  /** PATCH /api/admin/partners/:id */
  static update = async (req, res) => {
    const partner = await partnerService.update(Number(req.params.id), req.body);
    return res.status(200).json(partner);
  };

  /** DELETE /api/admin/partners/:id → 204 */
  static remove = async (req, res) => {
    await partnerService.remove(Number(req.params.id));
    return res.status(204).send();
  };

  /**
   * PATCH /api/admin/partners/reorder
   * Body: { ids: number[] }  — le nouvel ordre d'affichage.
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
    await partnerService.reorder(ids);
    return res.status(204).send();
  };
}
