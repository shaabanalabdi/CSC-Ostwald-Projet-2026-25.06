// ============================================================
// admin-hero.js — CRUD admin pour la table `hero_slide`. Protégée par auth.
// ============================================================

import { Router } from 'express';
import { HeroSlideAdminController } from '../../controller/HeroSlideAdminController.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';

const router = Router();
router.use(isAuthenticated);

// `reorder` déclarée AVANT les routes `:id` pour qu'Express ne route pas
// le segment littéral « reorder » à travers le matcher `:id`.
router.patch('/reorder', HeroSlideAdminController.reorder);
router.get('/', HeroSlideAdminController.list);
router.get('/:id', HeroSlideAdminController.getOne);
router.post('/', HeroSlideAdminController.create);
router.patch('/:id', HeroSlideAdminController.update);
router.delete('/:id', HeroSlideAdminController.remove);

export default router;
