// ============================================================
// ActivityController.js — Couche HTTP publique des activités.
//
// Endpoint unique alimentant les pages /famille et /jeunesse. Renvoie
// les activités publiées du type demandé, triées par id ASC.
// 400 sur un type inconnu pour que l'appelant repère vite les fautes.
// ============================================================

import { activityService } from '../service/ActivityService.js';

export class ActivityController {
  /**
   * GET /api/activities?type=famille|jeunesse|reguliere
   * 200 → Activity[] (seulement les lignes is_published=1)
   * 400 → { message } quand `type` est absent ou inconnu
   */
  static list = async (req, res) => {
    const activities = await activityService.listPublishedByType(req.query.type);
    return res.status(200).json(activities);
  };
}
