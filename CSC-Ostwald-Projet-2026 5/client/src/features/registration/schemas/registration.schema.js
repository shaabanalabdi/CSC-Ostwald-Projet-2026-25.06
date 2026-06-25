// ============================================================
// registration.schema.js — Schéma Zod du formulaire d'inscription Jeunesse.
//
// Reflète les validateurs backend de
// RegistrationService.createPendingRegistration pour que l'utilisateur
// reçoive un retour immédiat avant l'appel réseau. rgpdConsent est une
// barrière UX (non stockée — comme newsletter/contact).
// ============================================================
import { z } from 'zod';
import { emailRegex } from '@utils/validators';
export const createRegistrationSchema = (t) =>
  z.object({
    prenom: z
      .string()
      .trim()
      .min(2, t('inscription.prenomInvalide'))
      .max(80, t('inscription.prenomInvalide')),
    nom: z
      .string()
      .trim()
      .min(2, t('inscription.nomInvalide'))
      .max(80, t('inscription.nomInvalide')),
    email: z
      .string()
      .trim()
      .min(1, t('inscription.emailInvalide'))
      .regex(emailRegex, t('inscription.emailInvalide')),
    rgpdConsent: z.boolean().refine((v) => v === true, {
      message: t('inscription.rgpdRequired'),
    }),
  });
