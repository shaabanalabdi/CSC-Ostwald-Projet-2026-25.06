// ============================================================
// testHelpers.js — Helpers partagés entre les fichiers de test
//
// `t()` fake : retourne la clé brute au lieu de la traduire.
// Permet d'asserter contre les CLÉS i18n (stables) plutôt que les
// valeurs traduites (qui changent si on retouche le JSON FR).
// ============================================================
/**
 * Fake `t` function pour les tests de schéma Zod.
 *
 * Cast `as unknown as TFunction` nécessaire car la vraie signature
 * de TFunction est complexe (overloads, returnObjects, etc.). On expose
 * juste `(key) => key` qui suffit pour valider la branche d'erreur.
 *
 * @example
 *   const schema = createContactSchema(fakeT);
 *   const result = schema.safeParse({ ... });
 *   expect(result.error?.issues[0].message).toBe('form.commun.champObligatoire');
 */
export const fakeT = (key) => key;
