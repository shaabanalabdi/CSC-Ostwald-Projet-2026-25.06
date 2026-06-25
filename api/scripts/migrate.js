#!/usr/bin/env node
// ============================================================
// migrate.js — Applique database.sql à l'hôte MySQL configuré.
//
// Cas d'usage : configuration initiale du MySQL managé sur Aiven /
// PlanetScale / RDS, où l'interface graphique n'accepte pas directement
// un fichier SQL multi-instructions. Lit les DB_* depuis l'env (même
// source que le serveur), se connecte, et exécute le schéma
// instruction par instruction.
//
// Idempotent — chaque CREATE TABLE utilise `IF NOT EXISTS`, donc relancer
// contre une DB peuplée est sûr (no-op).
//
// Utilisation :
//   npm run migrate          # utilise .env ou les variables d'env
//   DB_HOST=... DB_PASSWORD=... node scripts/migrate.js
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } from '../src/config/env.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(here, '..', 'database.sql');

if (!fs.existsSync(schemaPath)) {
  console.error(`Schema file not found at ${schemaPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(schemaPath, 'utf8');

// Retire les commentaires SQL avant de découper sur `;`. Crucial :
// gérer les commentaires `--` EN LIGNE (ex. `col TINYINT NULL, -- random; nulled later`)
// — le `;` embarqué dans un commentaire tronquerait sinon l'instruction.
// On ne gère pas les commentaires bloc /* ... */ car le schéma n'en
// utilise pas. Les chaînes entre guillemets ne sont PAS prises en compte
// (le schéma n'a pas non plus de littéraux de chaîne contenant un point-virgule).
const statements = sql
  .split('\n')
  .map((line) => {
    const i = line.indexOf('--');
    return i >= 0 ? line.slice(0, i) : line;
  })
  .join('\n')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

console.info(`Connecting to mysql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME} …`);

// `multipleStatements: true` permettrait d'envoyer tout le fichier d'un
// coup, mais mysql2 le désactive par défaut pour la sécurité anti-injection
// SQL. Envoyer les instructions une à une est plus lent mais correspond
// au chemin recommandé.
const conn = await mysql.createConnection({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  // Aiven et la plupart des fournisseurs managés exigent TLS ; mysql2 le
  // négocie automatiquement quand le serveur l'annonce. Pas besoin de
  // `ssl: {}` explicite — mais passer `?ssl-mode=REQUIRED` dans l'URL si
  // le fournisseur refuse la négociation de type STARTTLS.
});

try {
  let applied = 0;
  for (const [i, statement] of statements.entries()) {
    try {
      await conn.query(statement);
      applied++;
    } catch (err) {
      console.error(`\n✗ Statement ${i + 1}/${statements.length} failed:`);
      console.error(statement.slice(0, 160) + (statement.length > 160 ? '…' : ''));
      console.error('  →', err.message);
      throw err;
    }
  }
  console.info(`✓ Applied ${applied} statement(s) to ${DB_NAME}`);
} finally {
  await conn.end();
}
