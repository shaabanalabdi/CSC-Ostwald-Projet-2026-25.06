// ============================================================
// forgotPassword.schema.js — Schéma Zod du formulaire "Mot de passe oublié".
// Messages en français uniquement — espace admin interne.
// ============================================================
import { z } from 'zod';
import { emailRegex } from '@utils/validators';

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "L'email est requis")
    .regex(emailRegex, "Format d'email invalide"),
});
