// ============================================================
// admin-partners.js — CRUD admin pour la table `partner`.
// Toutes les routes protégées par auth.
// ============================================================

import { Router } from 'express';
import { PartnerAdminController } from '../../controller/PartnerAdminController.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';

const router = Router();
router.use(isAuthenticated);

// `reorder` déclarée AVANT les routes `:id` pour qu'Express ne route pas
// le segment littéral « reorder » à travers le matcher `:id`.
router.patch('/reorder', PartnerAdminController.reorder);
router.get('/', PartnerAdminController.list);
router.get('/:id', PartnerAdminController.getOne);
router.post('/', PartnerAdminController.create);
router.patch('/:id', PartnerAdminController.update);
router.delete('/:id', PartnerAdminController.remove);

export default router;
