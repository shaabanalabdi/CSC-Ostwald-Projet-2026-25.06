// ============================================================
// ProjetSocialDocumentController.js — Lecture publique des documents
// affichés sur la page « Projet Social ». Seules les lignes
// `is_published = 1` apparaissent ici ; les admins utilisent le
// contrôleur admin dédié pour le CRUD.
// ============================================================

import { projetSocialDocumentService } from '../service/ProjetSocialDocumentService.js';

export class ProjetSocialDocumentController {
  /** GET /api/projet-social/documents → documents publiés, ordonnés. */
  static list = async (_req, res) => {
    const docs = await projetSocialDocumentService.listPublished();
    return res.status(200).json(docs);
  };
}
