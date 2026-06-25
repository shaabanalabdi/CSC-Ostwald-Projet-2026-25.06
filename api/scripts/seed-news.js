#!/usr/bin/env node
// ============================================================
// seed-news.js — Seed idempotent pour les 2 actualités qui étaient
// auparavant codées en dur dans
// client/src/pages/Accueil/sections/Actualites.jsx.
//
// Déduplication par titre — relancer ne crée pas de doublons.
// ============================================================

import { pool } from '../src/config/database.js';

const ROWS = [
  {
    title: 'Fête des voisins : un succès retentissant !',
    excerpt:
      'Plus de 200 habitants ont participé à notre fête annuelle des voisins. Une belle journée de rencontres et de partage dans une ambiance festive et solidaire.',
    image_url: null,
    date_published: '2026-07-10',
    social_platform: 'instagram',
    social_url: 'https://www.instagram.com/csc_ostwald',
  },
  {
    title: 'Nouveau : espace numérique pour tous',
    excerpt:
      "Notre centre dispose désormais d'un espace numérique équipé de 10 ordinateurs pour aider les habitants à se former et accéder aux services en ligne.",
    image_url: null,
    date_published: '2026-07-05',
    social_platform: 'facebook',
    social_url: 'https://www.facebook.com/cscostwald/',
  },
];

try {
  let inserted = 0;
  let skipped = 0;
  for (const row of ROWS) {
    const [[existing]] = await pool.query('SELECT id FROM news WHERE title = ? LIMIT 1', [
      row.title,
    ]);
    if (existing) {
      skipped++;
      continue;
    }
    await pool.query(
      `INSERT INTO news
       (title, excerpt, image_url, date_published, social_platform, social_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        row.title,
        row.excerpt,
        row.image_url,
        row.date_published,
        row.social_platform,
        row.social_url,
      ],
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
