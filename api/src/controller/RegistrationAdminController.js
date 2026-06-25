// ============================================================
// RegistrationAdminController.js — Couche HTTP admin des inscriptions.
// Même forme que les autres contrôleurs admin.
// ============================================================

import { registrationService } from '../service/RegistrationService.js';
import { toCsv, sendCsv } from '../utils/csv.js';

const EXPORT_COLUMNS = [
  { label: 'id', value: (r) => r.id },
  { label: 'prenom', value: (r) => r.prenom },
  { label: 'nom', value: (r) => r.nom },
  { label: 'email', value: (r) => r.email },
  { label: 'activité_id', value: (r) => r.activity_id },
  { label: 'activité', value: (r) => r.activity_title },
  { label: 'montant_EUR', value: (r) => (r.amount_cents / 100).toFixed(2) },
  { label: 'statut', value: (r) => r.status },
  { label: 'helloasso_tx_id', value: (r) => r.helloasso_transaction_id },
  { label: 'inscrit_le', value: (r) => r.created_at },
];

export class RegistrationAdminController {
  /** GET /api/admin/registrations?page=&perPage= */
  static list = async (req, res) => {
    const result = await registrationService.listPaginated({
      page: req.query.page,
      perPage: req.query.perPage,
    });
    return res.status(200).json(result);
  };

  /** GET /api/admin/registrations/:id */
  static getOne = async (req, res) => {
    const reg = await registrationService.getOne(Number(req.params.id));
    return res.status(200).json(reg);
  };

  /**
   * PATCH /api/admin/registrations/:id/status
   * Body: { status: 'pending' | 'paid' | 'refunded' }
   */
  static updateStatus = async (req, res) => {
    const reg = await registrationService.updateStatus(Number(req.params.id), req.body?.status);
    return res.status(200).json(reg);
  };

  /** DELETE /api/admin/registrations/:id → 204 */
  static remove = async (req, res) => {
    await registrationService.remove(Number(req.params.id));
    return res.status(204).send();
  };

  /** GET /api/admin/registrations/export.csv — export complet des inscriptions (CSV, UTF-8 BOM). */
  static exportCsv = async (_req, res) => {
    const registrations = await registrationService.exportAll();
    const csv = toCsv(registrations, EXPORT_COLUMNS);
    return sendCsv(res, 'inscriptions', csv);
  };
}
