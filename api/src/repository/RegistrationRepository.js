// ============================================================
// RegistrationRepository.js — CRUD pour la table `registration`.
//
// Ajoute `findPaginatedWithActivity` : la liste admin veut le titre de
// l'activité à côté de chaque inscription, ce que Repository.findPaginated
// (requête mono-table) ne peut pas fournir. Le JOIN personnalisé garde
// la taille de page performante — récupérer les lignes d'activité par
// inscription dans une boucle serait du N+1.
// ============================================================

import { Repository } from '../core/Repository.js';
import { Registration } from '../entity/Registration.js';
import { pool } from '../config/database.js';

class RegistrationRepository extends Repository {
  constructor() {
    super('registration', Registration);
  }

  /**
   * Liste paginée avec le titre de l'activité joint — utilisée par le
   * dashboard admin. Renvoie la même forme que Repository.findPaginated,
   * chaque élément portant un champ supplémentaire `activity_title`.
   */
  // findPaginatedWithActivity : liste paginée avec JOIN sur activity.
  findPaginatedWithActivity = async ({ page = 1, perPage = 20 } = {}) => {
    const offset = (page - 1) * perPage;
    const [rows] = await pool.query(
      `SELECT r.*, a.title AS activity_title, a.activity_type AS activity_type
         FROM registration r
         LEFT JOIN activity a ON a.id = r.activity_id
         ORDER BY r.id DESC
         LIMIT ? OFFSET ?`,
      [perPage, offset],
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM registration');
    return {
      items: rows.map((row) => new Registration(row)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  };

  /**
   * Les webhooks HelloAsso s'appuient sur l'id de transaction. Le
   * rechercher nous permet d'implémenter l'idempotence (même webhook
   * livré deux fois → pas de ligne en double).
   */
  findByHelloAssoTransactionId = async (transactionId) =>
    this.findOneBy({ helloasso_transaction_id: transactionId });

  /**
   * Toutes les inscriptions avec le titre de l'activité joint — utilisé
   * par l'export CSV admin. Les plus récentes d'abord. Plafonné à
   * `Repository.EXPORT_HARD_CAP` afin qu'un export incontrôlé ne fasse
   * pas un OOM du conteneur (les données financières ont tendance à
   * croître plus vite que l'équipe ne le réalise — les comptables
   * adorent l'historique).
   */
  findAllOrderedWithActivity = async () => {
    const [rows] = await pool.query(
      `SELECT r.*, a.title AS activity_title, a.activity_type AS activity_type
         FROM registration r
         LEFT JOIN activity a ON a.id = r.activity_id
         ORDER BY r.id DESC
         LIMIT ?`,
      [Repository.EXPORT_HARD_CAP],
    );
    return rows.map((row) => new Registration(row));
  };
}

export const registrationRepository = new RegistrationRepository();
