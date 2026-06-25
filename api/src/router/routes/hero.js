// ============================================================
// hero.js — Lecture publique pour /api/hero. Pas d'auth : ne renvoie
// que les slides publiées (l'admin protège les brouillons).
// ============================================================

import { Router } from 'express';
import { HeroSlideController } from '../../controller/HeroSlideController.js';

const router = Router();

router.get('/', HeroSlideController.list);

export default router;
