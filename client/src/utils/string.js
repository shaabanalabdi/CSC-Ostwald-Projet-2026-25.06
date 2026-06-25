// ============================================================
// string.js — Utilitaires de manipulation de chaînes
// Utilisé par : SearchBar (comparaison de saisie) et searchIndex (mots-clés)
// ============================================================
/**
 * Supprime les accents et met en minuscule. Permet la recherche sans
 * distinction d'accents.
 *
 * @example
 *   normalize('Réservé') // → 'reserve'
 *   normalize('Été')     // → 'ete'
 *
 * Étapes :
 *   1. `toLowerCase()`    → met tout en minuscule
 *   2. `normalize('NFD')` → décompose les caractères accentués en base + accent
 *   3. `replace(...)`     → supprime tous les caractères de la plage Unicode
 *                           U+0300–U+036F (combining diacritical marks)
 */
export function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
