// ============================================================
// EventAdminController.js — Couche HTTP admin des événements.
// CRUD complet : list/getOne/create/update/delete.
// ============================================================

import { eventService } from '../service/EventService.js';

export class EventAdminController {
  /**
   * GET /api/admin/events?page=1&perPage=20
   * 200 → { items, total, page, perPage, totalPages }
   */
  static list = async (req, res) => {
    const result = await eventService.listPaginated({
      page: req.query.page,
      perPage: req.query.perPage,
    });
    return res.status(200).json(result);
  };

  /** GET /api/admin/events/:id */
  static getOne = async (req, res) => {
    const event = await eventService.getOne(Number(req.params.id));
    return res.status(200).json(event);
  };

  /**
   * POST /api/admin/events
   * 201 → Event | 422 → erreurs de champ
   */
  static create = async (req, res) => {
    const event = await eventService.create(req.body);
    return res.status(201).json(event);
  };

  /**
   * PATCH /api/admin/events/:id
   * 200 → Event | 404 → introuvable | 422 → erreurs de champ
   * Validation du payload complet (même forme que create).
   */
  static update = async (req, res) => {
    const event = await eventService.update(Number(req.params.id), req.body);
    return res.status(200).json(event);
  };

  /** DELETE /api/admin/events/:id → 204 */
  static remove = async (req, res) => {
    await eventService.remove(Number(req.params.id));
    return res.status(204).send();
  };
}
