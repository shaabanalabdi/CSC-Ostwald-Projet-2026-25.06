import { describe, it, expect } from 'vitest';
import { createContactSchema, CONTACT_SUBJECTS } from '../contact.schema';
import { fakeT } from '@/test/testHelpers';
const schema = createContactSchema(fakeT);
/** Fabrique un payload valide minimal pour mutter ensuite un seul champ. */
const valid = () => ({
  prenom: 'Charline',
  nom: 'Bauer',
  email: 'charline@csc-ostwald.fr',
  telephone: '0612345678',
  sujet: 'renseignement',
  message: 'Bonjour, je souhaite des informations.',
  rgpdConsent: true,
});
describe('contactSchema', () => {
  it('accepte un payload complet valide', () => {
    expect(schema.safeParse(valid()).success).toBe(true);
  });
  it('accepte telephone vide (champ optionnel)', () => {
    const result = schema.safeParse({ ...valid(), telephone: '' });
    expect(result.success).toBe(true);
  });
  it.each(CONTACT_SUBJECTS)('accepte chacun des 5 sujets autorisés (« %s »)', (sujet) => {
    expect(schema.safeParse({ ...valid(), sujet }).success).toBe(true);
  });
  it('rejette un sujet vide', () => {
    const result = schema.safeParse({ ...valid(), sujet: '' });
    expect(result.success).toBe(false);
    const sujetIssue = result.error?.issues.find((i) => i.path[0] === 'sujet');
    expect(sujetIssue?.message).toBe('form.commun.champObligatoire');
  });
  it('rejette un sujet hors de la liste blanche', () => {
    const result = schema.safeParse({ ...valid(), sujet: 'spam-attack' });
    expect(result.success).toBe(false);
    const sujetIssue = result.error?.issues.find((i) => i.path[0] === 'sujet');
    expect(sujetIssue?.message).toBe('form.commun.champObligatoire');
  });
  it('rejette telephone renseigné mais mal formé', () => {
    const result = schema.safeParse({ ...valid(), telephone: '123' });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === 'telephone');
    expect(issue?.message).toBe('form.commun.telInvalide');
  });
  it.each([
    ['prenom', { prenom: '' }],
    ['nom', { nom: '' }],
    ['email', { email: 'pas-un-email' }],
    ['message', { message: '' }],
  ])('rejette quand « %s » est invalide', (field, override) => {
    const result = schema.safeParse({ ...valid(), ...override });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === field);
    expect(issue).toBeDefined();
  });
  it('rejette quand RGPD est false', () => {
    const result = schema.safeParse({ ...valid(), rgpdConsent: false });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === 'rgpdConsent');
    expect(issue?.message).toBe('form.commun.rgpdRequired');
  });
});
