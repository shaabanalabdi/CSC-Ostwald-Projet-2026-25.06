// ============================================================
// csv.js — Sérialiseur CSV RFC 4180 utilisé par les endpoints d'export admin.
//
// La sortie est préfixée d'un BOM UTF-8 (U+FEFF) afin qu'Excel sous
// Windows ouvre correctement le contenu français accentué sans demander
// à l'utilisateur de choisir un encodage. Le terminateur de ligne est
// CRLF, conforme à la RFC et à l'écriture Excel par défaut.
// ============================================================

/** Byte-order mark — fait détecter l'UTF-8 à Excel au lieu de cp1252. */
const BOM = '﻿';

/**
 * Échappe un champ unique pour la sortie CSV :
 *   - null/undefined → chaîne vide
 *   - tableaux       → joints par `, ` (les listes admin ont besoin d'une vue à plat)
 *   - Date           → ISO 8601 (sans locale, Excel le rend comme du texte)
 *   - toute valeur contenant `,`, `"`, CR, ou LF est entourée de
 *     guillemets doubles et les guillemets internes sont doublés.
 */
function escapeField(value) {
  if (value === null || value === undefined) return '';

  let s;
  if (value instanceof Date) {
    s = Number.isNaN(value.getTime()) ? '' : value.toISOString();
  } else if (Array.isArray(value)) {
    s = value.map((v) => (v == null ? '' : String(v))).join(', ');
  } else {
    s = String(value);
  }

  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Sérialise un tableau de lignes en une chaîne CSV.
 *
 * @param {Array<Record<string, unknown>>} rows  - Lignes de données.
 * @param {Array<{ label: string, value: (row: any) => unknown }>} columns
 *        Descripteurs de colonne — `label` devient la cellule d'en-tête
 *        et `value` extrait la valeur de cellule de chaque ligne.
 * @returns {string} Texte CSV avec BOM UTF-8 en tête. Se termine toujours
 *          par CRLF quand il y a au moins une ligne pour que les
 *          consommateurs qui comptent les sauts de ligne ne perdent pas
 *          le dernier enregistrement.
 */
export function toCsv(rows, columns) {
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new Error('toCsv: at least one column descriptor is required');
  }

  const header = columns.map((c) => escapeField(c.label)).join(',');
  if (!Array.isArray(rows) || rows.length === 0) {
    return BOM + header + '\r\n';
  }

  const body = rows
    .map((row) => columns.map((c) => escapeField(c.value(row))).join(','))
    .join('\r\n');
  return BOM + header + '\r\n' + body + '\r\n';
}

/**
 * Envoie un corps CSV comme pièce jointe de téléchargement HTTP.
 *
 * Le nom de fichier reçoit la date du jour en YYYY-MM-DD pour que les
 * téléchargements successifs ne s'écrasent pas dans le dossier
 * Téléchargements de l'admin. Le nom de fichier est forcé en ASCII (pas
 * de caractères accentués) pour rester sûr face aux clients mail qui
 * retirent le paramètre RFC 5987 `filename*` de Content-Disposition.
 *
 * @param {import('express').Response} res
 * @param {string} baseName - Nom de fichier *sans* date ni extension (ex. « newsletter »).
 * @param {string} csv     - Corps CSV, généralement issu de `toCsv()`.
 */
export function sendCsv(res, baseName, csv) {
  const today = new Date().toISOString().slice(0, 10);
  const filename = `${baseName}-${today}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(csv);
}
