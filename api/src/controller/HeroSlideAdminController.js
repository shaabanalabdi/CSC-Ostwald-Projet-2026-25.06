// ============================================================
// HeroSlideAdminController.js — CRUD admin pour la table `hero_slide`.
// Toutes les routes protégées par router.use(isAuthenticated) en amont.
// ============================================================

import { heroSlideService } from '../service/HeroSlideService.js';
import { BadRequestException } from '../error/HttpException.js';

export class HeroSlideAdminController {
  /** GET /api/admin/hero — toutes les slides, dans l'ordre du carrousel. */
  static list = async (req, res) => {
    const slides = await heroSlideService.listAll();
    return res.status(200).json(slides);
  };

  /** GET /api/admin/hero/:id */
  static getOne = async (req, res) => {
    const slide = await heroSlideService.getOne(Number(req.params.id));
    return res.status(200).json(slide);
  };

  /** POST /api/admin/hero → 201 */
  static create = async (req, res) => {
    const slide = await heroSlideService.create(req.body);
    return res.status(201).json(slide);
  };

  /** PATCH /api/admin/hero/:id */
  static update = async (req, res) => {
    const slide = await heroSlideService.update(Number(req.params.id), req.body);
    return res.status(200).json(slide);
  };

  /** DELETE /api/admin/hero/:id → 204 */
  static remove = async (req, res) => {
    await heroSlideService.remove(Number(req.params.id));
    return res.status(204).send();
  };

  /**
   * PATCH /api/admin/hero/reorder
   * Body: { ids: number[] } — le nouvel ordre des slides du carrousel.
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
    await heroSlideService.reorder(ids);
    return res.status(204).send();
  };
}
