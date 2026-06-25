// ============================================================
// benevole.schema.js — Schéma Zod du formulaire d'inscription bénévole
//
// Champs obligatoires (colonne 1) :
//   - nom, prenom, email, telephone
//   - rgpdConsent
//
// Champs optionnels (colonnes 2 + 3) :
//   - domaines, competences, jours, plages   (arrays de strings)
//   - message                                (texte libre)
//
// Les listes de choix (DOMAINES, COMPETENCES, JOURS, PLAGES) viennent
// du JSON i18n via t('form.benevole.X', { returnObjects: true }).
// On ne contraint pas leur valeur côté schéma (sinon il faudrait dupliquer
// les listes ici) — la validation côté UI suffit, le backend les acceptera
// comme array libres et fera ses propres checks.
//
// ⚠️ Les bornes de longueur vivent dans `BENEVOLE_LIMITS` (ci-dessous) et
//    DOIVENT rester identiques à `LIMITS` de
//    api/src/service/BenevoleApplicationService.js. Le test
//    api/src/service/__tests__/validation-sync.test.js échoue sinon.
// ============================================================
import { z } from 'zod';
import { emailRegex, phoneRegex } from '@utils/validators';
/**
 * Bornes de longueur des champs — SOURCE UNIQUE côté frontend, vérifiée
 * contre `LIMITS` de api/src/service/BenevoleApplicationService.js par
 * validation-sync.test.js (côté api).
 */
export const BENEVOLE_LIMITS = {
  nom: { min: 2, max: 80 },
  prenom: { min: 2, max: 80 },
  email: { max: 100 },
  telephone: { max: 20 },
  message: { max: 1000 },
};
/** Construit le schéma bénévole avec des messages d'erreur traduits. */
export const createBenevoleSchema = (t) =>
  z.object({
    nom: z
      .string()
      .trim()
      .min(1, t('form.commun.champObligatoire'))
      .min(BENEVOLE_LIMITS.nom.min)
      .max(BENEVOLE_LIMITS.nom.max),
    prenom: z
      .string()
      .trim()
      .min(1, t('form.commun.champObligatoire'))
      .min(BENEVOLE_LIMITS.prenom.min)
      .max(BENEVOLE_LIMITS.prenom.max),
    email: z
      .string()
      .trim()
      .min(1, t('form.commun.emailInvalide'))
      .regex(emailRegex, t('form.commun.emailInvalide'))
      .max(BENEVOLE_LIMITS.email.max),
    telephone: z
      .string()
      .trim()
      .min(1, t('form.commun.telInvalide'))
      .regex(phoneRegex, t('form.commun.telInvalide'))
      .max(BENEVOLE_LIMITS.telephone.max),
    // Listes de cases cochées — array de strings, vide par défaut.
    domaines: z.array(z.string()).default([]),
    competences: z.array(z.string()).default([]),
    jours: z.array(z.string()).default([]),
    plages: z.array(z.string()).default([]),
    // Message libre — totalement optionnel (peut être vide).
    message: z.string().trim().max(BENEVOLE_LIMITS.message.max).default(''),
    rgpdConsent: z.boolean().refine((v) => v === true, { message: t('form.commun.rgpdRequired') }),
  });
