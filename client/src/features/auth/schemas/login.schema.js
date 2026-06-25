// ============================================================
// login.schema.js — Schéma Zod du formulaire de connexion admin.
//
// Messages d'erreur en français uniquement à dessein : l'espace admin
// est un outil interne utilisé par l'équipe du CSC (tous francophones).
// Aucune clé i18n à maintenir — garde la surface de code admin réduite.
// Si des admins multilingues deviennent nécessaires un jour, passer au
// motif de fabrique t() utilisé par les fonctionnalités publiques
// (schémas newsletter / contact / benevole).
// ============================================================
import { z } from 'zod';
import { emailRegex } from '@utils/validators';
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "L'email est requis")
    .regex(emailRegex, "Format d'email invalide"),
  password: z.string().min(1, 'Le mot de passe est requis'),
});
