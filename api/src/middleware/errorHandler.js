// ============================================================
// errorHandler.js — Middleware d'erreur Express centralisé.
//
// DOIT être enregistré EN DERNIER dans server.js, après chaque route.
// Express le reconnaît comme un handler d'erreur car il accepte 4
// paramètres (err, req, res, next). Le `next` inutilisé est renommé
// `_next` pour que la règle ESLint `no-unused-vars` ne se plaigne pas.
// ============================================================

import { HttpException } from '../error/HttpException.js';
import { IS_PROD } from '../config/env.js';

export function errorHandler(err, req, res, _next) {
  // Les sous-classes de HttpException portent un statut HTTP + des
  // détails structurés optionnels.
  if (err instanceof HttpException) {
    return res.status(err.status).json({
      message: err.message,
      ...(err.details !== undefined && { details: err.details }),
    });
  }

  // Erreur inconnue — journalise la stack complète côté serveur. La
  // réponse ne transporte JAMAIS la stack (même en dev) parce que :
  //   1. Les stacks divulguent des chemins internes et des noms de
  //      middlewares utiles à un attaquant.
  //   2. Un développeur qui oublie de mettre NODE_ENV=production pour un
  //      déploiement public ne devrait pas être assisté en masquant la
  //      fuite — on ne divulgue tout simplement jamais.
  //   3. Le débogage local lit les stacks dans le log du serveur, pas
  //      dans le corps JSON.
  console.error(`[${new Date().toISOString()}] Unhandled error:`, err);
  const message = IS_PROD ? 'Internal Server Error' : (err?.message ?? 'Internal Server Error');
  return res.status(500).json({ message });
}
