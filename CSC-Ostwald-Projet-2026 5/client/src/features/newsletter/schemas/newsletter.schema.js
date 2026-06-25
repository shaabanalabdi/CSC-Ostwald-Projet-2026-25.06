// ============================================================
// newsletter.schema.js — Schéma Zod du formulaire newsletter (Footer)
//
// Champs :
//   - email         (obligatoire, regex validators.js)
//   - rgpdConsent   (obligatoire — case à cocher de consentement)
//
// Pattern « factory » : on prend `t` en paramètre pour produire des
// messages d'erreur traduits selon la langue active. Le schéma est
// reconstruit côté composant via `useMemo` quand la locale change.
// ============================================================
import { z } from 'zod';
import { emailRegex } from '@utils/validators';
/** Construit le schéma newsletter avec des messages d'erreur traduits. */
export const createNewsletterSchema = (t) =>
  z.object({
    email: z
      .string()
      .trim()
      .min(1, t('footer.emailInvalide'))
      .regex(emailRegex, t('footer.emailInvalide')),
    // `boolean().refine` plutôt que `literal(true)` : autorise `false` comme
    // valeur initiale (checkbox décoché au mount), tout en exigeant `true`
    // pour passer la validation au submit.
    rgpdConsent: z.boolean().refine((v) => v === true, { message: t('footer.rgpdRequired') }),
  });
