// ============================================================
// activities.js — Route publique en lecture seule pour les activités.
// Pas d'auth. Utilisée par les pages publiques /famille et /jeunesse.
// ============================================================

import { Router } from 'express';
import { ActivityController } from '../../controller/ActivityController.js';

const router = Router();

router.get('/', ActivityController.list);

export default router;
