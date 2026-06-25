// ============================================================
// newsletter.js — Express Router pour /api/newsletter.
// Monté par router/index.js sous le préfixe /newsletter.
//
// Rate-limité (5 soumissions / heure / IP) pour dissuader le spam de
// liste de diffusion — sinon les bots inscrivent des milliers
// d'adresses jetables.
// ============================================================

import { Router } from 'express';
import { NewsletterController } from '../../controller/NewsletterController.js';
import { newsletterRateLimit, unsubscribeRateLimit } from '../../middleware/publicFormRateLimit.js';

const router = Router();

router.post('/', newsletterRateLimit, NewsletterController.subscribe);

// Confirmation du double opt-in. Rate-limitée sous le même compartiment
// que subscribe pour qu'un brute-forcer ne puisse pas énumérer les
// tokens — à 5/heure il lui faudrait des siècles pour trouver un seul
// token de 64 caractères hex.
router.get('/confirm', newsletterRateLimit, NewsletterController.confirm);

// Désinscription (CNIL / RGPD). Rate-limite généreuse (30/heure/IP) — la
// réponse est identique que l'e-mail soit fiché ou non, donc un appelant
// n'apprend rien de la réponse, mais le plafond tue les scripts
// d'énumération.
router.post('/unsubscribe', unsubscribeRateLimit, NewsletterController.unsubscribe);

export default router;
