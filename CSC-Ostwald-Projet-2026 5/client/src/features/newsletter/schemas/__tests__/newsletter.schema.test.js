import { describe, it, expect } from 'vitest';
import { createNewsletterSchema } from '../newsletter.schema';
import { fakeT } from '@/test/testHelpers';
const schema = createNewsletterSchema(fakeT);
describe('newsletterSchema', () => {
  it('accepte un email valide + consentement RGPD', () => {
    const result = schema.safeParse({
      email: 'user@csc-ostwald.fr',
      rgpdConsent: true,
    });
    expect(result.success).toBe(true);
  });
  it('trim les espaces autour de l’email', () => {
    const result = schema.safeParse({
      email: '  user@csc-ostwald.fr  ',
      rgpdConsent: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@csc-ostwald.fr');
    }
  });
  it('rejette une chaîne vide', () => {
    const result = schema.safeParse({ email: '', rgpdConsent: true });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('footer.emailInvalide');
  });
  it('rejette un email mal formé', () => {
    const result = schema.safeParse({ email: 'pas-un-email', rgpdConsent: true });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('footer.emailInvalide');
  });
  it('rejette quand RGPD est false', () => {
    const result = schema.safeParse({
      email: 'user@csc-ostwald.fr',
      rgpdConsent: false,
    });
    expect(result.success).toBe(false);
    // Cherche l'issue qui concerne rgpdConsent (peut ne pas être à l'index 0)
    const rgpdIssue = result.error?.issues.find((i) => i.path[0] === 'rgpdConsent');
    expect(rgpdIssue?.message).toBe('footer.rgpdRequired');
  });
});
