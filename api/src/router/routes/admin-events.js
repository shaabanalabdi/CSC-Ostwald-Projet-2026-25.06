// ============================================================
// admin-events.js — CRUD admin pour la table `event`.
// Toutes les routes protégées par auth.
// ============================================================

import { Router } from 'express';
import { EventAdminController } from '../../controller/EventAdminController.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';

const router = Router();
router.use(isAuthenticated);

router.get('/', EventAdminController.list);
router.get('/:id', EventAdminController.getOne);
router.post('/', EventAdminController.create);
router.patch('/:id', EventAdminController.update);
router.delete('/:id', EventAdminController.remove);

export default router;
