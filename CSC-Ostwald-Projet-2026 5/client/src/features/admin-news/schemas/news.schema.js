// ============================================================
// news.schema.js — Schéma Zod du formulaire d'édition/création d'actualité.
//
// `image_url` accepte `/uploads/...` (upload admin) OU https://...
// `social_url` est OBLIGATOIRE quand social_platform != 'none', et doit
// être une URL http(s) complète (lien externe vers Instagram/Facebook).
// ============================================================

import { z } from 'zod';

export const NEWS_PLATFORMS = ['instagram', 'facebook', 'none'];

/** /uploads/... OU https:// — même prédicat que les schémas activity/event. */
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

const optionalHttpUrl = z.union([
  z.literal(''),
  z.string().url('URL invalide (http:// ou https://)'),
]);

export const newsSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, 'Le titre doit faire entre 2 et 200 caractères')
      .max(200, 'Le titre doit faire entre 2 et 200 caractères'),
    excerpt: z
      .string()
      .trim()
      .min(10, "L'extrait doit faire entre 10 et 2000 caractères")
      .max(2000, "L'extrait doit faire entre 10 et 2000 caractères"),
    image_url: optionalImageUrl,
    // L'input datetime-local renvoie « YYYY-MM-DDTHH:mm » mais on ne
    // stocke que la partie date — retirer l'heure avant l'envoi OU
    // accepter les deux formats.
    date_published: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/, 'Date au format YYYY-MM-DD requise'),
    social_platform: z.enum(NEWS_PLATFORMS, { message: 'Plateforme requise' }),
    social_url: optionalHttpUrl,
    is_published: z.boolean().optional(),
  })
  // Règle inter-champs : quand la plateforme est définie, l'URL doit l'être aussi.
  .refine((d) => d.social_platform === 'none' || d.social_url !== '', {
    path: ['social_url'],
    message: 'URL du post requise quand une plateforme est choisie',
  });
