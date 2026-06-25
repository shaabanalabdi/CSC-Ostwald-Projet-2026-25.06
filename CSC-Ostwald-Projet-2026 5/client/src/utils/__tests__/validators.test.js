import { describe, it, expect } from 'vitest';
import { emailRegex, phoneRegex } from '../validators';
describe('emailRegex', () => {
  it.each([
    ['utilisateur@domaine.fr', true],
    ['simple@a.io', true],
    ['nom.prenom@csc-ostwald.fr', true],
    // Caractères autorisés dans la partie locale : . _ % -
    ['a_b%c-d.e@x.yz', true],
  ])('accepte « %s »', (input, expected) => {
    expect(emailRegex.test(input)).toBe(expected);
  });
  it.each([
    ['', false],
    ['pas-un-email', false],
    ['@domaine.fr', false],
    ['user@', false],
    ['user@domain', false], // pas d'extension
    ['user@.fr', false],
    ['user @domain.fr', false], // espace interne
    // Le `+` n'est PAS dans la classe `[a-zA-Z0-9._%-]` → rejette les
    // adresses style Gmail `user+tag@…`. Documente une limite connue de la
    // regex actuelle, à élargir si le client veut accepter ce pattern.
    ['name+tag@domain.co.uk', false],
  ])('rejette « %s »', (input, expected) => {
    expect(emailRegex.test(input)).toBe(expected);
  });
});
describe('phoneRegex', () => {
  it.each([
    ['0612345678', true],
    ['06 12 34 56 78', true],
    ['06.12.34.56.78', true],
    ['06-12-34-56-78', true],
    ['+33612345678', true],
    ['0033612345678', true],
  ])('accepte le format français « %s »', (input, expected) => {
    expect(phoneRegex.test(input)).toBe(expected);
  });
  it.each([
    ['', false],
    ['01234567', false], // pas assez de chiffres
    ['0012345678', false], // commence par 0 mais 2e chiffre = 0 (interdit)
    ['+44612345678', false], // indicatif UK
    ['abcdefghij', false],
    ['+33012345678', false], // 0 après l'indicatif
    // Le séparateur est optionnel APRÈS le [1-9], pas avant :
    // `+336 12 34 56 78` passerait, `+33 6 ...` non. Documente le contrat actuel.
    ['+33 6 12 34 56 78', false],
  ])('rejette « %s »', (input, expected) => {
    expect(phoneRegex.test(input)).toBe(expected);
  });
});
