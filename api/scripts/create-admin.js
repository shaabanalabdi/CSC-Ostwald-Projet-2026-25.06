#!/usr/bin/env node
// ============================================================
// create-admin.js — Crée un utilisateur admin (CLI ponctuelle).
//
// Utilisation :
//   node scripts/create-admin.js <email> <password> [role]
//
// Exemples :
//   node scripts/create-admin.js etienne@csc-ostwald.fr 'S3cureP@ss!'
//   node scripts/create-admin.js editor@csc-ostwald.fr 'pw' editor
//
// Distinction des rôles (appliquée par api/src/middleware/requireRole.js) :
//   - admin  → pleins pouvoirs, y compris les mutations financières
//              (statut d'inscription, suppression). À utiliser pour le
//              directeur du CSC et tout le personnel qui gère les
//              remboursements.
//   - editor → CRUD de contenu uniquement (activités, événements,
//              équipe, news, partenaires). Ne peut pas changer le statut
//              d'une inscription ni supprimer des inscriptions payées.
//              Le bon défaut pour l'équipe communication.
//
// Le script :
//   1. Refuse d'écraser un e-mail existant (faire un UPDATE manuel au besoin).
//   2. Hache le mot de passe avec le même facteur de coût bcrypt que les
//      connexions de production (la cohérence compte — un hash fait avec
//      un facteur plus bas fonctionnerait quand même, mais avec des
//      connexions plus lentes sur ce compte).
//   3. Ferme le pool MySQL en sortie pour que le script se termine proprement.
//
// `npm run create-admin` redirige vers ce fichier via package.json.
// ============================================================

import { userRepository } from '../src/repository/UserRepository.js';
import { User } from '../src/entity/User.js';
import { authService } from '../src/service/AuthService.js';
import { pool } from '../src/config/database.js';

const [, , emailArg, passwordArg, roleArg = 'admin'] = process.argv;

if (!emailArg || !passwordArg) {
  console.error('Usage: node scripts/create-admin.js <email> <password> [role]');
  console.error('  role defaults to "admin" — set to "editor" for limited access.');
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const role = roleArg.trim().toLowerCase();

if (!['admin', 'editor'].includes(role)) {
  console.error(`Invalid role "${role}". Must be "admin" or "editor".`);
  process.exit(1);
}

if (passwordArg.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

try {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    console.error(`User with email "${email}" already exists (id=${existing.id}).`);
    process.exit(1);
  }

  const hash = await authService.hashPassword(passwordArg);
  const user = new User({ email, password: hash, role });
  await userRepository.save(user);

  console.info(`✓ Admin created: ${email} (id=${user.id}, role=${role})`);
} catch (err) {
  console.error('Failed to create admin:', err.message);
  process.exit(1);
} finally {
  // Ferme le pool pour que Node se termine proprement. Sans cela, le
  // script reste suspendu car mysql2 garde la connexion ouverte pour
  // réutilisation.
  await pool.end();
}
