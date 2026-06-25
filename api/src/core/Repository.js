// ============================================================
// Repository.js — Wrapper CRUD générique au-dessus du pool MySQL.
//
// Les repositories concrets (ex. NewsletterRepository) étendent cette
// classe et passent leur tableName + EntityClass. La classe est petite
// à dessein — dès qu'une requête a besoin de JOINs ou d'un filtrage
// complexe, l'écrire directement dans la sous-classe plutôt que de
// surcharger ces helpers.
// ============================================================

import { pool } from '../config/database.js';

export class Repository {
  /**
   * @param {string} tableName - Nom de table SQL (utilisé tel quel — ne jamais y injecter d'entrée utilisateur).
   * @param {typeof import('./Entity.js').Entity} EntityClass - Sous-classe Entity pour hydrater les lignes.
   */
  constructor(tableName, EntityClass) {
    if (!tableName) throw new Error('Repository requires a tableName');
    if (!EntityClass) throw new Error('Repository requires an EntityClass');
    this.tableName = tableName;
    this.EntityClass = EntityClass;
  }

  /** Trouve une seule ligne par clé primaire. Renvoie null si non trouvée. */
  find = async (id) => {
    const [rows] = await pool.query(`SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`, [id]);
    return rows[0] ? new this.EntityClass(rows[0]) : null;
  };

  /** Trouve la première ligne correspondant à `criteria` (égalité seulement). Renvoie null sinon. */
  findOneBy = async (criteria) => {
    const { sql, values } = this._buildWhere(criteria);
    const [rows] = await pool.query(`SELECT * FROM ${this.tableName} ${sql} LIMIT 1`, values);
    return rows[0] ? new this.EntityClass(rows[0]) : null;
  };

  /** Trouve toutes les lignes correspondant à `criteria` (égalité seulement). */
  findBy = async (criteria) => {
    const { sql, values } = this._buildWhere(criteria);
    const [rows] = await pool.query(`SELECT * FROM ${this.tableName} ${sql}`, values);
    return rows.map((row) => new this.EntityClass(row));
  };

  /** Trouve toutes les lignes de la table. */
  findAll = async () => {
    const [rows] = await pool.query(`SELECT * FROM ${this.tableName}`);
    return rows.map((row) => new this.EntityClass(row));
  };

  /**
   * Plafond strict pour `findAllOrdered`. Les exports CSV admin étaient à
   * l'origine sans limite — acceptable à moins de 1 000 lignes, mais une
   * table newsletter en année 2 peut facilement contenir des dizaines de
   * milliers d'abonnés et tout charger en mémoire ferait un OOM du
   * conteneur Render. Le plafond garde l'export utilisable tout en
   * signalant (via le nombre de lignes tronquées) que le jeu de données a
   * dépassé l'export en une passe et nécessite un exporteur en streaming.
   */
  static EXPORT_HARD_CAP = 10_000;

  /**
   * Toutes les lignes triées par id DESC (les plus récentes d'abord) —
   * même tri que `findPaginated`. Utilisé par les exports CSV admin où la
   * pagination ne s'applique pas mais où le tri doit rester déterministe.
   *
   * Renvoie AU PLUS `Repository.EXPORT_HARD_CAP` lignes. Les appelants qui
   * ont besoin de toute la table pour de très gros jeux de données
   * devraient utiliser du streaming à la place.
   */
  findAllOrdered = async () => {
    const [rows] = await pool.query(`SELECT * FROM ${this.tableName} ORDER BY id DESC LIMIT ?`, [
      Repository.EXPORT_HARD_CAP,
    ]);
    return rows.map((row) => new this.EntityClass(row));
  };

  /**
   * Listing paginé trié par id DESC (les plus récents d'abord).
   * @returns {Promise<{items: any[], total: number, page: number, perPage: number, totalPages: number}>}
   */
  findPaginated = async ({ page = 1, perPage = 20 } = {}) => {
    const offset = (page - 1) * perPage;
    const [rows] = await pool.query(
      `SELECT * FROM ${this.tableName} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [perPage, offset],
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM ${this.tableName}`);
    return {
      items: rows.map((row) => new this.EntityClass(row)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  };

  /**
   * Insère (id null) ou met à jour (id défini). Mute `entity.id` après
   * l'insertion. Renvoie la même entité pour le chaînage.
   *
   * Défense en profondeur : chaque nom de colonne destiné à l'instruction
   * INSERT/UPDATE est validé contre une regex d'identifiant stricte AVANT
   * d'être interpolé. Aujourd'hui, chaque Service construit l'objet `data`
   * à partir d'une liste blanche (méthodes `_validate`), donc des noms de
   * colonne non fiables ne devraient jamais atteindre cette méthode. La
   * regex est la deuxième ligne de défense pour le jour où quelqu'un
   * oublie cette discipline — un nom de colonne comme
   * `email; DROP TABLE user --` planterait ici avec une erreur claire au
   * lieu de réécrire silencieusement le SQL.
   */
  save = async (entity) => {
    const { id, ...data } = entity;
    const safeKeys = Object.keys(data);
    for (const key of safeKeys) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
        throw new Error(
          `Repository.save: refusing to persist unsafe column name "${key}" on table "${this.tableName}". Column names must match /^[A-Za-z_][A-Za-z0-9_]*$/.`,
        );
      }
    }
    if (id) {
      const setClause = safeKeys.map((k) => `${k} = ?`).join(', ');
      await pool.query(`UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`, [
        ...Object.values(data),
        id,
      ]);
      return entity;
    }
    const columns = safeKeys.join(', ');
    const placeholders = safeKeys.map(() => '?').join(', ');
    const [result] = await pool.query(
      `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
      Object.values(data),
    );
    entity.id = result.insertId;
    return entity;
  };

  /** Supprime par id. Renvoie true quand une ligne a réellement été supprimée. */
  delete = async (id) => {
    const [result] = await pool.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  };

  /**
   * Réaffecte en masse le `display_order` des ids donnés, dans l'ordre.
   * L'ordre du tableau EST le nouveau display_order (l'id à l'index 0
   * reçoit order=0, l'id à l'index 1 reçoit order=1, …). Encapsulé dans
   * une transaction pour qu'un échec partiel ne laisse pas la table dans
   * un état à moitié trié.
   *
   * Prérequis :
   *   - Chaque id de `ids` DOIT appartenir à cette table ; les lignes non
   *     listées restent inchangées.
   *   - La table DOIT avoir une colonne `display_order`. Les repositories
   *     dont l'entité n'a pas cette colonne ne doivent pas appeler ceci.
   */
  bulkReorder = async (ids) => {
    if (!Array.isArray(ids)) throw new Error('bulkReorder: ids must be an array');
    if (ids.length === 0) return 0;
    if (!ids.every((id) => Number.isInteger(id) && id > 0)) {
      throw new Error('bulkReorder: every id must be a positive integer');
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      let updated = 0;
      for (let i = 0; i < ids.length; i++) {
        const [r] = await conn.query(
          `UPDATE ${this.tableName} SET display_order = ? WHERE id = ?`,
          [i, ids[i]],
        );
        updated += r.affectedRows;
      }
      await conn.commit();
      return updated;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  };

  /**
   * @private Construit la clause `WHERE k1 = ? AND k2 = ?` + les valeurs
   * liées à partir d'un objet criteria. Même règle de défense en
   * profondeur que `save` : chaque clé DOIT être un identifiant SQL
   * valide — l'objet criteria provient souvent d'un service qui validait
   * l'entrée utilisateur, mais un refactor futur pourrait accidentellement
   * passer `req.query` directement.
   */
  _buildWhere(criteria) {
    const keys = Object.keys(criteria);
    if (keys.length === 0) return { sql: '', values: [] };
    for (const key of keys) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
        throw new Error(
          `Repository._buildWhere: refusing to filter by unsafe column name "${key}" on table "${this.tableName}".`,
        );
      }
    }
    const sql = `WHERE ${keys.map((k) => `${k} = ?`).join(' AND ')}`;
    return { sql, values: Object.values(criteria) };
  }
}
