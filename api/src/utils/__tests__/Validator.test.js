// ============================================================
// Validator.test.js — Tests unitaires des helpers de validation statiques.
// Fonctions pures, pas d'IO — rapides, déterministes.
// ============================================================

import { describe, it, expect } from 'vitest';
import { Validator } from '../Validator.js';

describe('Validator.isEmail', () => {
  it('accepts well-formed addresses', () => {
    expect(Validator.isEmail('user@example.com')).toBe(true);
    expect(Validator.isEmail('etienne@csc-ostwald.fr')).toBe(true);
    expect(Validator.isEmail('first.last+tag@sub.domain.co')).toBe(true);
  });

  it('rejects malformed addresses', () => {
    expect(Validator.isEmail('no-at-sign')).toBe(false);
    expect(Validator.isEmail('@example.com')).toBe(false);
    expect(Validator.isEmail('user@')).toBe(false);
    expect(Validator.isEmail('user@host')).toBe(false); // missing TLD
    expect(Validator.isEmail('')).toBe(false);
  });

  it('returns false for non-string inputs', () => {
    expect(Validator.isEmail(null)).toBe(false);
    expect(Validator.isEmail(undefined)).toBe(false);
    expect(Validator.isEmail(42)).toBe(false);
    expect(Validator.isEmail({})).toBe(false);
  });
});

describe('Validator.isPhoneFR', () => {
  it('accepts +33 and 0X formats', () => {
    expect(Validator.isPhoneFR('+33612345678')).toBe(true);
    expect(Validator.isPhoneFR('0612345678')).toBe(true);
    expect(Validator.isPhoneFR('06 12 34 56 78')).toBe(true);
    expect(Validator.isPhoneFR('06.12.34.56.78')).toBe(true);
    expect(Validator.isPhoneFR('06-12-34-56-78')).toBe(true);
  });

  it('rejects malformed numbers', () => {
    expect(Validator.isPhoneFR('0012345678')).toBe(false); // commence par 0+0
    expect(Validator.isPhoneFR('+44612345678')).toBe(false); // mauvais pays
    expect(Validator.isPhoneFR('06123')).toBe(false); // trop court
    expect(Validator.isPhoneFR('')).toBe(false);
  });
});

describe('Validator.isNonEmptyString', () => {
  it('accepts trimmed non-empty strings', () => {
    expect(Validator.isNonEmptyString('hello')).toBe(true);
    expect(Validator.isNonEmptyString('  hi  ')).toBe(true);
  });

  it('rejects empty / whitespace-only strings', () => {
    expect(Validator.isNonEmptyString('')).toBe(false);
    expect(Validator.isNonEmptyString('   ')).toBe(false);
  });

  it('honours maxLength option', () => {
    expect(Validator.isNonEmptyString('abcde', { maxLength: 5 })).toBe(true);
    expect(Validator.isNonEmptyString('abcdef', { maxLength: 5 })).toBe(false);
  });
});

describe('Validator.isContactSubject', () => {
  it('accepts the documented subjects', () => {
    for (const subj of ['renseignement', 'inscription', 'benevole', 'partenariat', 'autre']) {
      expect(Validator.isContactSubject(subj)).toBe(true);
    }
  });

  it('rejects anything else', () => {
    expect(Validator.isContactSubject('RENSEIGNEMENT')).toBe(false); // sensible à la casse
    expect(Validator.isContactSubject('spam')).toBe(false);
    expect(Validator.isContactSubject(null)).toBe(false);
    // Les valeurs héritées du schéma d'avant l'alignement ne doivent plus passer.
    expect(Validator.isContactSubject('general')).toBe(false);
    expect(Validator.isContactSubject('activite')).toBe(false);
  });

  it('stays in sync with the frontend Zod enum', async () => {
    // Import paresseux pour que ce test ne tourne que quand les deux
    // paquets sont colocalisés (le cas dans le monorepo, et en CI qui
    // récupère les deux dossiers).
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const fs = await import('node:fs');
    const here = path.dirname(fileURLToPath(import.meta.url));
    const schemaPath = path.resolve(
      here,
      '../../../../client/src/features/contact/schemas/contact.schema.js',
    );
    if (!fs.existsSync(schemaPath)) return; // ignore quand client/ n'est pas présent
    const src = fs.readFileSync(schemaPath, 'utf8');
    const match = src.match(/CONTACT_SUBJECTS\s*=\s*\[([\s\S]*?)\]/);
    expect(match, 'CONTACT_SUBJECTS array not found in client schema').toBeTruthy();
    const clientSubjects = match[1]
      .split(',')
      .map((s) => s.replace(/['"\s]/g, ''))
      .filter(Boolean);
    expect(clientSubjects.sort()).toEqual([...Validator.CONTACT_SUBJECTS].sort());
  });
});

describe('Validator.isStringArray', () => {
  it('accepts arrays of non-empty strings', () => {
    expect(Validator.isStringArray([])).toBe(true);
    expect(Validator.isStringArray(['a', 'b'])).toBe(true);
  });

  it('rejects non-array or mixed-type input', () => {
    expect(Validator.isStringArray('a,b,c')).toBe(false);
    expect(Validator.isStringArray(['a', 1])).toBe(false);
    expect(Validator.isStringArray(['a', ''])).toBe(false);
    expect(Validator.isStringArray(null)).toBe(false);
  });
});
