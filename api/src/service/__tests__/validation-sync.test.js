// ============================================================
// validation-sync.test.js — Détection d'écart entre les schémas Zod du
// frontend et les `LIMITS` appliquées par le backend.
//
// Les bornes de longueur sont DUPLIQUÉES par nécessité : le backend les
// applique dans chaque Service (frontière de sécurité), le frontend dans
// son schéma Zod (UX). Si les deux divergent, une saisie acceptée par le
// formulaire est rejetée par l'API en 422 — ou l'inverse.
//
// Ce test lit les constantes `*_LIMITS` du frontend et échoue dès qu'elles
// ne correspondent plus aux `LIMITS` du backend. L'enum `CONTACT_SUBJECTS`
// est couvert séparément dans utils/__tests__/Validator.test.js.
// ============================================================

import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LIMITS as MESSAGE_LIMITS } from '../MessageService.js';
import { LIMITS as BENEVOLE_LIMITS_API } from '../BenevoleApplicationService.js';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Lit un objet littéral `export const <name> = { ... };` depuis un fichier
 * source du frontend et le renvoie comme objet JS simple.
 *
 * On NE fait pas d'`import` direct : le fichier schéma tire `zod` et des
 * alias Vite (`@utils/...`) que ce paquet api ne résout pas. Lire le texte
 * reste donc l'approche la plus robuste (même choix que Validator.test.js).
 *
 * @returns {object|null} l'objet, ou null si client/ n'est pas colocalisé.
 */
function scrapeConst(relPathFromRepoRoot, name) {
  const filePath = path.resolve(here, '../../../../', relPathFromRepoRoot);
  if (!fs.existsSync(filePath)) return null;
  const src = fs.readFileSync(filePath, 'utf8');
  const match = src.match(new RegExp(`export const ${name}\\s*=\\s*\\{([\\s\\S]*?)\\n\\};`));
  if (!match) {
    throw new Error(`${name} introuvable dans ${relPathFromRepoRoot}`);
  }
  const json = `{${match[1]}}`
    .replace(/([A-Za-z_]\w*)\s*:/g, '"$1":') // identifiants → clés JSON
    .replace(/,(\s*[}\]])/g, '$1'); // retire les virgules finales
  return JSON.parse(json);
}

describe('synchronisation des limites — formulaire de contact', () => {
  const clientLimits = scrapeConst(
    'client/src/features/contact/schemas/contact.schema.js',
    'CONTACT_LIMITS',
  );

  it('CONTACT_LIMITS (Zod frontend) est identique à LIMITS (MessageService)', () => {
    if (clientLimits === null) return; // client/ non présent → test ignoré
    expect(clientLimits).toEqual(MESSAGE_LIMITS);
  });
});

describe('synchronisation des limites — formulaire bénévole', () => {
  const clientLimits = scrapeConst(
    'client/src/features/benevole/schemas/benevole.schema.js',
    'BENEVOLE_LIMITS',
  );

  it('BENEVOLE_LIMITS (Zod frontend) est identique à LIMITS (BenevoleApplicationService)', () => {
    if (clientLimits === null) return;
    expect(clientLimits).toEqual(BENEVOLE_LIMITS_API);
  });
});
