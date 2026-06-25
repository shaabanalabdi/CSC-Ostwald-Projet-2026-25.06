#!/usr/bin/env node
// ============================================================
// seed-team.js — Peuple la table `team_member` avec la vraie liste du
// personnel du CSC Ostwald.
//
// Sources de vérité :
//   - Section « Real Team » de CLAUDE.md
//   - memory/project_csc_facts.md (« Sibylle MONTEIL — pas Sandrine GOSSET »)
//   - client/src/pages/QuiSommesNous/QuiSommesNous.jsx (données codées en
//     dur actuellement rendues sur le site public)
//
// Idempotent : saute les insertions quand un membre avec les mêmes
// prénom + nom existe déjà. Sûr à lancer sur une base qui a déjà des
// données — rien n'est écrasé. Utiliser l'UI admin (/admin/team/:id/edit)
// pour téléverser des photos ou corriger les détails après le seeding.
//
// Utilisation :
//   node scripts/seed-team.js
//   # ou via npm :
//   npm run seed:team
// ============================================================

import { teamMemberRepository } from '../src/repository/TeamMemberRepository.js';
import { TeamMember } from '../src/entity/TeamMember.js';
import { pool } from '../src/config/database.js';

/**
 * Personnel permanent. L'ordre correspond à la page publique
 * « Qui sommes-nous » : directeur d'abord, puis référente familles,
 * animatrice jeunesse, coordinateur de projets, chargée d'accueil. La
 * chaîne de rôle est le libellé rendu sur la carte d'équipe publique —
 * même formulation que les clés i18n dans
 * client/src/i18n/locales/fr/translation.json.
 */
const members = [
  {
    prenom: 'Etienne',
    nom: 'ENETTE',
    role: 'Directeur',
    email: 'direction@csc-ostwald.fr',
    phone: null,
    display_order: 1,
  },
  {
    prenom: 'Charline',
    nom: 'BAUER',
    role: 'Référente familles',
    email: 'familles@csc-ostwald.fr',
    phone: '07.45.09.96.02',
    display_order: 2,
  },
  {
    prenom: 'Aurélie',
    nom: 'VERNIER',
    role: 'Animatrice jeunesse',
    email: 'jeunesse@csc-ostwald.fr',
    phone: '07.67.18.17.78',
    display_order: 3,
  },
  {
    prenom: 'Pierrot',
    nom: 'WALTER',
    role: 'Coordinateur de projets',
    email: 'projets@csc-ostwald.fr',
    phone: '07.45.05.68.20',
    display_order: 4,
  },
  {
    prenom: 'Sandrine',
    nom: 'GOSSET',
    role: "Chargée d'accueil et d'animation",
    email: 'contact@csc-ostwald.fr',
    phone: '09.78.80.96.29',
    display_order: 5,
  },
];

let inserted = 0;
let skipped = 0;

try {
  const existing = await teamMemberRepository.findAllOrdered();
  const seen = new Set(existing.map((m) => `${m.prenom.toLowerCase()} ${m.nom.toLowerCase()}`));

  for (const m of members) {
    const key = `${m.prenom.toLowerCase()} ${m.nom.toLowerCase()}`;
    if (seen.has(key)) {
      console.info(`  · skipped ${m.prenom} ${m.nom} (already in DB)`);
      skipped += 1;
      continue;
    }
    const member = new TeamMember({ ...m, photo_url: null });
    await teamMemberRepository.save(member);
    console.info(`  ✓ inserted ${m.prenom} ${m.nom} (id=${member.id})`);
    inserted += 1;
  }

  console.info(`\nDone. ${inserted} inserted, ${skipped} skipped.`);
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exit(1);
} finally {
  // Ferme le pool pour que Node se termine proprement.
  await pool.end();
}
