// ============================================================
// MessageAdminController.js — Couche HTTP admin pour /api/admin/messages.
//
// Séparée de MessageController (POST public /contact) pour que chaque
// contrôleur ait un public unique et que des règles de lint puissent
// plus tard restreindre les fichiers admin* à un middleware admin.
//
// Chaque route sous ce contrôleur suppose que `isAuthenticated` s'est
// exécuté en amont — le fichier de routes câble le middleware.
// ============================================================

import { messageService } from '../service/MessageService.js';
import { toCsv, sendCsv } from '../utils/csv.js';

const EXPORT_COLUMNS = [
  { label: 'id', value: (r) => r.id },
  { label: 'prenom', value: (r) => r.prenom },
  { label: 'nom', value: (r) => r.nom },
  { label: 'email', value: (r) => r.email },
  { label: 'telephone', value: (r) => r.telephone },
  { label: 'sujet', value: (r) => r.sujet },
  { label: 'message', value: (r) => r.message },
  { label: 'lu', value: (r) => (r.is_read === 1 ? 'oui' : 'non') },
  { label: 'reçu_le', value: (r) => r.created_at },
];

export class MessageAdminController {
  /**
   * GET /api/admin/messages?page=1&perPage=20
   * 200 → { items, total, page, perPage, totalPages }
   */
  static list = async (req, res) => {
    const page = req.query.page;
    const perPage = req.query.perPage;
    const result = await messageService.listPaginated({ page, perPage });
    return res.status(200).json(result);
  };

  /**
   * GET /api/admin/messages/:id
   * 200 → Message      | 404 → { message }
   */
  static getOne = async (req, res) => {
    const message = await messageService.getOne(Number(req.params.id));
    return res.status(200).json(message);
  };

  /**
   * PATCH /api/admin/messages/:id/read
   * 200 → Message (avec is_read=1)  | 404 → { message }
   */
  static markAsRead = async (req, res) => {
    const message = await messageService.markAsRead(Number(req.params.id));
    return res.status(200).json(message);
  };

  /**
   * DELETE /api/admin/messages/:id
   * 204 → no content   | 404 → { message }
   */
  static remove = async (req, res) => {
    await messageService.remove(Number(req.params.id));
    return res.status(204).send();
  };

  /** GET /api/admin/messages/export.csv — export complet des messages (CSV, UTF-8 BOM). */
  static exportCsv = async (_req, res) => {
    const messages = await messageService.exportAll();
    const csv = toCsv(messages, EXPORT_COLUMNS);
    return sendCsv(res, 'messages', csv);
  };
}
