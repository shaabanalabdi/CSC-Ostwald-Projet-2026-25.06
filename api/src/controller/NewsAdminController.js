// ============================================================
// NewsAdminController.js — CRUD admin pour la table `news`.
// Toutes les routes protégées par router.use(isAuthenticated) en amont.
// ============================================================

import { newsService } from '../service/NewsService.js';

export class NewsAdminController {
  /** GET /api/admin/news?page=&perPage= */
  static list = async (req, res) => {
    const result = await newsService.listPaginated({
      page: req.query.page,
      perPage: req.query.perPage,
    });
    return res.status(200).json(result);
  };

  /** GET /api/admin/news/:id */
  static getOne = async (req, res) => {
    const news = await newsService.getOne(Number(req.params.id));
    return res.status(200).json(news);
  };

  /** POST /api/admin/news */
  static create = async (req, res) => {
    const news = await newsService.create(req.body);
    return res.status(201).json(news);
  };

  /** PATCH /api/admin/news/:id */
  static update = async (req, res) => {
    const news = await newsService.update(Number(req.params.id), req.body);
    return res.status(200).json(news);
  };

  /** DELETE /api/admin/news/:id → 204 */
  static remove = async (req, res) => {
    await newsService.remove(Number(req.params.id));
    return res.status(204).send();
  };
}
