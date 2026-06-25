// ============================================================
// admin-benevole.js — CRUD admin pour benevole_application.
// Toutes les routes protégées par router.use(isAuthenticated) en tête.
// ============================================================

import { Router } from 'express';
import { BenevoleApplicationAdminController } from '../../controller/BenevoleApplicationAdminController.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';

const router = Router();
router.use(isAuthenticated);

// `/export.csv` déclarée avant toute route `:id` pour qu'Express ne
// route pas le littéral « export.csv » à travers un matcher `:id`.
router.get('/export.csv', BenevoleApplicationAdminController.exportCsv);
router.get('/', BenevoleApplicationAdminController.list);
router.get('/:id', BenevoleApplicationAdminController.getOne);
router.patch('/:id/status', BenevoleApplicationAdminController.updateStatus);
router.delete('/:id', BenevoleApplicationAdminController.remove);

export default router;
