// ============================================================
// NewsletterAdminController.js — Couche HTTP admin pour /api/admin/newsletter.
//
// Seulement list + delete pour l'instant. Les parcours confirm /
// unconfirm vivent entièrement dans le chemin public d'inscription
// (double opt-in via lien e-mail) — les admins n'ont pas besoin de
// marquer manuellement un abonné comme confirmé.
// ============================================================

import { newsletterService } from '../service/NewsletterService.js';
import { toCsv, sendCsv } from '../utils/csv.js';

const EXPORT_COLUMNS = [
  { label: 'id', value: (r) => r.id },
  { label: 'email', value: (r) => r.email },
  { label: 'confirmé', value: (r) => (r.is_confirmed === 1 ? 'oui' : 'non') },
  { label: 'inscrit_le', value: (r) => r.subscribed_at },
  { label: 'confirmé_le', value: (r) => r.confirmed_at },
  { label: 'désinscrit_le', value: (r) => r.unsubscribed_at },
];

export class NewsletterAdminController {
  /** GET /api/admin/newsletter?page=1&perPage=20 */
  static list = async (req, res) => {
    const result = await newsletterService.listPaginated({
      page: req.query.page,
      perPage: req.query.perPage,
    });
    return res.status(200).json(result);
  };

  /** DELETE /api/admin/newsletter/:id  →  204 */
  static remove = async (req, res) => {
    await newsletterService.remove(Number(req.params.id));
    return res.status(204).send();
  };

  /** GET /api/admin/newsletter/export.csv — export complet des abonnés (CSV, UTF-8 BOM). */
  static exportCsv = async (_req, res) => {
    const subscribers = await newsletterService.exportAll();
    const csv = toCsv(subscribers, EXPORT_COLUMNS);
    return sendCsv(res, 'newsletter', csv);
  };
}
