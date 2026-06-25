// ============================================================
// team.js — Routes publiques en lecture seule pour les membres de
// l'équipe. Pas d'auth. Utilisées par la page « Qui sommes-nous ».
// ============================================================

import { Router } from 'express';
import { TeamController } from '../../controller/TeamController.js';

const router = Router();

router.get('/', TeamController.list);

export default router;
