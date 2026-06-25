// ============================================================
// ActivityAdminController.js — Couche HTTP admin des activités.
// CRUD complet : list/getOne/create/update/delete.
// ============================================================

import { activityService } from '../service/ActivityService.js';

export class ActivityAdminController {
  /**
   * GET /api/admin/activities?page=1&perPage=20&type=famille
   * 200 → { items, total, page, perPage, totalPages }
   */
  static list = async (req, res) => {
    const result = await activityService.listPaginated({
      page: req.query.page,
      perPage: req.query.perPage,
      type: req.query.type,
    });
    return res.status(200).json(result);
  };

  /** GET /api/admin/activities/:id */
  static getOne = async (req, res) => {
    const activity = await activityService.getOne(Number(req.params.id));
    return res.status(200).json(activity);
  };

  /**
   * POST /api/admin/activities
   * 201 → Activity | 400 → enum invalide | 422 → erreurs de champ
   */
  static create = async (req, res) => {
    const activity = await activityService.create(req.body);
    return res.status(201).json(activity);
  };

  /**
   * PATCH /api/admin/activities/:id
   * 200 → Activity | 404 → introuvable | 422 → erreurs de champ
   * Note : validation du payload complet (même forme que create) — la
   * prise en charge des mises à jour partielles nécessiterait un chemin
   * séparé ou un mode « fusionner avant de valider ».
   */
  static update = async (req, res) => {
    const activity = await activityService.update(Number(req.params.id), req.body);
    return res.status(200).json(activity);
  };

  /** DELETE /api/admin/activities/:id → 204 */
  static remove = async (req, res) => {
    await activityService.remove(Number(req.params.id));
    return res.status(204).send();
  };
}
