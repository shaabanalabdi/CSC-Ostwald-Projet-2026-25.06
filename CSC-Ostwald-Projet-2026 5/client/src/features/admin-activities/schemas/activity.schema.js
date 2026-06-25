// ============================================================
// activity.schema.js — Schéma Zod du formulaire d'édition/création
// d'activité.
//
// Gestion de la chaîne vide : les champs texte optionnels utilisent
// `z.literal('')` comme valeur permise car les inputs contrôlés
// renvoient '' (et non undefined) quand ils sont vides. Le service
// backend les reconvertit en NULL à la sauvegarde. `capacite` reste une
// chaîne ici — le backend gère la coercition numérique et le contrôle
// des bornes.
// ============================================================
import { z } from 'zod';
export const ACTIVITY_TYPES = ['famille', 'jeunesse', 'reguliere'];
export const ACTIVITY_FREQUENCES = ['HEBDO', 'MENSUEL'];
const optionalText = (max, label) =>
  z.string().max(max, `${label} maximum ${max} caractères`).optional().or(z.literal(''));
/**
 * Champ URL d'image — accepte soit :
 *   - une chaîne vide (input effacé)
 *   - `/uploads/...` (chemin relatif renvoyé par l'endpoint d'upload admin)
 *   - une URL http(s) absolue (images héritées / externes)
 * Rejette `javascript:`, `data:`, et les tentatives de path-traversal (`..`).
 */
const optionalImageUrl = z.union([
  z.literal(''),
  z
    .string()
    .max(500, 'URL maximum 500 caractères')
    .refine(
      (v) => !v.includes('..') && (v.startsWith('/uploads/') || /^https?:\/\//i.test(v)),
      'URL invalide (utilisez /uploads/... ou https://...)'
    ),
]);
export const activitySchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Le titre doit faire entre 2 et 200 caractères')
    .max(200, 'Le titre doit faire entre 2 et 200 caractères'),
  description: z
    .string()
    .trim()
    .min(10, 'La description doit faire au moins 10 caractères')
    .max(5000, 'La description ne doit pas dépasser 5000 caractères'),
  activity_type: z.enum(ACTIVITY_TYPES, { message: 'Type requis' }),
  lieu: optionalText(200, 'Lieu'),
  jour: optionalText(50, 'Jour'),
  horaire: optionalText(100, 'Horaire'),
  cout: optionalText(50, 'Coût'),
  // Chaîne ici — vide autorisé. Le backend convertit en entier et valide ≥ 1.
  capacite: z
    .string()
    .regex(/^\d*$/, 'Capacité doit être un nombre entier')
    .optional()
    .or(z.literal('')),
  // Champs de la Phase 19 — visibles sur les pages publiques Famille/Jeunesse.
  frequence: z.union([z.literal(''), z.enum(ACTIVITY_FREQUENCES)]),
  categorie_label: optionalText(80, 'Catégorie'),
  tag: optionalText(30, 'Tag'),
  image_url: optionalImageUrl,
  is_published: z.boolean(),
});
