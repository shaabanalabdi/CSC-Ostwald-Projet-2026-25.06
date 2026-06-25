#!/usr/bin/env node
// ============================================================
// seed-events.js — Peuple la table `event` avec les événements d'agenda
// actuellement codés en dur dans client/src/data/events.js (ids 1–99,
// les entrées avec `agenda: true`).
//
// Les 4 entrées existantes sont des événements d'exemple de juillet 2026
// que l'équipe du CSC peut utiliser comme modèles. Plutôt que de
// re-saisir des dates fraîches au moment du seeding, on décale les dates
// de 6 mois en avant pour qu'elles soient toujours « futures » par
// rapport au lancement du seed — ainsi l'agenda a des données visibles
// immédiatement après le déploiement. Les admins peuvent éditer /
// supprimer via /admin/events ensuite.
//
// Idempotent : saute les insertions quand une correspondance
// (title, date_event) existe déjà. Sûr à relancer.
//
// Utilisation :
//   node scripts/seed-events.js
//   # ou via npm :
//   npm run seed:events
//
// NOTE : image_url utilise des chemins relatifs (/assets/events/*)
// servis depuis client/public/assets/events/. Même convention que
// seed-partners.js.
// ============================================================

import { eventRepository } from '../src/repository/EventRepository.js';
import { Event } from '../src/entity/Event.js';
import { pool } from '../src/config/database.js';

/**
 * Agenda d'exemple — conservé tel quel depuis les données codées en dur
 * d'origine. Les dates sont calculées à l'exécution : un décalage de
 * 6 mois par rapport à « maintenant » pour que l'agenda affiche toujours
 * au moins ces 4 entrées jusqu'à ce que l'admin ajoute les siennes.
 */
const baseOffsetDays = 180;
function futureDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(14, 0, 0, 0); // créneau de l'après-midi, cohérent entre les entrées
  return d;
}

const events = [
  {
    title: 'Atelier Peinture & Créativité',
    description: null,
    date_event: futureDate(baseOffsetDays),
    lieu: 'Centre CSC Ostwald',
    cout: 'Gratuit',
    capacite: 30,
    category_label: 'Atelier pour enfants',
    category_color: '#ee961b', // orange
    image_url: '/assets/events/event-enfants.webp',
    show_in_agenda: 1,
  },
  {
    title: 'Lab Numérique & Création',
    description: null,
    date_event: futureDate(baseOffsetDays + 1),
    lieu: 'Centre CSC Ostwald',
    cout: 'Gratuit',
    capacite: 38,
    category_label: 'Atelier pour les jeunes',
    category_color: '#0132cc', // bleu
    image_url: '/assets/events/event-jeunes.webp',
    show_in_agenda: 1,
  },
  {
    title: 'Journée Famille & Nature',
    description: null,
    date_event: futureDate(baseOffsetDays + 1),
    lieu: 'Centre CSC Ostwald',
    cout: 'Gratuit',
    capacite: 30,
    category_label: 'Atelier pour les familles',
    category_color: '#ee961b', // orange (Famille)
    image_url: '/assets/events/event-enfants.webp',
    show_in_agenda: 1,
  },
  {
    title: 'Théâtre & Expression',
    description: null,
    date_event: futureDate(baseOffsetDays + 7),
    lieu: 'Centre CSC Ostwald',
    cout: 'Gratuit',
    capacite: 20,
    category_label: 'Atelier pour enfants',
    category_color: '#ee961b',
    image_url: '/assets/events/event-jeunes.webp',
    show_in_agenda: 1,
  },
];

let inserted = 0;
let skipped = 0;

try {
  for (const ev of events) {
    // Saut par (title, date_event) — le titre seul pourrait entrer en
    // collision sur de vrais titres récurrents (« Atelier Peinture »)
    // mais la date le précise.
    const existing = await eventRepository.findOneBy({
      title: ev.title,
      date_event: ev.date_event,
    });
    if (existing) {
      console.info(`  · skipped "${ev.title}" (${ev.date_event.toISOString()})`);
      skipped += 1;
      continue;
    }
    const row = new Event(ev);
    await eventRepository.save(row);
    console.info(`  ✓ inserted "${ev.title}" (id=${row.id}, ${ev.date_event.toISOString()})`);
    inserted += 1;
  }

  console.info(`\nDone. ${inserted} inserted, ${skipped} skipped.`);
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
