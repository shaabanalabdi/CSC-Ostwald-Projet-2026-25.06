// ============================================================
// dates.js — Utilitaires de gestion des dates en français
//
// Utilisé par AgendaEvenements.jsx pour filtrer automatiquement les
// événements passés et ne garder que les événements à venir.
// ============================================================
/** Table de correspondance mois français → index JS (0 = janvier). */
const MOIS = {
  janvier: 0,
  février: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  août: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  décembre: 11,
};
/**
 * Convertit une date française "18 juillet 2026" en objet `Date`.
 * Retourne `null` si le format n'est pas reconnu (ex: "Chaque semaine",
 * "Chaque mois" → événements récurrents, jamais archivés).
 *
 * Accepte aussi `null` / `undefined` / chaîne vide pour gérer les
 * propriétés `event.date` potentiellement manquantes.
 */
export function parseDateFR(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.toLowerCase().trim().split(/\s+/);
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  // Cast contrôlé : on essaie d'indexer ; si la chaîne n'est pas un mois
  // valide, l'accès retourne `undefined` et le garde `isNaN(month)` rejette.
  const month = MOIS[parts[1]];
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || month === undefined || isNaN(year)) return null;
  return new Date(year, month, day);
}
/**
 * Retourne `true` si l'événement est passé (date strictement avant
 * aujourd'hui, comparaison sur minuit 00:00:00).
 *
 * Les événements récurrents (date non parsable, ex: "Chaque semaine")
 * ne sont jamais considérés comme passés.
 */
export function isEventPast(dateStr) {
  const date = parseDateFR(dateStr);
  if (!date) return false; // Récurrents → toujours visibles
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}
