// ============================================================
// AdminStatsController.js — endpoint unique pour le dashboard admin.
// ============================================================

import { adminStatsService } from '../service/AdminStatsService.js';

export class AdminStatsController {
  /**
   * GET /api/admin/stats
   * 200 → { messages, benevole, newsletter, registrations,
   *         activities, events, team, partners }
   */
  static get = async (_req, res) => {
    const snapshot = await adminStatsService.getSnapshot();
    return res.status(200).json(snapshot);
  };
}
