// ============================================================
// admin-stats.js — GET /api/admin/stats. Protégée par auth.
// ============================================================

import { Router } from 'express';
import { AdminStatsController } from '../../controller/AdminStatsController.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';

const router = Router();
router.use(isAuthenticated);

router.get('/', AdminStatsController.get);

export default router;
