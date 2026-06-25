// ============================================================
// heroSlide.schema.js — Schéma Zod du formulaire d'édition/création
// d'une slide du carrousel Hero.
//
// `display_order` n'est PAS dans le formulaire : l'ordre du carrousel
// se règle par glisser-déposer sur /admin/hero. Limites alignées sur
// HeroSlideService._validate côté backend (titre 2-200, sous-titre 2-300).
//
// `media_type` choisit le fond de la slide ; `media_url` (image OU vidéo
// téléversée, ou URL https) est obligatoire dès que le type n'est pas
// « none » — règle inter-champs via .refine.
// ============================================================

import { z } from 'zod';

export const HERO_MEDIA_TYPES = ['none', 'image', 'video'];

// /uploads/... (upload admin) OU https:// — même prédicat que les schémas
// activity / event / news pour les URLs de média.
const optionalMediaUrl = z.union([
  z.literal(''),
  z
    .string()
    .max(500, 'URL maximum 500 caractères')
    .refine(
      (v) => !v.includes('..') && (v.startsWith('/uploads/') || /^https?:\/\//i.test(v)),
      'URL invalide (utilisez /uploads/... ou https://...)'
    ),
]);

export const heroSlideSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, 'Le titre doit faire entre 2 et 200 caractères')
      .max(200, 'Le titre doit faire entre 2 et 200 caractères'),
    subtitle: z
      .string()
      .trim()
      .min(2, 'Le sous-titre doit faire entre 2 et 300 caractères')
      .max(300, 'Le sous-titre doit faire entre 2 et 300 caractères'),
    media_type: z.enum(HERO_MEDIA_TYPES, { message: 'Type de fond requis' }),
    media_url: optionalMediaUrl,
    is_published: z.boolean().optional(),
  })
  // Règle inter-champs : dès qu'un fond image/vidéo est choisi, son URL
  // doit être renseignée (téléversement ou lien).
  .refine((d) => d.media_type === 'none' || d.media_url !== '', {
    path: ['media_url'],
    message: 'Ajoutez le fichier (image ou vidéo) pour ce type de fond',
  });
