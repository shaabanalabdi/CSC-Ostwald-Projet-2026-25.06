// ============================================================
// projet-social.js — Lecture publique pour /api/projet-social/documents.
// Pas d'auth : n'expose que les lignes `is_published = 1`.
// ============================================================

import { Router } from 'express';
import { ProjetSocialDocumentController } from '../../controller/ProjetSocialDocumentController.js';

const router = Router();

router.get('/documents', ProjetSocialDocumentController.list);

export default router;
