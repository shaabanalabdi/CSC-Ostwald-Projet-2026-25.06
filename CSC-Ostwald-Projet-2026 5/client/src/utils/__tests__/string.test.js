import { describe, it, expect } from 'vitest';
import { normalize } from '../string';
describe('normalize', () => {
  it.each([
    ['Réservé', 'reserve'],
    ['Été', 'ete'],
    ['Châtaigne', 'chataigne'],
    ['Année', 'annee'],
    ['Hôpital', 'hopital'],
    ['NoËl', 'noel'],
    ['Français', 'francais'], // ç n'est pas un caractère accentué → reste tel quel
    ['Déjà', 'deja'],
  ])('« %s » → « %s »', (input, expected) => {
    expect(normalize(input)).toBe(expected);
  });
  it('met en minuscule sans accent', () => {
    expect(normalize('HELLO')).toBe('hello');
    expect(normalize('AÉIÔÙ')).toBe('aeiou');
  });
  it('laisse les chaînes ASCII intactes (sauf casse)', () => {
    expect(normalize('hello world')).toBe('hello world');
    expect(normalize('Test123')).toBe('test123');
  });
  it('gère la chaîne vide', () => {
    expect(normalize('')).toBe('');
  });
});
