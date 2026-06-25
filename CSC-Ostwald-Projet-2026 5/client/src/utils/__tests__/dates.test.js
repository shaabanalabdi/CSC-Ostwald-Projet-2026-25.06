import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseDateFR, isEventPast } from '../dates';
describe('parseDateFR', () => {
  it.each([
    ['18 juillet 2026', { year: 2026, month: 6, day: 18 }],
    ['1 janvier 2027', { year: 2027, month: 0, day: 1 }],
    ['25 décembre 2025', { year: 2025, month: 11, day: 25 }],
    ['8 mars 2026', { year: 2026, month: 2, day: 8 }],
    ['10 août 2026', { year: 2026, month: 7, day: 10 }], // accent ASCII
  ])('parse « %s »', (input, expected) => {
    const result = parseDateFR(input);
    expect(result).not.toBeNull();
    expect(result?.getFullYear()).toBe(expected.year);
    expect(result?.getMonth()).toBe(expected.month);
    expect(result?.getDate()).toBe(expected.day);
  });
  it.each([
    null,
    undefined,
    '',
    'Chaque semaine', // événement récurrent
    'Chaque mois',
    '18 jullet 2026', // typo de mois
    '18 juillet', // pas d'année
    'invalid input',
  ])('retourne null pour « %s »', (input) => {
    expect(parseDateFR(input)).toBeNull();
  });
});
describe('isEventPast', () => {
  // On fige la date à 2026-05-18 (cf. CLAUDE.md) pour rendre les tests déterministes
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 18, 12, 0, 0)); // 18 mai 2026, 12:00
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('retourne true pour une date passée', () => {
    expect(isEventPast('1 janvier 2026')).toBe(true);
    expect(isEventPast('17 mai 2026')).toBe(true);
  });
  it("retourne false pour aujourd'hui (égal, pas avant)", () => {
    // La comparaison est `<`, pas `<=` → aujourd'hui ne compte PAS comme passé.
    expect(isEventPast('18 mai 2026')).toBe(false);
  });
  it('retourne false pour une date future', () => {
    expect(isEventPast('19 mai 2026')).toBe(false);
    expect(isEventPast('1 janvier 2027')).toBe(false);
  });
  it('retourne false pour les événements récurrents (date non parsable)', () => {
    // Récurrent → toujours visible (jamais archivé)
    expect(isEventPast('Chaque semaine')).toBe(false);
    expect(isEventPast(null)).toBe(false);
    expect(isEventPast(undefined)).toBe(false);
  });
});
