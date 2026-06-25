// ============================================================
// teamMember.schema.js — Schéma Zod du formulaire de membre d'équipe.
//
// `email` est optionnel (certaines entrées sont des bénévoles anonymisés).
// La chaîne vide est autorisée car les inputs contrôlés renvoient '' (et
// non undefined) quand ils sont vides — le backend convertit en NULL à
// la sauvegarde. `display_order` reste une chaîne (input contrôlé) — le
// backend parse + valide en entier.
// ============================================================
import { z } from 'zod';
const optionalText = (max, label) =>
  z.string().max(max, `${label} maximum ${max} caractères`).optional().or(z.literal(''));
export const teamMemberSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne doit pas dépasser 100 caractères'),
  prenom: z
    .string()
    .trim()
    .min(1, 'Le prénom est requis')
    .max(100, 'Le prénom ne doit pas dépasser 100 caractères'),
  role: z
    .string()
    .trim()
    .min(2, 'Le rôle doit faire au moins 2 caractères')
    .max(150, 'Le rôle ne doit pas dépasser 150 caractères'),
  email: z.union([z.literal(''), z.string().email('Adresse e-mail invalide')]),
  // Téléphone français — même regex que le Validator backend : +33 ou
  // 0X, avec séparateurs ./-/espace. Chaîne vide autorisée (certaines
  // entrées omettent le téléphone).
  phone: z.union([
    z.literal(''),
    z
      .string()
      .regex(/^(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4}$/, 'Numéro de téléphone français invalide'),
  ]),
  photo_url: optionalText(500, 'URL de la photo'),
  // Chaîne ici — le backend convertit. Vide autorisé → le backend met 0 par défaut.
  display_order: z
    .string()
    .regex(/^-?\d*$/, "L'ordre d'affichage doit être un nombre entier")
    .optional()
    .or(z.literal('')),
});
