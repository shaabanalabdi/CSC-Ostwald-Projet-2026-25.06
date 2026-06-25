// ============================================================
// payment.js — Routes du parcours de paiement public.
// PAS de isAuthenticated — elles sont appelées par des utilisateurs
// anonymes achetant une inscription à une activité Jeunesse.
// ============================================================

import { Router } from 'express';
import { PaymentController } from '../../controller/PaymentController.js';
import { paymentCheckoutRateLimit } from '../../middleware/publicFormRateLimit.js';

const router = Router();

// Utilisateur anonyme → POST checkout → reçoit une URL redirigeable.
// Rate-limité (10/heure/IP) pour qu'un bot ne puisse pas inonder les
// inscriptions en attente ni épuiser le quota HelloAsso.
router.post('/checkout', paymentCheckoutRateLimit, PaymentController.checkout);

// Le frontend lit ceci pour savoir où pointent les URLs de succès / annulation.
router.get('/return-urls', PaymentController.returnUrls);

// Mock réservé au dev : remplace la redirection externe de HelloAsso.
router.get('/mock-success', PaymentController.mockSuccess);

// Callback du vrai webhook HelloAsso.
router.post('/webhook', PaymentController.webhook);

export default router;
