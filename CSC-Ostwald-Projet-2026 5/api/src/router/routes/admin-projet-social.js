// ============================================================
// admin-projet-social.js — CRUD admin pour projet_social_document.
// Toutes les routes protégées par router.use(isAuthenticated).
// ============================================================

import { Router } from 'express';
import { ProjetSocialDocumentAdminController } from '../../controller/ProjetSocialDocumentAdminController.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';

const router = Router();
router.use(isAuthenticated);

// `reorder` déclarée AVANT `:id` pour qu'Express ne route pas le segment
// littéral « reorder » à travers le matcher `:id`.
router.patch('/documents/reorder', ProjetSocialDocumentAdminController.reorder);
router.get('/documents', ProjetSocialDocumentAdminController.list);
router.get('/documents/:id', ProjetSocialDocumentAdminController.getOne);
router.post('/documents', ProjetSocialDocumentAdminController.create);
router.patch('/documents/:id', ProjetSocialDocumentAdminController.update);
router.delete('/documents/:id', ProjetSocialDocumentAdminController.remove);

export default router;
