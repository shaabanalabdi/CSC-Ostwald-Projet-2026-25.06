// ============================================================
// csrfProtection.test.js — Tests unitaires de la garde double-submit-cookie.
//
// Vérifie le contrat central sur lequel s'appuie chaque mutation
// /api/admin/* :
//   - GET/HEAD/OPTIONS passent sans token (lecture seule).
//   - POST/PATCH/PUT/DELETE exigent À LA FOIS le cookie ET l'en-tête correspondant.
//   - Le plancher de longueur du token (16 caractères) est appliqué.
//   - Les tokens non concordants sont rejetés.
//   - Les tokens de même longueur mais différents sont rejetés par la
//     comparaison en temps constant (l'assertion ne porte pas sur le
//     timing ici, juste sur l'exactitude).
// ============================================================

import { describe, it, expect } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { csrfProtection } from '../csrfProtection.js';
import { errorHandler } from '../errorHandler.js';

function buildApp() {
  const app = express();
  app.use(cookieParser());
  app.use(csrfProtection);
  // Un handler d'écho trivial pour distinguer « passé » de « bloqué ».
  app.all('/echo', (_req, res) => res.status(200).json({ ok: true }));
  app.use(errorHandler);
  return app;
}

const VALID_TOKEN = 'a'.repeat(32);

describe('csrfProtection — safe methods bypass', () => {
  it('lets GET pass without a token', async () => {
    const res = await request(buildApp()).get('/echo');
    expect(res.status).toBe(200);
  });

  it('lets HEAD pass without a token', async () => {
    const res = await request(buildApp()).head('/echo');
    expect(res.status).toBe(200);
  });

  it('lets OPTIONS pass without a token', async () => {
    const res = await request(buildApp()).options('/echo');
    expect(res.status).toBe(200);
  });
});

describe('csrfProtection — mutating methods require token', () => {
  it('rejects POST with no cookie and no header (403)', async () => {
    const res = await request(buildApp()).post('/echo').send({});
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/CSRF/i);
  });

  it('rejects POST with cookie but no header', async () => {
    const res = await request(buildApp())
      .post('/echo')
      .set('Cookie', [`csrf_token=${VALID_TOKEN}`])
      .send({});
    expect(res.status).toBe(403);
  });

  it('rejects POST with header but no cookie', async () => {
    const res = await request(buildApp()).post('/echo').set('X-CSRF-Token', VALID_TOKEN).send({});
    expect(res.status).toBe(403);
  });

  it('rejects POST when cookie and header tokens differ', async () => {
    const res = await request(buildApp())
      .post('/echo')
      .set('Cookie', [`csrf_token=${VALID_TOKEN}`])
      .set('X-CSRF-Token', 'b'.repeat(32))
      .send({});
    expect(res.status).toBe(403);
  });

  it('rejects POST when the cookie token is shorter than the 16-char floor', async () => {
    const short = 'a'.repeat(15);
    const res = await request(buildApp())
      .post('/echo')
      .set('Cookie', [`csrf_token=${short}`])
      .set('X-CSRF-Token', short)
      .send({});
    expect(res.status).toBe(403);
  });

  it('accepts POST when cookie + header match and meet the length floor', async () => {
    const res = await request(buildApp())
      .post('/echo')
      .set('Cookie', [`csrf_token=${VALID_TOKEN}`])
      .set('X-CSRF-Token', VALID_TOKEN)
      .send({});
    expect(res.status).toBe(200);
  });

  it('rejects POST when cookie and header differ in length (no timing oracle)', async () => {
    const res = await request(buildApp())
      .post('/echo')
      .set('Cookie', [`csrf_token=${VALID_TOKEN}`])
      .set('X-CSRF-Token', VALID_TOKEN + 'extra')
      .send({});
    expect(res.status).toBe(403);
  });

  it('applies the check to PATCH', async () => {
    const blocked = await request(buildApp()).patch('/echo').send({});
    expect(blocked.status).toBe(403);
    const allowed = await request(buildApp())
      .patch('/echo')
      .set('Cookie', [`csrf_token=${VALID_TOKEN}`])
      .set('X-CSRF-Token', VALID_TOKEN);
    expect(allowed.status).toBe(200);
  });

  it('applies the check to DELETE', async () => {
    const blocked = await request(buildApp()).delete('/echo');
    expect(blocked.status).toBe(403);
    const allowed = await request(buildApp())
      .delete('/echo')
      .set('Cookie', [`csrf_token=${VALID_TOKEN}`])
      .set('X-CSRF-Token', VALID_TOKEN);
    expect(allowed.status).toBe(200);
  });
});
