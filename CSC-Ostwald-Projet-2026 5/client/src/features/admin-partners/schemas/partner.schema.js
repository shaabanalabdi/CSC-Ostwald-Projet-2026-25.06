// ============================================================
// partner.schema.js — Schéma Zod du formulaire d'édition/création de
// partenaire.
//
// `logo_url` est OBLIGATOIRE et accepte soit un chemin `/uploads/...`
// (renvoyé par l'endpoint d'upload admin), soit une URL http(s) absolue.
// `website_url` est OPTIONNELLE — quand elle est définie, elle DOIT être
// une URL http(s) complète (lien externe ; les chemins d'upload relatifs
// n'ont aucun sens ici).
// ============================================================
import { z } from 'zod';
export const PARTNER_CATEGORIES = ['institutionnel', 'associatif'];
export const partnerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Le nom doit faire entre 2 et 200 caractères')
    .max(200, 'Le nom doit faire entre 2 et 200 caractères'),
  logo_url: z
    .string()
    .min(1, 'URL du logo requise')
    .max(500, 'URL maximum 500 caractères')
    .refine(
      (v) => !v.includes('..') && (v.startsWith('/uploads/') || /^https?:\/\//i.test(v)),
      'URL du logo invalide (utilisez /uploads/... ou https://...)'
    ),
  website_url: z.union([
    z.literal(''),
    z.string().url('URL du site web invalide (http:// ou https://)'),
  ]),
  category: z.enum(PARTNER_CATEGORIES, { message: 'Catégorie requise' }),
  display_order: z
    .string()
    .regex(/^-?\d*$/, "L'ordre d'affichage doit être un nombre entier")
    .optional()
    .or(z.literal('')),
});
