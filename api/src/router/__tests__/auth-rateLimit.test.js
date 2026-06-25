// ============================================================
// auth-rateLimit.test.js — Test d'intégration pour POST /api/auth/login.
//
// Vérifie les DEUX couches câblées ensemble :
//   1. Route Express → AuthController.signIn → AuthService.signIn
//      → UserRepository.findByEmail mocké
//   2. Le middleware express-rate-limit devant la route.
//
// On construit une app Express minimale qui reflète server.js (le
// limiteur de débit, cookie-parser, le parser de corps JSON, les
// routes, le handler d'erreur). supertest pilote les appels HTTP sans
// lier de port.
//
// IMPORTANT : chaque import qui touche la hiérarchie HttpException doit
// être chargé À L'INTÉRIEUR de buildApp() (après vi.resetModules), sinon
// l'errorHandler finit par détenir une référence à HttpException
// différente de l'AuthService fraîchement chargé, et
// `err instanceof HttpException` renvoie silencieusement false → 500 au
// lieu de 401.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';

vi.mock('../../repository/UserRepository.js', () => ({
  userRepository: {
    findByEmail: vi.fn(),
  },
}));

/**
 * Construit une app Express fraîche + une instance de limiteur de débit
 * FRAÎCHE pour chaque test. `vi.resetModules()` vide le cache de modules
 * pour que ré-importer `routes/auth.js` reconstruise le limiteur (son
 * store en mémoire démarre vide). Tous les modules connaissant
 * HttpException sont ré-importés dans la même passe pour qu'ils
 * partagent une seule identité de classe.
 */
async function buildApp() {
  vi.resetModules();
  const [{ default: authRoutes }, { errorHandler }, { userRepository }] = await Promise.all([
    import('../routes/auth.js'),
    import('../../middleware/errorHandler.js'),
    import('../../repository/UserRepository.js'),
  ]);

  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
  return { app, userRepository };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/login — rate limit', () => {
  it('returns 401 the first 5 times with bad credentials', async () => {
    const { app, userRepository } = await buildApp();
    userRepository.findByEmail.mockResolvedValue(null);

    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: `admin${i}@csc-ostwald.fr`, password: 'wrong' });
      expect(res.status).toBe(401);
    }
  });

  it('blocks the 6th attempt with 429 + a French message', async () => {
    const { app, userRepository } = await buildApp();
    userRepository.findByEmail.mockResolvedValue(null);

    // Épuise le budget de 5 tentatives
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@csc-ostwald.fr', password: 'wrong' });
    }

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@csc-ostwald.fr', password: 'wrong' });

    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/Trop de tentatives/i);
  });

  it('exposes draft-7 RateLimit headers', async () => {
    const { app, userRepository } = await buildApp();
    userRepository.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@csc-ostwald.fr', password: 'wrong' });

    // standardHeaders: 'draft-7' émet `RateLimit-Policy` + `RateLimit`
    // (en-tête combiné). supertest met les clés d'en-tête en minuscules.
    expect(res.headers).toHaveProperty('ratelimit-policy');
    expect(res.headers).toHaveProperty('ratelimit');
  });

  it('counts 4xx attempts toward the limit (so 3×400 + 2×401 = lockout on the 6th)', async () => {
    // Documente le contrat réel : le limiteur incrémente à chaque
    // requête, puis `skipSuccessfulRequests: true` ne décrémente que sur
    // les 2xx. Les 4xx + 5xx comptent tous les deux, donc un flot
    // d'appels au payload erroné déclenche aussi le verrouillage —
    // exactement ce qu'on veut pour la défense anti-brute-force.
    const { app, userRepository } = await buildApp();
    userRepository.findByEmail.mockResolvedValue(null);

    for (let i = 0; i < 3; i++) {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
    }
    for (let i = 0; i < 2; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@csc-ostwald.fr', password: 'wrong' });
    }
    const last = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@csc-ostwald.fr', password: 'wrong' });
    expect(last.status).toBe(429);
  });
});
