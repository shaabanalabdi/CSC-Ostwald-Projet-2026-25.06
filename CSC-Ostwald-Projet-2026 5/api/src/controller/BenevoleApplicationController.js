// ============================================================
// BenevoleApplicationController.js — Couche HTTP pour /api/benevole.
// ============================================================

import { benevoleApplicationService } from '../service/BenevoleApplicationService.js';

export class BenevoleApplicationController {
  /**
   * POST /api/benevole
   * Body: { nom, prenom, email, telephone?, domaines, competences,
   *         jours, plages, message? }
   * 201 → { id }
   * 422 → { message, details: { fields } }
   */
  static apply = async (req, res) => {
    const result = await benevoleApplicationService.apply(req.body);
    return res.status(201).json(result);
  };
}
