// ============================================================
// features.js — Drapeaux de fonctionnalités (feature flags).
//
// Lus UNE fois depuis les variables d'environnement Vite au build. Un
// drapeau est désactivé UNIQUEMENT quand sa variable vaut exactement la
// chaîne "false" — non défini ou "true" => activé. Cela garde le défaut
// (tout activé) sûr pour le dev et les tests ; la production met les
// variables à "false" via `.env.production`.
//
// ⚠️ Synchronisation côté serveur :
//   - VITE_PAYMENTS_ENABLED   ↔  PAYMENTS_ENABLED  (api/src/config/helloasso.js)
//   Les deux DOIVENT avoir la même valeur sur un déploiement donné, sinon
//   l'UI proposerait un parcours que l'API ne sert pas (ou l'inverse).
// ============================================================

/** true sauf si la variable d'env vaut littéralement "false". */
const isEnabled = (envValue) => String(envValue ?? 'true').toLowerCase() !== 'false';

/**
 * Inscription + paiement Jeunesse via HelloAsso. Mettre VITE_PAYMENTS_ENABLED
 * à "false" pour mettre le site en ligne AVANT que le compte HelloAsso ne
 * soit prêt : le bouton « S'inscrire » des activités Jeunesse est masqué et
 * la page /inscription-jeunesse affiche un message « bientôt disponible ».
 */
export const PAYMENTS_ENABLED = isEnabled(import.meta.env.VITE_PAYMENTS_ENABLED);

/**
 * Formulaire d'inscription à la newsletter (pied de page). Mettre
 * VITE_NEWSLETTER_ENABLED à "false" tant qu'aucun fournisseur SMTP n'est
 * branché : sans envoi d'e-mail, le double opt-in ne peut pas être confirmé.
 * Le formulaire est alors retiré du Footer ; le reste du site est inchangé.
 */
export const NEWSLETTER_ENABLED = isEnabled(import.meta.env.VITE_NEWSLETTER_ENABLED);
