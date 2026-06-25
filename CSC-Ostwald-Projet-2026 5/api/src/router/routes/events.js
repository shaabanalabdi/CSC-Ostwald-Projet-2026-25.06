// ============================================================
// events.js — Routes publiques en lecture seule pour les événements de
// l'agenda. Pas d'auth. L'agenda de la page d'accueil récupère /upcoming.
// ============================================================

import { Router } from 'express';
import { EventController } from '../../controller/EventController.js';

const router = Router();

router.get('/upcoming', EventController.listUpcoming);

export default router;
