// ============================================================
// loginRateLimit.js — Protection anti-brute-force pour POST /api/auth/login.
//
// Limite chaque IP à 5 tentatives de connexion échouées par fenêtre de
// 15 minutes. Les connexions réussies ne comptent PAS
// (skipSuccessfulRequests: true) afin que les admins légitimes qui
// tapent un mauvais mot de passe une ou deux fois ne soient pas punis
// au même titre qu'un attaquant.
//
// Le limiteur renvoie un 429 avec un corps JSON qui correspond au reste
// de l'API ({ message }) afin que le pipeline d'erreur existant du
// frontend (apiClient → ApiError → toast) l'affiche sans cas particulier.
//
// Note : derrière un proxy (Render, Vercel), Express voit l'IP du proxy
// sauf si on fait confiance à l'en-tête X-Forwarded-For. server.js pose
// app.set('trust proxy', 1) — le limiteur utilise alors la vraie IP client.
// ============================================================

import rateLimit from 'express-rate-limit';

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 tentatives par fenêtre par IP
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7', // expose les en-têtes de réponse RateLimit-*
  legacyHeaders: false,
  message: {
    message: 'Trop de tentatives de connexion. Merci de patienter 15 minutes avant de réessayer.',
  },
});
