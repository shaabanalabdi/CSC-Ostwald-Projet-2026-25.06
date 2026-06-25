// ============================================================
// admin-news.js — CRUD admin pour la table `news`. Protégée par auth.
// ============================================================

import { Router } from 'express';
import { NewsAdminController } from '../../controller/NewsAdminController.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';

const router = Router();
router.use(isAuthenticated);

router.get('/', NewsAdminController.list);
router.get('/:id', NewsAdminController.getOne);
router.post('/', NewsAdminController.create);
router.patch('/:id', NewsAdminController.update);
router.delete('/:id', NewsAdminController.remove);

export default router;
