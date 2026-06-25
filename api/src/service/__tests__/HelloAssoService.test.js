// ============================================================
// HelloAssoService.test.js — Tests de l'abstraction de la passerelle de
// paiement.
//
// Couvre la branche MOCK (par défaut en test/dev) ET le câblage OAuth +
// checkout-intents de la branche REAL. Les appels réseau de la branche
// REAL sont stubés via global.fetch pour que les tests restent hermétiques.
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We test the MOCK behaviour by leaving HELLOASSO_MODE unset (defaults
// to 'mock' in config/helloasso.js).
import { helloAssoService, __resetTokenCacheForTests } from '../HelloAssoService.js';
import { HELLOASSO_IS_MOCK } from '../../config/helloasso.js';

beforeEach(() => {
  vi.clearAllMocks();
  __resetTokenCacheForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HelloAssoService — mock mode (default in test/dev)', () => {
  it('config defaults to mock when HELLOASSO_MODE is unset', () => {
    expect(HELLOASSO_IS_MOCK).toBe(true);
  });

  it('createCheckout returns a local /mock-success URL with the registration id', async () => {
    const result = await helloAssoService.createCheckout({
      registrationId: 42,
      amountCents: 500,
      email: 'lea@example.com',
      firstName: 'Léa',
      lastName: 'Dupont',
      activityTitle: 'Atelier Rap',
    });

    expect(result.checkoutUrl).toContain('/api/payment/mock-success');
    expect(result.checkoutUrl).toContain('reg_id=42');
    expect(result.transactionRef).toBe('mock-42');
  });

  it('encodes the return URL in the checkout query string', async () => {
    const { checkoutUrl } = await helloAssoService.createCheckout({
      registrationId: 7,
    });
    // The URL is "/api/payment/mock-success?reg_id=7&return=..."
    expect(checkoutUrl).toMatch(/[?&]return=/);
  });

  it('synthesizes transactionRef from the registrationId', async () => {
    const { transactionRef } = await helloAssoService.createCheckout({ registrationId: 1 });
    expect(transactionRef).toBe('mock-1');
  });

  it('verifyWebhookSignature accepts any signature in mock mode', () => {
    expect(helloAssoService.verifyWebhookSignature('{}', 'literally-anything')).toBe(true);
    expect(helloAssoService.verifyWebhookSignature('', '')).toBe(true);
  });
});

describe('HelloAssoService — real mode (OAuth + checkout-intents)', () => {
  /**
   * Helper : remplace global.fetch par un mock séquencé. Chaque appel
   * renvoie la réponse suivante dans la file. Force les tests à être
   * explicites sur le nombre d'allers-retours HTTP attendus.
   */
  function mockFetch(...responses) {
    const queue = [...responses];
    const fn = vi.fn(async () => {
      if (queue.length === 0) throw new Error('mockFetch: ran out of responses');
      const next = queue.shift();
      if (next instanceof Error) throw next;
      return next;
    });
    global.fetch = fn;
    return fn;
  }

  it('_getAccessToken POSTs to /oauth2/token and returns the access_token', async () => {
    const fetchMock = mockFetch({
      ok: true,
      json: async () => ({ access_token: 'tok-123', expires_in: 1800 }),
    });
    const tok = await helloAssoService._getAccessToken();
    expect(tok).toBe('tok-123');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/oauth2/token');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
  });

  it('_getAccessToken throws when OAuth returns non-2xx', async () => {
    mockFetch({ ok: false, status: 401, text: async () => 'unauthorized' });
    await expect(helloAssoService._getAccessToken()).rejects.toThrow(/OAuth failed/i);
  });

  it('_createRealCheckout posts intent and returns redirectUrl + id', async () => {
    mockFetch(
      // 1) OAuth — le cache de token est vidé dans beforeEach via
      //    __resetTokenCacheForTests, donc cet appel exerce toujours le
      //    chemin OAuth, suivi de l'appel de checkout.
      {
        ok: true,
        json: async () => ({ access_token: 'tok-xyz', expires_in: 1800 }),
      },
      {
        ok: true,
        json: async () => ({
          id: 'ci-999',
          redirectUrl: 'https://checkout.helloasso.com/c/ci-999',
        }),
      },
    );
    // Le cache de token est vidé dans beforeEach, donc ce test exerce
    // toujours le chemin OAuth. La deuxième réponse mockée (le checkout)
    // est ce qui compte pour le contrat testé ici.
    const result = await helloAssoService._createRealCheckout({
      registrationId: 42,
      amountCents: 1500,
      email: 'lea@example.com',
      firstName: 'Léa',
      lastName: 'Dupont',
      activityTitle: 'Camp été',
    });
    expect(result.checkoutUrl).toBe('https://checkout.helloasso.com/c/ci-999');
    expect(result.transactionRef).toBe('ci-999');
  });
});
