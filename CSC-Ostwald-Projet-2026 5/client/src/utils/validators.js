// ============================================================
// validators.js — Expressions régulières de validation des formulaires
// Utilisées dans : Footer (newsletter), Contact, InscriptionBenevolePage
// ============================================================
/**
 * Accepte les formats français :
 *   - 06 12 34 56 78
 *   - 0612345678
 *   - +33612345678
 *   - 0033612345678
 *
 * Anatomie : `^` début · `(?:\+|00)33` indicatif international · `[1-9]` pas
 * de 0 en 2ᵉ chiffre · 4 groupes de 2 chiffres séparés par espace/point/tiret.
 */
export const phoneRegex = /^(?:(?:\+|00)33|0)[1-9](?:[\s.-]?\d{2}){4}$/;
/**
 * Valide une adresse email standard : `utilisateur@domaine.extension`.
 * Regex volontairement non exhaustive — couvre les cas courants sans
 * faux positifs ni complexité excessive.
 */
export const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
