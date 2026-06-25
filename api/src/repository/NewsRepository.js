// ============================================================
// NewsRepository.js — CRUD pour la table `news`.
// Singleton. Requête personnalisée pour le listing public : publiées
// seulement, les plus récentes d'abord.
// ============================================================

import { Repository } from '../core/Repository.js';
import { News } from '../entity/News.js';
import { pool } from '../config/database.js';

class NewsRepository extends Repository {
  constructor() {
    super('news', News);
  }

  /**
   * Listing public — actualités publiées triées par date_published DESC
   * (les plus récentes d'abord). Une limite optionnelle plafonne la page
   * d'accueil aux quelques dernières cartes afin que la section ne
   * grandisse pas sans fin.
   */
  findPublishedOrdered = async ({ limit = null } = {}) => {
    const sql = `SELECT * FROM news WHERE is_published = 1 ORDER BY date_published DESC, id DESC${
      limit ? ' LIMIT ?' : ''
    }`;
    const params = limit ? [limit] : [];
    const [rows] = await pool.query(sql, params);
    return rows.map((row) => new News(row));
  };
}

export const newsRepository = new NewsRepository();
