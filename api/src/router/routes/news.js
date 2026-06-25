// ============================================================
// news.js — Lecture publique pour /api/news. Pas d'auth : ne renvoie
// que les lignes publiées (l'admin protège les lignes non publiées /
// brouillon).
// ============================================================

import { Router } from 'express';
import { NewsController } from '../../controller/NewsController.js';

const router = Router();

router.get('/', NewsController.list);

export default router;
