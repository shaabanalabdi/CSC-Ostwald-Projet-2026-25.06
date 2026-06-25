// ============================================================
// publicFormRateLimit.js — Protection anti-spam pour les endpoints POST
// non authentifiés (newsletter, contact, bénévole).
//
// Chaque formulaire reçoit SA PROPRE instance de limiteur (compteur
// séparé) afin qu'un spammeur frappant un endpoint ne grille pas le
// budget des utilisateurs légitimes sur un autre. 5 soumissions par IP
// par heure est généreux pour de vrais utilisateurs (une personne
// remplit rarement plus d'un formulaire par jour) et tue les flots de
// bots en quelques secondes.
//
// Contrairement à `loginRateLimit`, on NE met PAS `skipSuccessfulRequests`
// ici — chaque soumission de formulaire, valide ou non, compte pour la
// limite. Un utilisateur légitime soumettant une fois n'atteindra jamais
// le plafond ; un bot soumettant 200 inscriptions newsletter
// valides-mais-spammy EST la menace contre laquelle on se protège.
//
// Le 429 renvoie l'enveloppe standard `{ message }` afin que le pipeline
// existant apiClient → ApiError → toast l'affiche sans cas particulier.
// ============================================================

import rateLimit from 'express-rate-limit';

/**
 * Options partagées par les trois limiteurs de formulaire. Chaque appel
 * `rateLimit(...)` crée SON PROPRE MemoryStore en mémoire, donc les
 * limites sont par route. Pour leur faire partager un compteur, échanger
 * l'option `store` contre un MemoryStore partagé unique — laissé de côté
 * aujourd'hui car le par-route est plus équitable.
 */
const FORM_OPTS = {
  windowMs: 60 * 60 * 1000, // 1 heure
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: 'Trop de soumissions de formulaire. Merci de patienter une heure avant de réessayer.',
  },
};

export const newsletterRateLimit = rateLimit(FORM_OPTS);

/**
 * Limiteur pour les endpoints de réinitialisation de mot de passe.
 * Fenêtre plus stricte (3 tentatives/heure) car chaque appel déclenche
 * potentiellement un envoi d'e-mail — limite les abus de la boîte mail.
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: 'Trop de tentatives. Veuillez patienter une heure avant de réessayer.',
  },
});
export const contactRateLimit = rateLimit(FORM_OPTS);
export const benevoleRateLimit = rateLimit(FORM_OPTS);

/**
 * Désinscription newsletter — compartiment séparé de `newsletterRateLimit`
 * pour que les flots d'inscription ne bloquent pas un clic légitime de
 * « cliquer pour se désinscrire ». Limite généreuse (30/heure/IP) car la
 * réponse est toujours un 200 et un appelant qui la martèle n'apprend
 * rien de nouveau (même forme qu'il soit inscrit ou non), mais la
 * plafonner tue quand même les scripts d'énumération.
 */
export const unsubscribeRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: 'Trop de demandes de désinscription. Merci de patienter avant de réessayer.',
  },
});

/**
 * Limiteur de checkout de paiement — fenêtre légèrement plus serrée que
 * les formulaires car chaque appel crée une ligne en DB + une intention
 * de checkout HelloAsso. 10 tentatives par heure par IP attrape les
 * flots de bots sans punir les nouvelles tentatives légitimes (échecs
 * HelloAsso, hoquets réseau).
 */
export const paymentCheckoutRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: 'Trop de tentatives de paiement. Merci de patienter une heure avant de réessayer.',
  },
});
