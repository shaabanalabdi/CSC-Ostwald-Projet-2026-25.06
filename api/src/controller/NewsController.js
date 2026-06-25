// ============================================================
// NewsController.js — Liste publique des actualités publiées (section Accueil).
// ============================================================

import { newsService } from '../service/NewsService.js';

export class NewsController {
  /**
   * GET /api/news?limit=4
   * Actualités publiées, les plus récentes d'abord. La limite plafonne
   * le nombre de cartes (la section de la page d'accueil en utilise ~2-4
   * en général).
   */
  static list = async (req, res) => {
    const news = await newsService.listPublished({ limit: req.query.limit });
    return res.status(200).json(news);
  };
}
