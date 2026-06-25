// ============================================================
// admin-activities.js — CRUD admin pour la table `activity`.
// Toutes les routes protégées par auth.
// ============================================================

import { Router } from 'express';
import { ActivityAdminController } from '../../controller/ActivityAdminController.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';

const router = Router();
router.use(isAuthenticated);

router.get('/', ActivityAdminController.list);
router.get('/:id', ActivityAdminController.getOne);
router.post('/', ActivityAdminController.create);
router.patch('/:id', ActivityAdminController.update);
router.delete('/:id', ActivityAdminController.remove);

export default router;
