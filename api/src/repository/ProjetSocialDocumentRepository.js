// ============================================================
// ProjetSocialDocumentRepository.js — CRUD pour projet_social_document.
// Singleton. Le Repository générique couvre tout le nécessaire (find,
// findPaginated, findAllOrdered, save, delete, bulkReorder).
// ============================================================

import { Repository } from '../core/Repository.js';
import { ProjetSocialDocument } from '../entity/ProjetSocialDocument.js';
import { pool } from '../config/database.js';

class ProjetSocialDocumentRepository extends Repository {
  constructor() {
    super('projet_social_document', ProjetSocialDocument);
  }

  /**
   * Liste publique : documents publiés seulement, triés par
   * display_order ASC. Le `findAllOrdered` de base trie par id DESC et
   * ignore le drapeau de publication, donc une requête personnalisée est
   * nécessaire ici.
   */
  findPublishedOrdered = async () => {
    const [rows] = await pool.query(
      'SELECT * FROM projet_social_document WHERE is_published = 1 ORDER BY display_order ASC, id ASC',
    );
    return rows.map((row) => new ProjetSocialDocument(row));
  };
}

export const projetSocialDocumentRepository = new ProjetSocialDocumentRepository();
