import { describe, it, expect } from 'vitest';
import { parseCoutToCents } from '../parseCout';
describe('parseCoutToCents', () => {
  it('treats "Gratuit" as zero cents', () => {
    expect(parseCoutToCents('Gratuit')).toBe(0);
    expect(parseCoutToCents('gratuit')).toBe(0);
    expect(parseCoutToCents('GRATUIT')).toBe(0);
  });
  it('treats other free synonyms as zero cents', () => {
    expect(parseCoutToCents('Free')).toBe(0);
    expect(parseCoutToCents('libre')).toBe(0);
    expect(parseCoutToCents('Sans frais')).toBe(0);
    expect(parseCoutToCents('0')).toBe(0);
  });
  it('parses integer euro amounts', () => {
    expect(parseCoutToCents('5€')).toBe(500);
    expect(parseCoutToCents('5 €')).toBe(500);
    expect(parseCoutToCents('10€')).toBe(1000);
    expect(parseCoutToCents('100 €')).toBe(10000);
  });
  it('parses decimal amounts with comma or dot', () => {
    expect(parseCoutToCents('5,50€')).toBe(550);
    expect(parseCoutToCents('5.50€')).toBe(550);
    expect(parseCoutToCents('5,5€')).toBe(550); // single decimal → tens
    expect(parseCoutToCents('12,99 €')).toBe(1299);
  });
  it('accepts the EUR/euros suffix', () => {
    expect(parseCoutToCents('5 EUR')).toBe(500);
    expect(parseCoutToCents('5 euros')).toBe(500);
    expect(parseCoutToCents('5 euro')).toBe(500);
  });
  it('returns null for null/undefined/empty input', () => {
    expect(parseCoutToCents(null)).toBeNull();
    expect(parseCoutToCents(undefined)).toBeNull();
    expect(parseCoutToCents('')).toBeNull();
    expect(parseCoutToCents('   ')).toBeNull();
  });
  it('returns null for unparseable strings', () => {
    expect(parseCoutToCents('Variable')).toBeNull();
    expect(parseCoutToCents('Selon profil')).toBeNull();
    expect(parseCoutToCents('Voir avec Aurélie')).toBeNull();
  });
});
