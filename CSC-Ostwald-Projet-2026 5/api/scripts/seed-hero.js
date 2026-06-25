#!/usr/bin/env node
// ============================================================
// seed-hero.js — Seed idempotent pour les 2 slides du Hero qui étaient
// auparavant codées en dur dans les clés i18n `hero.slide*` et lues
// par client/src/pages/Accueil/sections/Hero.jsx.
//
// Déduplication par titre — relancer ne crée pas de doublons.
// ============================================================

import { pool } from '../src/config/database.js';

const ROWS = [
  {
    title: 'Centre Social et Culturel d’Ostwald',
    subtitle: 'Un lieu ouvert à tout.e.s les habitant.e.s',
    display_order: 0,
  },
  {
    title: 'Activités, événements & projets',
    subtitle: 'Participez à la vie de votre quartier',
    display_order: 1,
  },
];

try {
  let inserted = 0;
  let skipped = 0;
  for (const row of ROWS) {
    const [[existing]] = await pool.query('SELECT id FROM hero_slide WHERE title = ? LIMIT 1', [
      row.title,
    ]);
    if (existing) {
      skipped++;
      continue;
    }
    await pool.query(`INSERT INTO hero_slide (title, subtitle, display_order) VALUES (?, ?, ?)`, [
      row.title,
      row.subtitle,
      row.display_order,
    ]);
    inserted++;
  }
  console.info(`✓ Seed terminé : ${inserted} insérés, ${skipped} déjà présents`);
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
