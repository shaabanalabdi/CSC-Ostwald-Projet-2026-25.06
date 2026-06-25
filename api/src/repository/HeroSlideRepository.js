// ============================================================
// HeroSlideRepository.js — CRUD pour la table `hero_slide`.
// Singleton. Deux requêtes ordonnées personnalisées :
//   - findPublishedOrdered : carrousel public (publiées seulement)
//   - findAllOrdered       : liste admin (toutes, ordre d'affichage)
// Les deux trient par display_order ASC (id ASC en départage stable),
// ce qui correspond à l'ordre du carrousel piloté par l'admin.
// ============================================================

import { Repository } from '../core/Repository.js';
import { HeroSlide } from '../entity/HeroSlide.js';
import { pool } from '../config/database.js';

class HeroSlideRepository extends Repository {
  constructor() {
    super('hero_slide', HeroSlide);
  }

  /** Public — slides publiées, dans l'ordre du carrousel. */
  findPublishedOrdered = async () => {
    const [rows] = await pool.query(
      'SELECT * FROM hero_slide WHERE is_published = 1 ORDER BY display_order ASC, id ASC',
    );
    return rows.map((row) => new HeroSlide(row));
  };

  /** Admin — toutes les slides, dans l'ordre du carrousel (brouillons inclus). */
  findAllOrdered = async () => {
    const [rows] = await pool.query('SELECT * FROM hero_slide ORDER BY display_order ASC, id ASC');
    return rows.map((row) => new HeroSlide(row));
  };
}

export const heroSlideRepository = new HeroSlideRepository();
