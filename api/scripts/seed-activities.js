#!/usr/bin/env node
// ============================================================
// seed-activities.js — Peuple la table `activity` avec les activités
// récurrentes actuellement codées en dur dans client/src/data/events.js
// (ids 101–199 pour Famille, 201–299 pour Jeunesse).
//
// Idempotent : saute les insertions quand (title, activity_type)
// correspondent déjà. Sûr à relancer.
//
// Utilisation :
//   node scripts/seed-activities.js
//   # ou via npm :
//   npm run seed:activities
//
// NOTE : image_url utilise des chemins relatifs (/assets/activities/*)
// servis depuis client/public/assets/activities/. Même convention que
// les seeds events et partners.
// ============================================================

import { activityRepository } from '../src/repository/ActivityRepository.js';
import { Activity } from '../src/entity/Activity.js';
import { pool } from '../src/config/database.js';

/**
 * Activités récurrentes — copiées telles quelles depuis data/events.js.
 * Les colonnes `categorie_label` / `frequence` / `tag` ajoutées en
 * Phase 19 sont renseignées ici pour que les pages publiques
 * Famille/Jeunesse rendent les cartes exactement comme avant la migration.
 */
const activities = [
  // ── Famille (4 ateliers, à l'origine ids 101..104) ──
  {
    title: 'Escapades en famille',
    description:
      "Un jour par semaine, on quitte le quartier pour explorer d'autres horizons : forêt, musée, ferme, plage... Ensemble, partageons de nouvelles découvertes.",
    activity_type: 'famille',
    categorie_label: 'SORTIE EN TRIBU',
    lieu: 'Centre CSC Ostwald',
    jour: 'Chaque semaine',
    frequence: 'HEBDO',
    cout: 'Gratuit',
    capacite: 20,
    tag: 'famille',
    image_url: '/assets/activities/event-enfants.webp',
    is_published: 1,
  },
  {
    title: 'Les petites mains créatives',
    description:
      'Peinture, argile, collage... Un moment complice pour explorer la matière et créer à quatre mains, dès 3 ans.',
    activity_type: 'famille',
    categorie_label: 'ATELIER PARENT - ENFANT',
    lieu: 'Centre CSC Ostwald',
    jour: 'Chaque mois',
    frequence: 'MENSUEL',
    cout: 'Gratuit',
    capacite: 15,
    tag: 'séance',
    image_url: '/assets/activities/event-enfants.webp',
    is_published: 1,
  },
  {
    title: 'Les fourneaux partagés',
    description:
      'On cuisine ensemble des recettes du monde, on partage le repas. Grand-parents, parents, enfants : tous aux marmites.',
    activity_type: 'famille',
    categorie_label: 'CUISINE TOUS ÂGES',
    lieu: 'Centre CSC Ostwald',
    jour: 'Chaque semaine',
    frequence: 'HEBDO',
    cout: 'Gratuit',
    capacite: 20,
    tag: 'famille',
    image_url: '/assets/activities/event-enfants.webp',
    is_published: 1,
  },
  {
    title: 'Le café des parents',
    description:
      "Échangez astuces et rires autour d'un café ! Un moment de détente entre voisins, sans jugement et en toute simplicité. Pour une question ou juste pour souffler, la porte est grande ouverte !",
    activity_type: 'famille',
    categorie_label: 'CAFÉ - ÉCOUTE & ÉCHANGE',
    lieu: 'Centre CSC Ostwald',
    jour: 'Chaque mois',
    frequence: 'MENSUEL',
    cout: 'Gratuit',
    capacite: 25,
    tag: 'famille',
    image_url: '/assets/activities/event-enfants.webp',
    is_published: 1,
  },

  // ── Jeunesse (4 ateliers, à l'origine ids 201..204) ──
  {
    title: 'Atelier Rap & Beatbox',
    description:
      "Viens explorer l'univers du rap, du beatbox et de l'écriture créative. Exprime-toi, compose tes textes et partage ta musique avec les autres.",
    activity_type: 'jeunesse',
    categorie_label: 'MUSIQUE & EXPRESSION',
    lieu: 'Centre CSC Ostwald',
    jour: 'Chaque semaine',
    frequence: 'HEBDO',
    cout: 'Gratuit',
    capacite: 15,
    tag: 'jeune',
    image_url: '/assets/activities/event-jeunes.webp',
    is_published: 1,
  },
  {
    title: 'Tournoi Gaming & E-Sport',
    description:
      "Un tournoi mensuel de jeux vidéo pour se mesurer, s'amuser et rencontrer d'autres joueurs du quartier dans une ambiance fun et bienveillante.",
    activity_type: 'jeunesse',
    categorie_label: 'GAMING & NUMÉRIQUE',
    lieu: 'Centre CSC Ostwald',
    jour: 'Chaque mois',
    frequence: 'MENSUEL',
    cout: 'Gratuit',
    capacite: 20,
    tag: 'jeune',
    image_url: '/assets/activities/event-jeunes.webp',
    is_published: 1,
  },
  {
    title: 'Sorties & Découvertes',
    description:
      'Cinéma, paintball, accrobranche, escape game... Chaque mois une nouvelle sortie pour créer des souvenirs et découvrir la région autrement.',
    activity_type: 'jeunesse',
    categorie_label: 'SORTIES & AVENTURES',
    lieu: 'Variable',
    jour: 'Chaque mois',
    frequence: 'MENSUEL',
    cout: 'Gratuit',
    capacite: 25,
    tag: 'jeune',
    image_url: '/assets/activities/event-jeunes.webp',
    is_published: 1,
  },
  {
    title: 'Studio Podcast & Vidéo',
    description:
      "Apprends à créer ton propre podcast, ta chaîne YouTube ou tes vidéos. Le centre met à ta disposition le matériel et t'accompagne dans ton projet.",
    activity_type: 'jeunesse',
    categorie_label: 'CRÉATION NUMÉRIQUE',
    lieu: 'Centre CSC Ostwald',
    jour: 'Chaque semaine',
    frequence: 'HEBDO',
    cout: 'Gratuit',
    capacite: 10,
    tag: 'jeune',
    image_url: '/assets/activities/event-jeunes.webp',
    is_published: 1,
  },
];

let inserted = 0;
let skipped = 0;

try {
  for (const a of activities) {
    // Clé d'idempotence : même title + type. Deux activités peuvent
    // partager un titre entre types (« Le café » en famille + jeunesse)
    // mais à l'intérieur d'un seul type, l'unicité du titre est une règle
    // UX sensée.
    const existing = await activityRepository.findOneBy({
      title: a.title,
      activity_type: a.activity_type,
    });
    if (existing) {
      console.info(`  · skipped "${a.title}" (${a.activity_type})`);
      skipped += 1;
      continue;
    }
    const row = new Activity(a);
    await activityRepository.save(row);
    console.info(`  ✓ inserted "${a.title}" (${a.activity_type}, id=${row.id})`);
    inserted += 1;
  }

  console.info(`\nDone. ${inserted} inserted, ${skipped} skipped.`);
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
