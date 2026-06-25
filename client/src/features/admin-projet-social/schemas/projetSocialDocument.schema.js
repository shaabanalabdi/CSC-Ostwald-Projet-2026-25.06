// ============================================================
// projetSocialDocument.schema.js — Schéma Zod du formulaire admin.
//
// `file_url` accepte soit un chemin relatif commençant par `/` (assets
// servis depuis client/public/documents), soit une URL http(s) absolue.
// La couleur est un enum strict correspondant à l'ENUM de la DB. Les
// champs numériques restent des chaînes — le backend gère la coercition.
// ============================================================
import { z } from 'zod';
export const PROJET_SOCIAL_COLORS = ['orange', 'blue', 'green'];
/** Soit `/chemin/vers/fichier.pdf`, soit une URL https complète — pas de `..`, pas de `javascript:`. */
const fileUrlRegex = /^(\/[^./].*|https?:\/\/[^/].*)$/i;
export const projetSocialDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Le titre doit faire entre 2 et 150 caractères')
    .max(150, 'Le titre doit faire entre 2 et 150 caractères'),
  description: z
    .string()
    .max(1000, 'La description ne doit pas dépasser 1000 caractères')
    .optional()
    .or(z.literal('')),
  file_url: z
    .string()
    .trim()
    .min(1, 'URL du fichier requise')
    .max(500, 'Maximum 500 caractères')
    .regex(fileUrlRegex, 'Utilisez /documents/... ou https://...'),
  badge_label: z
    .string()
    .trim()
    .min(1, "Étiquette requise (ex: 'PDF', 'CERFA')")
    .max(20, 'Maximum 20 caractères'),
  color: z.enum(PROJET_SOCIAL_COLORS, { message: 'Couleur requise' }),
  display_order: z
    .string()
    .regex(/^-?\d*$/, "L'ordre d'affichage doit être un nombre entier")
    .optional()
    .or(z.literal('')),
  is_published: z.boolean().optional(),
});
