// ============================================================
// partners.js — Routes publiques en lecture seule pour les partenaires.
// Pas d'auth. Utilisées par la page d'accueil + la page « Nos partenaires ».
// ============================================================

import { Router } from 'express';
import { PartnerController } from '../../controller/PartnerController.js';

const router = Router();

router.get('/', PartnerController.list);

export default router;
