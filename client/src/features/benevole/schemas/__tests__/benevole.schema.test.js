import { describe, it, expect } from 'vitest';
import { createBenevoleSchema } from '../benevole.schema';
import { fakeT } from '@/test/testHelpers';
const schema = createBenevoleSchema(fakeT);
const valid = () => ({
  nom: 'Walter',
  prenom: 'Pierrot',
  email: 'pierrot@csc-ostwald.fr',
  telephone: '0745056820',
  domaines: ['Animation'],
  competences: ['Cuisine'],
  jours: ['Lundi'],
  plages: ['Matin'],
  message: 'Disponible toute la semaine !',
  rgpdConsent: true,
});
describe('benevoleSchema', () => {
  it('accepte un payload complet valide', () => {
    expect(schema.safeParse(valid()).success).toBe(true);
  });
  it('accepte des arrays vides pour domaines/competences/jours/plages', () => {
    const result = schema.safeParse({
      ...valid(),
      domaines: [],
      competences: [],
      jours: [],
      plages: [],
    });
    expect(result.success).toBe(true);
  });
  it('accepte message vide (totalement optionnel)', () => {
    const result = schema.safeParse({ ...valid(), message: '' });
    expect(result.success).toBe(true);
  });
  it.each([
    ['nom', { nom: '' }, 'form.commun.champObligatoire'],
    ['prenom', { prenom: '' }, 'form.commun.champObligatoire'],
    ['email', { email: '' }, 'form.commun.emailInvalide'],
    ['email', { email: 'pas-un-email' }, 'form.commun.emailInvalide'],
    ['telephone', { telephone: '' }, 'form.commun.telInvalide'],
    ['telephone', { telephone: '123' }, 'form.commun.telInvalide'],
  ])('rejette quand « %s » = %j', (field, override, expectedMsg) => {
    const result = schema.safeParse({ ...valid(), ...override });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === field);
    expect(issue?.message).toBe(expectedMsg);
  });
  it('rejette quand RGPD est false', () => {
    const result = schema.safeParse({ ...valid(), rgpdConsent: false });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === 'rgpdConsent');
    expect(issue?.message).toBe('form.commun.rgpdRequired');
  });
  it('garantit que les arrays par défaut sont vides côté output', () => {
    // Si l'input omet les arrays, .default([]) doit injecter [] en sortie
    const result = schema.safeParse({
      nom: 'Xa',
      prenom: 'Yb',
      email: 'x@y.fr',
      telephone: '0612345678',
      rgpdConsent: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.domaines).toEqual([]);
      expect(result.data.competences).toEqual([]);
      expect(result.data.jours).toEqual([]);
      expect(result.data.plages).toEqual([]);
      expect(result.data.message).toBe('');
    }
  });
});
