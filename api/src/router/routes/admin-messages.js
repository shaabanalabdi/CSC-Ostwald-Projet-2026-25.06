// ============================================================
// admin-messages.js — CRUD admin pour la table `message`.
//
// Les quatre routes sont protégées par isAuthenticated (middleware au
// niveau du routeur). Une seule déclaration → aucune route ici ne peut
// être ajoutée par erreur sans auth.
// ============================================================

import { Router } from 'express';
import { MessageAdminController } from '../../controller/MessageAdminController.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';

const router = Router();

// Toutes les routes admin exigent un cookie JWT valide. Appliqué à tout
// le routeur pour que les ajouts futurs héritent de la garde.
router.use(isAuthenticated);

// `/export.csv` déclarée avant toute route `:id` pour qu'Express ne
// route pas le littéral « export.csv » à travers un matcher `:id`.
router.get('/export.csv', MessageAdminController.exportCsv);
router.get('/', MessageAdminController.list);
router.get('/:id', MessageAdminController.getOne);
router.patch('/:id/read', MessageAdminController.markAsRead);
router.delete('/:id', MessageAdminController.remove);

export default router;
