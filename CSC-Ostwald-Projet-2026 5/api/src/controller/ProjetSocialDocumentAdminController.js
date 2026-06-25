// ============================================================
// ProjetSocialDocumentAdminController.js — CRUD admin + reorder.
// Toutes les routes protégées par isAuthenticated en amont (fichier de routes).
// ============================================================

import { projetSocialDocumentService } from '../service/ProjetSocialDocumentService.js';
import { BadRequestException } from '../error/HttpException.js';

export class ProjetSocialDocumentAdminController {
  /** GET /api/admin/projet-social/documents?page=&perPage= */
  static list = async (req, res) => {
    const result = await projetSocialDocumentService.listPaginated({
      page: req.query.page,
      perPage: req.query.perPage,
    });
    return res.status(200).json(result);
  };

  /** GET /api/admin/projet-social/documents/:id */
  static getOne = async (req, res) => {
    const doc = await projetSocialDocumentService.getOne(Number(req.params.id));
    return res.status(200).json(doc);
  };

  /** POST /api/admin/projet-social/documents */
  static create = async (req, res) => {
    const doc = await projetSocialDocumentService.create(req.body);
    return res.status(201).json(doc);
  };

  /** PATCH /api/admin/projet-social/documents/:id */
  static update = async (req, res) => {
    const doc = await projetSocialDocumentService.update(Number(req.params.id), req.body);
    return res.status(200).json(doc);
  };

  /** DELETE /api/admin/projet-social/documents/:id → 204 */
  static remove = async (req, res) => {
    await projetSocialDocumentService.remove(Number(req.params.id));
    return res.status(204).send();
  };

  /**
   * PATCH /api/admin/projet-social/documents/reorder
   * Body: { ids: number[] }
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
    await projetSocialDocumentService.reorder(ids);
    return res.status(204).send();
  };
}
