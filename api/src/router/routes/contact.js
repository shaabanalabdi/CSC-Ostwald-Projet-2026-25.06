// ============================================================
// contact.js — Express Router pour /api/contact.
// Monté par router/index.js.
//
// Rate-limité (5 soumissions / heure / IP) — le formulaire de contact
// est la cible classique du spam, donc on plafonne les soumissions
// avant qu'elles n'atteignent la boîte de réception.
// ============================================================

import { Router } from 'express';
import { MessageController } from '../../controller/MessageController.js';
import { contactRateLimit } from '../../middleware/publicFormRateLimit.js';

const router = Router();

router.post('/', contactRateLimit, MessageController.submit);

export default router;
