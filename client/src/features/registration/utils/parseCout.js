// ============================================================
// parseCout — Convertit le champ texte libre `cout` de l'API activité
// en un montant entier en centimes, adapté au checkout HelloAsso.
//
// La table activity stocke `cout` en chaînes humaines (« Gratuit »,
// « 5€ », « 5,50 € », « 10 EUR »), conservées ainsi pour que les cartes
// Jeunesse/Famille affichent le même libellé que celui saisi par les
// admins. L'inscription en ligne a besoin d'un entier strict en
// centimes — ce parser fait le pont entre les deux.
//
// Renvoie `null` si la chaîne ne peut pas être parsée : les appelants
// DOIVENT masquer le bouton d'inscription dans ce cas plutôt que
// d'envoyer 0 par défaut.
// ============================================================
const GRATUIT_PATTERNS = /^(gratuit|free|libre|sans frais|0)$/i;
export function parseCoutToCents(cout) {
  if (cout == null) return null;
  const trimmed = cout.trim();
  if (trimmed === '') return null;
  if (GRATUIT_PATTERNS.test(trimmed)) return 0;
  // Correspond à « 5 », « 5€ », « 5 € », « 5,50€ », « 5.50 EUR », « 5 euros »
  const match = trimmed.match(/(\d+)(?:[.,](\d{1,2}))?\s*(?:€|eur(?:os?)?)?/i);
  if (!match) return null;
  const euros = Number(match[1]);
  const centsPart = match[2] ?? '';
  const cents = centsPart.length === 1 ? Number(centsPart) * 10 : Number(centsPart || 0);
  if (!Number.isFinite(euros) || !Number.isFinite(cents)) return null;
  return euros * 100 + cents;
}
