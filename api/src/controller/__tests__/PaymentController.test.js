// ============================================================
// PaymentController.test.js — Test de régression open-redirect sur
// /api/payment/mock-success.
//
// L'endpoint mock-success était auparavant vulnérable à l'open redirect :
// `res.redirect(302, req.query.return)` honorait n'importe quelle URL.
// Ce test fige le nouveau comportement de liste blanche : seules les URLs
// dont l'origine correspond à HELLOASSO_RETURN_URL / HELLOASSO_CANCEL_URL
// sont suivies ; tout le reste retombe silencieusement sur l'URL de
// retour configurée.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../service/RegistrationService.js', () => ({
  registrationService: {
    markPaidByTransactionId: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mocke TOUT le module de config — doit inclure chaque export touché par
// les imports transitifs (HelloAssoService importe HELLOASSO_BASE_URL,
// CLIENT_ID, CLIENT_SECRET, ORG_SLUG, WEBHOOK_SECRET en plus de ce dont
// PaymentController a besoin). En omettre un produirait des erreurs
// « X is undefined » pendant l'évaluation du module.
vi.mock('../../config/helloasso.js', () => ({
  HELLOASSO_MODE: 'mock',
  HELLOASSO_IS_MOCK: true,
  HELLOASSO_BASE_URL: 'https://api.helloasso.com',
  HELLOASSO_CLIENT_ID: 'test-client-id',
  HELLOASSO_CLIENT_SECRET: 'test-client-secret',
  HELLOASSO_ORG_SLUG: 'csc-ostwald-test',
  HELLOASSO_WEBHOOK_SECRET: 'test-webhook-secret',
  HELLOASSO_RETURN_URL: 'http://localhost:5173/jeunesse/inscription-confirmee',
  HELLOASSO_CANCEL_URL: 'http://localhost:5173/jeunesse',
  RETURN_URL_ALLOWED_ORIGINS: new Set(['http://localhost:5173']),
}));

import { PaymentController } from '../PaymentController.js';

function buildApp() {
  const app = express();
  app.get('/api/payment/mock-success', PaymentController.mockSuccess);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PaymentController.mockSuccess — open redirect protection', () => {
  it('redirects to the configured URL when no return param is provided', async () => {
    const res = await request(buildApp()).get('/api/payment/mock-success?reg_id=1');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('http://localhost:5173/jeunesse/inscription-confirmee');
  });

  it('redirects to an allowlisted same-origin URL when provided', async () => {
    const safe = 'http://localhost:5173/jeunesse/inscription-confirmee?reg=42';
    const res = await request(buildApp())
      .get('/api/payment/mock-success')
      .query({ reg_id: 1, return: safe });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(safe);
  });

  it('rejects an external return URL and falls back to the configured one', async () => {
    const evil = 'https://attacker.example.com/phish';
    const res = await request(buildApp())
      .get('/api/payment/mock-success')
      .query({ reg_id: 1, return: evil });
    expect(res.status).toBe(302);
    expect(res.headers.location).not.toContain('attacker.example.com');
    expect(res.headers.location).toBe('http://localhost:5173/jeunesse/inscription-confirmee');
  });

  it('rejects protocol-relative URLs (//attacker.example.com)', async () => {
    const res = await request(buildApp())
      .get('/api/payment/mock-success')
      .query({ reg_id: 1, return: '//attacker.example.com/anywhere' });
    expect(res.status).toBe(302);
    expect(res.headers.location).not.toContain('attacker.example.com');
  });

  it('rejects javascript: scheme', async () => {
    const res = await request(buildApp())
      .get('/api/payment/mock-success')
      .query({ reg_id: 1, return: 'javascript:alert(1)' });
    expect(res.status).toBe(302);
    expect(res.headers.location).not.toContain('javascript:');
  });

  it('rejects a numeric reg_id of 0 / negative / NaN with 400', async () => {
    const cases = ['0', '-1', 'abc'];
    for (const v of cases) {
      const res = await request(buildApp()).get(`/api/payment/mock-success?reg_id=${v}`);
      expect(res.status).toBe(400);
    }
  });
});
