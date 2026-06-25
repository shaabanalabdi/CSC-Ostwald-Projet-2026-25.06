// ============================================================
// BenevoleApplicationAdminController.js — Couche HTTP admin.
//
// Même forme que MessageAdminController. L'endpoint de changement de
// statut prend la nouvelle valeur dans le corps plutôt que dans l'URL,
// ce qui permet d'ajouter de futurs statuts sans faire grossir la table
// de routes.
// ============================================================

import { benevoleApplicationService } from '../service/BenevoleApplicationService.js';
import { toCsv, sendCsv } from '../utils/csv.js';

// Les colonnes JSON (domaines, competences, jours, plages) s'hydratent en
// tableaux JS grâce à mysql2 — toCsv() les joint avec « , » dans une
// cellule entre guillemets.
const EXPORT_COLUMNS = [
  { label: 'id', value: (r) => r.id },
  { label: 'prenom', value: (r) => r.prenom },
  { label: 'nom', value: (r) => r.nom },
  { label: 'email', value: (r) => r.email },
  { label: 'telephone', value: (r) => r.telephone },
  { label: 'domaines', value: (r) => r.domaines },
  { label: 'competences', value: (r) => r.competences },
  { label: 'jours', value: (r) => r.jours },
  { label: 'plages', value: (r) => r.plages },
  { label: 'message', value: (r) => r.message },
  { label: 'statut', value: (r) => r.status },
  { label: 'reçu_le', value: (r) => r.created_at },
];

export class BenevoleApplicationAdminController {
  /** GET /api/admin/benevole?page=1&perPage=20 */
  static list = async (req, res) => {
    const result = await benevoleApplicationService.listPaginated({
      page: req.query.page,
      perPage: req.query.perPage,
    });
    return res.status(200).json(result);
  };

  /** GET /api/admin/benevole/:id */
  static getOne = async (req, res) => {
    const app = await benevoleApplicationService.getOne(Number(req.params.id));
    return res.status(200).json(app);
  };

  /**
   * PATCH /api/admin/benevole/:id/status
   * Body: { status: 'new' | 'contacted' | 'rejected' }
   * 200 → candidature mise à jour | 400 → enum invalide | 404 → introuvable
   */
  static updateStatus = async (req, res) => {
    const app = await benevoleApplicationService.updateStatus(
      Number(req.params.id),
      req.body?.status,
    );
    return res.status(200).json(app);
  };

  /** DELETE /api/admin/benevole/:id  →  204 */
  static remove = async (req, res) => {
    await benevoleApplicationService.remove(Number(req.params.id));
    return res.status(204).send();
  };

  /** GET /api/admin/benevole/export.csv — export complet des candidatures (CSV, UTF-8 BOM). */
  static exportCsv = async (_req, res) => {
    const applications = await benevoleApplicationService.exportAll();
    const csv = toCsv(applications, EXPORT_COLUMNS);
    return sendCsv(res, 'benevoles', csv);
  };
}
