// ============================================================
// database.js — Pool de connexions MySQL (mysql2/promise).
//
// Pool paresseux : la première requête ouvre la connexion. Le serveur
// démarre correctement même quand MySQL est indisponible, donc les
// health checks restent utiles pour le monitoring et l'expérience de
// développement n'est pas bloquée par une base de données absente.
// ============================================================

import mysql from 'mysql2/promise';
import { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } from './env.js';

export const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  // Config du pool — calibrée pour un petit site de centre social (peu
  // d'utilisateurs simultanés).
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Traite les DATE/DATETIME comme des objets Date JS (pas des chaînes).
  dateStrings: false,
});

/**
 * Teste la connexion à la base de données. Utilisé par l'endpoint de
 * health-check.
 * @returns {Promise<boolean>} true si la connexion réussit.
 */
export async function isDatabaseReachable() {
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query('SELECT 1');
      return true;
    } finally {
      conn.release();
    }
  } catch {
    return false;
  }
}
