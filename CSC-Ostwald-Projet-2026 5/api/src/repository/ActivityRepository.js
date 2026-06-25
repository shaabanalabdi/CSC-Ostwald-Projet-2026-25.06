// ============================================================
// ActivityRepository.js — CRUD pour la table `activity`.
// Singleton ; ajoute `findByType` car le filtrage par type est la
// requête publique canonique (pages activités-famille / -jeunesse /
// -reguliere).
// ============================================================

import { Repository } from '../core/Repository.js';
import { Activity } from '../entity/Activity.js';
import { pool } from '../config/database.js';

class ActivityRepository extends Repository {
  constructor() {
    super('activity', Activity);
  }

  /** Filtre par activity_type — utilisé par les pages de catalogue publiques. */
  findByType = async (type) => this.findBy({ activity_type: type });

  /**
   * Requête de page publique : activités publiées d'un type donné,
   * triées par id (ordre de création) pour l'instant. Deux filtres dans
   * une seule instruction afin de ne pas récupérer les brouillons non
   * publiés pour ensuite les écarter côté client.
   *
   * @param {'famille'|'jeunesse'|'reguliere'} type
   * @returns {Promise<Activity[]>}
   */
  findPublishedByType = async (type) => {
    const [rows] = await pool.query(
      'SELECT * FROM activity WHERE activity_type = ? AND is_published = 1 ORDER BY id ASC',
      [type],
    );
    return rows.map((row) => new Activity(row));
  };

  /**
   * Listing paginé admin avec un filtre de type OPTIONNEL poussé vers le
   * SQL. Remplace l'ancien filtre côté client dans ActivityService qui
   * cassait le compteur `total` (on voyait par ex. « 3 résultats sur
   * cette page, total 60 » car le compte portait sur toutes les lignes,
   * pas sur l'ensemble filtré).
   *
   * @param {{ page?: number, perPage?: number, type?: string|null }} opts
   * @returns {Promise<{items: Activity[], total: number, page: number, perPage: number, totalPages: number}>}
   */
  findPaginatedByType = async ({ page = 1, perPage = 20, type = null } = {}) => {
    const offset = (page - 1) * perPage;
    // On pourrait composer la clause WHERE inline, mais les liaisons
    // paramétrées gardent le SQL identique entre les appels (meilleur
    // cache de requêtes préparées) et la liste des colonnes reste
    // statique, donc aucun risque d'injection sur la colonne type non plus.
    const whereSql = type ? 'WHERE activity_type = ?' : '';
    const params = type ? [type] : [];
    const [rows] = await pool.query(
      `SELECT * FROM activity ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, perPage, offset],
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM activity ${whereSql}`,
      params,
    );
    return {
      items: rows.map((row) => new Activity(row)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  };
}

export const activityRepository = new ActivityRepository();
