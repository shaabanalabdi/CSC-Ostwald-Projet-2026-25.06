// ============================================================
// contact.schema.js — Schéma Zod du formulaire de contact
//
// Champs :
//   - prenom, nom         (obligatoires, 2–80 caractères)
//   - email               (obligatoire, regex)
//   - telephone           (optionnel — validé SEULEMENT si renseigné)
//   - sujet               (obligatoire, enum strict des 5 options)
//   - message             (obligatoire, 10–1000 caractères)
//   - rgpdConsent         (obligatoire — case à cocher)
//
// ⚠️ Les bornes de longueur vivent dans `CONTACT_LIMITS` (ci-dessous) et
//    DOIVENT rester identiques à `LIMITS` de api/src/service/MessageService.js.
//    Le test api/src/service/__tests__/validation-sync.test.js échoue si les
//    deux divergent (sinon : saisie acceptée ici, mais rejetée en 422).
//
// `t` est passé en paramètre pour produire des messages d'erreur traduits.
// ============================================================
import { z } from 'zod';
import { emailRegex, phoneRegex } from '@utils/validators';
/**
 * Sujets autorisés dans le <select>. Le champ est un enum littéral
 * (pas une string libre) pour empêcher toute valeur de fuiter côté serveur
 * une fois le backend connecté.
 */
export const CONTACT_SUBJECTS = [
  'renseignement',
  'inscription',
  'benevole',
  'partenariat',
  'autre',
];
/**
 * Bornes de longueur des champs — SOURCE UNIQUE côté frontend. Le schéma Zod
 * ci-dessous en est construit, et validation-sync.test.js (côté api) vérifie
 * qu'elles restent identiques à `LIMITS` de MessageService.js.
 */
export const CONTACT_LIMITS = {
  prenom: { min: 2, max: 80 },
  nom: { min: 2, max: 80 },
  email: { max: 100 },
  telephone: { max: 20 },
  message: { min: 10, max: 1000 },
};
/** Construit le schéma contact avec des messages d'erreur traduits. */
export const createContactSchema = (t) =>
  z.object({
    prenom: z
      .string()
      .trim()
      .min(1, t('form.commun.champObligatoire'))
      .min(CONTACT_LIMITS.prenom.min)
      .max(CONTACT_LIMITS.prenom.max),
    nom: z
      .string()
      .trim()
      .min(1, t('form.commun.champObligatoire'))
      .min(CONTACT_LIMITS.nom.min)
      .max(CONTACT_LIMITS.nom.max),
    email: z
      .string()
      .trim()
      .min(1, t('form.commun.emailInvalide'))
      .regex(emailRegex, t('form.commun.emailInvalide'))
      .max(CONTACT_LIMITS.email.max),
    // Optionnel : on accepte la chaîne vide, mais si elle est non vide
    // elle DOIT respecter le format français.
    telephone: z
      .string()
      .trim()
      .max(CONTACT_LIMITS.telephone.max)
      .refine((v) => v === '' || phoneRegex.test(v), { message: t('form.commun.telInvalide') }),
    // `z.string().refine` plutôt que `z.enum` direct : autorise `''` comme
    // valeur initiale (`<option value="">…</option>` du select), tout en
    // restreignant la valeur post-validation au tuple `CONTACT_SUBJECTS`.
    sujet: z.string().refine((v) => CONTACT_SUBJECTS.includes(v), {
      message: t('form.commun.champObligatoire'),
    }),
    message: z
      .string()
      .trim()
      .min(1, t('form.commun.champObligatoire'))
      .min(CONTACT_LIMITS.message.min)
      .max(CONTACT_LIMITS.message.max),
    rgpdConsent: z.boolean().refine((v) => v === true, { message: t('form.commun.rgpdRequired') }),
  });
