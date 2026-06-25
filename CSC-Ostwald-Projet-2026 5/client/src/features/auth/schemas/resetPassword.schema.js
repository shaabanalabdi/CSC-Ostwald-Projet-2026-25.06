// ============================================================
// resetPassword.schema.js — Schéma Zod du formulaire "Nouveau mot de passe".
// Messages en français uniquement — espace admin interne.
// ============================================================
import { z } from 'zod';

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirm: z.string().min(1, 'Veuillez confirmer le mot de passe'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  });
