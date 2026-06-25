// ============================================================
// benevole.js — Express Router pour /api/benevole.
//
// Rate-limité (5 soumissions / heure / IP) — les candidatures bénévoles
// sont rares en usage normal, donc tout ce qui dépasse 5/heure est
// presque certainement un bot ou un fixture de test.
// ============================================================

import { Router } from 'express';
import { BenevoleApplicationController } from '../../controller/BenevoleApplicationController.js';
import { benevoleRateLimit } from '../../middleware/publicFormRateLimit.js';

const router = Router();

router.post('/', benevoleRateLimit, BenevoleApplicationController.apply);

export default router;
