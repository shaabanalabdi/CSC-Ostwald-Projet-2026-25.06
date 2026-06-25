// ============================================================
// auth.js — Express Router pour /api/auth/*.
//
// /me utilise le middleware isAuthenticated pour que les appelants
// anonymes reçoivent un 401 propre au lieu d'un corps vide ou d'un 500.
// /forgot-password et /reset-password utilisent publicFormRateLimit
// pour éviter les abus (envois massifs d'e-mails ou tentatives de
// brute-force sur les tokens).
// ============================================================

import { Router } from 'express';
import { AuthController } from '../../controller/AuthController.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';
import { loginRateLimit } from '../../middleware/loginRateLimit.js';
import { passwordResetRateLimit } from '../../middleware/publicFormRateLimit.js';

const router = Router();

router.post('/login', loginRateLimit, AuthController.signIn);
router.post('/logout', AuthController.signOut);
router.get('/me', isAuthenticated, AuthController.me);
router.post('/forgot-password', passwordResetRateLimit, AuthController.forgotPassword);
router.post('/reset-password', passwordResetRateLimit, AuthController.resetPassword);

export default router;
