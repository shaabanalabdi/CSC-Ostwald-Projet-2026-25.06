// ============================================================
// event.schema.js — Schéma Zod du formulaire d'édition/création
// d'événement d'agenda.
//
// `date_event` est collecté via <input type="datetime-local"> qui
// renvoie « YYYY-MM-DDTHH:mm » (sans fuseau). Le schéma accepte cette
// forme OU une chaîne ISO complète, et on transmet la chaîne brute à
// l'API — le backend parse + stocke. Les champs texte optionnels
// permettent la chaîne vide car les inputs contrôlés renvoient '' (et
// non undefined) quand ils sont vides.
// ============================================================
import { z } from 'zod';
const optionalText = (max, label) =>
  z.string().max(max, `${label} maximum ${max} caractères`).optional().or(z.literal(''));
/**
 * Champ URL d'image — accepte `/uploads/...` (endpoint d'upload admin)
 * OU une URL http(s) absolue. Rejette `javascript:`, `data:`, et les
 * tentatives de path-traversal (`..`).
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
export const eventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Le titre doit faire entre 2 et 200 caractères')
    .max(200, 'Le titre doit faire entre 2 et 200 caractères'),
  description: optionalText(5000, 'Description'),
  // Format datetime-local : « YYYY-MM-DDTHH:mm » (sans secondes, sans
  // décalage). On accepte aussi l'ISO complet avec secondes + Z
  // optionnel. La chaîne vide est rejetée car le champ est obligatoire.
  date_event: z
    .string()
    .min(1, "Date de l'événement requise")
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{1,3})?(Z|[+-]\d{2}:?\d{2})?$/,
      'Date invalide'
    ),
  lieu: optionalText(200, 'Lieu'),
  cout: optionalText(50, 'Coût'),
  // Capacité — chaîne pour l'input contrôlé. Le backend convertit + valide ≥ 1.
  capacite: z
    .string()
    .regex(/^\d*$/, 'Capacité doit être un nombre entier')
    .optional()
    .or(z.literal('')),
  category_label: optionalText(80, 'Catégorie'),
  // Couleur hex — #rgb ou #rrggbb. Vide autorisé.
  category_color: z.union([
    z.literal(''),
    z
      .string()
      .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Couleur invalide (format #rrggbb attendu)'),
  ]),
  image_url: optionalImageUrl,
  show_in_agenda: z.boolean(),
});
