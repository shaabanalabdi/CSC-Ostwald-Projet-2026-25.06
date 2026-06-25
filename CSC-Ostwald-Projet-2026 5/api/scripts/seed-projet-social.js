#!/usr/bin/env node
// ============================================================
// seed-projet-social.js — Seed idempotent pour les 5 documents PDF qui
// étaient auparavant codés en dur dans le ProjetSocial.jsx du client.
//
// Déduplication par titre — relancer ne crée pas de doublons, et les
// mises à jour du file_url ou des libellés restent manuelles via l'UI admin.
// ============================================================

import { pool } from '../src/config/database.js';

const ROWS = [
  {
    title: "Dossier d'inscription",
    description:
      "Téléchargez le dossier complet d'inscription pour rejoindre nos activités et ateliers.",
    file_url: '/documents/formulaire-inscription.pdf',
    badge_label: 'PDF',
    color: 'blue',
    display_order: 0,
  },
  {
    title: 'Fiche sanitaire',
    description:
      "Document médical modifiable à télécharger et à remettre lors de l'inscription à certaines activités.",
    file_url: '/documents/Fiche-sanitaire-de-liaison.pdf',
    badge_label: 'PDF',
    color: 'blue',
    display_order: 1,
  },
  {
    title: 'Reçu de dons',
    description:
      'Document officiel attestant votre don au CSC Ostwald, valable pour une déduction fiscale.',
    file_url: '/documents/Cerfa-don-entreprises.pdf',
    badge_label: 'CERFA',
    color: 'orange',
    display_order: 2,
  },
  {
    title: "Rapport d'activité",
    description:
      "Notre bilan annuel présentant les actions, projets et résultats de l'année écoulée.",
    file_url: '/documents/rapport-activites-2025.pdf',
    badge_label: 'RAPPORT',
    color: 'green',
    display_order: 3,
  },
  {
    title: 'Projet Social 2026-2029',
    description:
      'Le projet social du CSC Ostwald pour la période 2026-2029, présentant nos orientations et engagements.',
    file_url: '/documents/Projet-social-CSCDOSTWALD2026-2029.pdf',
    badge_label: 'PROJET',
    color: 'green',
    display_order: 4,
  },
];

try {
  let inserted = 0;
  let skipped = 0;
  for (const row of ROWS) {
    // La déduplication se ferait via une contrainte UNIQUE — mais la
    // table n'en a pas, donc on déduplique par titre via un SELECT
    // manuel d'abord.
    const [[existing]] = await pool.query(
      'SELECT id FROM projet_social_document WHERE title = ? LIMIT 1',
      [row.title],
    );
    if (existing) {
      skipped++;
      continue;
    }
    await pool.query(
      `INSERT INTO projet_social_document
       (title, description, file_url, badge_label, color, display_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [row.title, row.description, row.file_url, row.badge_label, row.color, row.display_order],
    );
    inserted++;
  }
  console.info(`✓ Seed terminé : ${inserted} insérés, ${skipped} déjà présents`);
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
