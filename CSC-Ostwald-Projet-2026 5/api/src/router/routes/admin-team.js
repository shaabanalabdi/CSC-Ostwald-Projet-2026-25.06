// ============================================================
// admin-team.js — CRUD admin pour la table `team_member`.
// Toutes les routes protégées par auth.
// ============================================================

import { Router } from 'express';
import { TeamMemberAdminController } from '../../controller/TeamMemberAdminController.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';

const router = Router();
router.use(isAuthenticated);

// `reorder` déclarée AVANT les routes `:id` pour qu'Express ne route pas
// le segment littéral « reorder » à travers le matcher `:id`.
router.patch('/reorder', TeamMemberAdminController.reorder);
router.get('/', TeamMemberAdminController.list);
router.get('/:id', TeamMemberAdminController.getOne);
router.post('/', TeamMemberAdminController.create);
router.patch('/:id', TeamMemberAdminController.update);
router.delete('/:id', TeamMemberAdminController.remove);

export default router;
