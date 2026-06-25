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
import { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL_OPTIONS } from '../src/config/env.js';

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
  // TLS explicite pour Aiven & co. mysql2 NE négocie PAS TLS tout seul : sans
  // l'option `ssl`, il se connecte en clair et l'hôte managé rejette. Piloté
  // par DB_SSL / DB_SSL_CA (cf. src/config/env.js).
  ...(DB_SSL_OPTIONS ? { ssl: DB_SSL_OPTIONS } : {}),
});

try {
  // Aiven (et MySQL avec sql_require_primary_key=ON) refusent un CREATE TABLE
  // sans clé primaire en ligne. Or ce dump phpMyAdmin crée les tables SANS PK
  // puis les ajoute via ALTER TABLE en fin de fichier. On désactive la
  // contrainte le temps de la session de migration (no-op sur un MySQL local
  // où elle n'est pas activée).
  try {
    await conn.query('SET SESSION sql_require_primary_key = 0');
  } catch {
    // Certains hôtes interdisent SET SESSION sur cette variable — on continue,
    // les CREATE TABLE échoueront alors clairement si la contrainte est active.
  }

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
