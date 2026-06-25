// ============================================================
// csv.test.js — Vérifie l'échappement RFC 4180 + le BOM + les
// terminateurs CRLF. Fonction pure, pas d'IO.
// ============================================================

import { describe, it, expect } from 'vitest';
import { toCsv } from '../csv.js';

const BOM = '﻿';

describe('toCsv', () => {
  const cols = [
    { label: 'id', value: (r) => r.id },
    { label: 'email', value: (r) => r.email },
    { label: 'message', value: (r) => r.message },
  ];

  it('emits BOM + header even when there are no rows', () => {
    expect(toCsv([], cols)).toBe(BOM + 'id,email,message\r\n');
  });

  it('serializes plain rows with CRLF separators and a trailing CRLF', () => {
    const rows = [
      { id: 1, email: 'a@b.fr', message: 'bonjour' },
      { id: 2, email: 'c@d.fr', message: 'salut' },
    ];
    expect(toCsv(rows, cols)).toBe(
      BOM + 'id,email,message\r\n1,a@b.fr,bonjour\r\n2,c@d.fr,salut\r\n',
    );
  });

  it('quotes fields containing commas, quotes, or newlines and doubles inner quotes', () => {
    const rows = [
      { id: 1, email: 'x@y.fr', message: 'avec, virgule' },
      { id: 2, email: 'x@y.fr', message: 'guillemet "embedded"' },
      { id: 3, email: 'x@y.fr', message: 'ligne1\nligne2' },
    ];
    const csv = toCsv(rows, cols);
    expect(csv).toContain('1,x@y.fr,"avec, virgule"');
    expect(csv).toContain('2,x@y.fr,"guillemet ""embedded"""');
    expect(csv).toContain('3,x@y.fr,"ligne1\nligne2"');
  });

  it('treats null and undefined as empty strings', () => {
    const rows = [{ id: 1, email: null, message: undefined }];
    expect(toCsv(rows, cols)).toBe(BOM + 'id,email,message\r\n1,,\r\n');
  });

  it('joins arrays with ", " for JSON columns (benevole domaines etc.)', () => {
    const rows = [{ id: 1, email: 'x@y.fr', message: ['Animation', 'Logistique'] }];
    expect(toCsv(rows, cols)).toBe(
      BOM + 'id,email,message\r\n1,x@y.fr,"Animation, Logistique"\r\n',
    );
  });

  it('serializes Date instances to ISO 8601', () => {
    const rows = [{ id: 1, email: 'x@y.fr', message: new Date('2026-05-19T08:30:00.000Z') }];
    expect(toCsv(rows, cols)).toBe(
      BOM + 'id,email,message\r\n1,x@y.fr,2026-05-19T08:30:00.000Z\r\n',
    );
  });

  it('throws when no columns are provided', () => {
    expect(() => toCsv([], [])).toThrow();
    expect(() => toCsv([], undefined)).toThrow();
  });
});
