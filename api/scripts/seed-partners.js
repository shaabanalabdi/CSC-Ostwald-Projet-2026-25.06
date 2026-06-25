#!/usr/bin/env node
// ============================================================
// seed-partners.js — Peuple la table `partner` avec la vraie liste des
// partenaires du CSC Ostwald (institutionnels + associatifs).
//
// Source : client/src/data/partenaires.js (les données codées en dur
// actuellement rendues sur la page publique « Nos partenaires »).
//
// Les URLs de logo pointent vers /assets/logos/* servis depuis
// client/public/assets/logos/. Ils ont été copiés depuis le
// src/assets/images/ bundlé au moment du seeding pour que la page
// pilotée par la DB puisse les rendre via une URL stable.
//
// Idempotent : saute les insertions quand un partenaire du même nom
// existe déjà.
//
// Utilisation :
//   node scripts/seed-partners.js
//   # ou via npm :
//   npm run seed:partners
//
// NOTE : logo_url utilise des chemins RELATIFS (/assets/logos/...). Le
// frontend les résout contre sa propre origine. Si l'API et le frontend
// sont hébergés sur des domaines différents ET que la réécriture Vercel
// du frontend pour /api/* n'est pas utilisée, il faudra les mettre à
// jour en URLs absolues (ex. https://csc-ostwald.vercel.app/assets/logos/...).
// ============================================================

import { partnerRepository } from '../src/repository/PartnerRepository.js';
import { Partner } from '../src/entity/Partner.js';
import { pool } from '../src/config/database.js';

/**
 * Partenaires institutionnels — financeurs publics. Même ordre que
 * data/partenaires.js : CAF (organisme d'agrément + financeur principal)
 * d'abord, puis commune, département, intercommunalité, région, État.
 */
const institutionnels = [
  {
    name: 'CAF du Bas-Rhin',
    logo_url: '/assets/logos/logo-caf-671.png',
    website_url: 'https://www.caf.fr/allocataires/caf-du-bas-rhin',
    display_order: 1,
  },
  {
    name: "Ville d'Ostwald",
    logo_url: '/assets/logos/ostwald-ville.png',
    website_url: 'https://www.ville-ostwald.fr',
    display_order: 2,
  },
  {
    name: "Collectivité européenne d'Alsace",
    logo_url: '/assets/logos/Collectivite-europeenne-dAlsace.jpeg',
    website_url: 'https://www.alsace.eu/',
    display_order: 3,
  },
  {
    name: 'Eurométropole de Strasbourg',
    logo_url: '/assets/logos/strasbourg-eu.webp',
    website_url: 'https://www.strasbourg.eu/',
    display_order: 4,
  },
  {
    name: 'Région Grand Est',
    logo_url: '/assets/logos/REGION-grandest.png',
    website_url: 'https://www.grandest.fr/',
    display_order: 5,
  },
  {
    name: 'Préfecture du Bas-Rhin',
    logo_url: '/assets/logos/logo-etat.png',
    website_url: 'https://www.bas-rhin.gouv.fr',
    display_order: 6,
  },
];

/**
 * Partenaires associatifs — structures locales. Pas de website_url car
 * la page publique n'expose pas de liens externes pour ce groupe (selon
 * la convention actuelle de data/partenaires.js).
 */
const associatifs = [
  {
    name: 'Centres Sociaux',
    logo_url: '/assets/logos/logo-centre-sociaux.png',
    display_order: 10,
  },
  {
    name: 'Maison des Jeux',
    logo_url: '/assets/logos/logo-maison-des-jeux.png',
    display_order: 11,
  },
  { name: 'Repair Café', logo_url: '/assets/logos/logo-repair-cafe.jpg', display_order: 12 },
  { name: 'Tot ou Tart', logo_url: '/assets/logos/logo-tot-ou-tart.png', display_order: 13 },
  { name: 'UnisCité', logo_url: '/assets/logos/logo-unisCite.png', display_order: 14 },
  {
    name: 'Action Prévention Alsace',
    logo_url: '/assets/logos/logo-action-prevention-alsace.png',
    display_order: 15,
  },
  { name: 'ARSEA', logo_url: '/assets/logos/logo-arsea.png', display_order: 16 },
  { name: 'CSF Ostwald', logo_url: '/assets/logos/logo-csf-ostwald.png', display_order: 17 },
  { name: 'Horizon', logo_url: '/assets/logos/logo-horizon.png', display_order: 18 },
  {
    name: 'Relais Petite Enfance',
    logo_url: '/assets/logos/logo-relais-petite-enfance.png',
    display_order: 19,
  },
  { name: 'Soualiga', logo_url: '/assets/logos/logo-soualiga.png', display_order: 20 },
  { name: 'Bretzselle', logo_url: '/assets/logos/logo-bretzselle.png', display_order: 21 },
];

let inserted = 0;
let skipped = 0;

async function seedOne(record, category) {
  const existing = await partnerRepository.findOneBy({ name: record.name });
  if (existing) {
    console.info(`  · skipped ${record.name} (already in DB)`);
    skipped += 1;
    return;
  }
  const partner = new Partner({
    name: record.name,
    logo_url: record.logo_url,
    website_url: record.website_url ?? null,
    category,
    display_order: record.display_order,
  });
  await partnerRepository.save(partner);
  console.info(`  ✓ inserted ${record.name} (id=${partner.id})`);
  inserted += 1;
}

try {
  console.info('Institutional partners:');
  for (const p of institutionnels) {
    await seedOne(p, 'institutionnel');
  }
  console.info('\nAssociative partners:');
  for (const p of associatifs) {
    await seedOne(p, 'associatif');
  }

  console.info(`\nDone. ${inserted} inserted, ${skipped} skipped.`);
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
