// ============================================================
// HeroSlideController.js — Lecture publique des slides du Hero (Accueil).
// ============================================================

import { heroSlideService } from '../service/HeroSlideService.js';

export class HeroSlideController {
  /**
   * GET /api/hero
   * Slides publiées, dans l'ordre du carrousel. Pas d'auth : ne renvoie
   * que les lignes publiées (l'admin protège les brouillons).
   */
  static list = async (req, res) => {
    const slides = await heroSlideService.listPublished();
    return res.status(200).json(slides);
  };
}
