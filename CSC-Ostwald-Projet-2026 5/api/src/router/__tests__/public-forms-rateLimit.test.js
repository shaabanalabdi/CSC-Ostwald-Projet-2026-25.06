// ============================================================
// public-forms-rateLimit.test.js — Test d'intégration de la garde
// anti-spam sur les 3 endpoints de formulaire public.
//
// Le motif reflète auth-rateLimit.test.js : construire une app fraîche
// par test (vi.resetModules) pour que chaque test démarre avec un store
// de limiteur de débit en mémoire vide. Tous les modules connaissant
// HttpException sont ré-importés dans la même passe pour que l'identité
// de classe reste cohérente.
//
// On teste UN endpoint en profondeur (newsletter) plus un rapide test
// de fumée sur les deux autres — la config du limiteur est identique,
// donc un comportement identique est une hypothèse raisonnable.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../repository/NewsletterRepository.js', () => ({
  newsletterRepository: {
    find: vi.fn(),
    findOneBy: vi.fn(),
    save: vi.fn(),
  },
}));
vi.mock('../../repository/MessageRepository.js', () => ({
  messageRepository: { save: vi.fn() },
}));
vi.mock('../../repository/BenevoleApplicationRepository.js', () => ({
  benevoleApplicationRepository: { save: vi.fn() },
}));

async function buildApp() {
  vi.resetModules();
  const [
    { default: newsletterRoutes },
    { default: contactRoutes },
    { default: benevoleRoutes },
    { errorHandler },
  ] = await Promise.all([
    import('../routes/newsletter.js'),
    import('../routes/contact.js'),
    import('../routes/benevole.js'),
    import('../../middleware/errorHandler.js'),
  ]);

  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use('/api/newsletter', newsletterRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/benevole', benevoleRoutes);
  app.use(errorHandler);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/newsletter — rate limit', () => {
  it('returns 400 (validation) for the first 5 invalid submissions', async () => {
    const app = await buildApp();
    // Corps vide → NewsletterService lève BadRequestException.
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/newsletter').send({});
      expect(res.status).toBe(400);
    }
  });

  it('blocks the 6th submission with 429 + French message', async () => {
    const app = await buildApp();
    // Épuise le budget avec 5 soumissions invalides.
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/newsletter').send({});
    }
    const res = await request(app).post('/api/newsletter').send({});
    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/Trop de soumissions/i);
  });

  it('exposes draft-7 RateLimit headers', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/newsletter').send({});
    expect(res.headers).toHaveProperty('ratelimit-policy');
    expect(res.headers).toHaveProperty('ratelimit');
  });

  it('counts successful submissions too (no skipSuccessfulRequests)', async () => {
    // Diffère de /login : chaque post de formulaire compte pour la
    // limite, valide ou non. C'est intentionnel — la menace est le
    // volume de spam, pas la devinette d'identifiants.
    const app = await buildApp();
    const { newsletterRepository } = await import('../../repository/NewsletterRepository.js');
    newsletterRepository.findOneBy.mockResolvedValue(null);
    newsletterRepository.save.mockImplementation((row) => {
      row.id = Math.floor(Math.random() * 1000);
      return Promise.resolve();
    });
    newsletterRepository.find.mockResolvedValue({
      id: 1,
      email: 'a@b.fr',
      subscribed_at: new Date(),
    });

    // 5 soumissions valides avec des e-mails différents.
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/newsletter')
        .send({ email: `a${i}@b.fr` });
      expect([200, 201]).toContain(res.status);
    }

    // La 6e — même avec un e-mail valide — est bloquée.
    const blocked = await request(app).post('/api/newsletter').send({ email: 'a6@b.fr' });
    expect(blocked.status).toBe(429);
  });
});

describe('POST /api/contact — rate limit', () => {
  it('blocks after 5 submissions in the same window', async () => {
    const app = await buildApp();
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/contact').send({});
    }
    const res = await request(app).post('/api/contact').send({});
    expect(res.status).toBe(429);
  });
});

describe('POST /api/benevole — rate limit', () => {
  it('blocks after 5 submissions in the same window', async () => {
    const app = await buildApp();
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/benevole').send({});
    }
    const res = await request(app).post('/api/benevole').send({});
    expect(res.status).toBe(429);
  });
});

describe('per-route counters are independent', () => {
  it('hitting the newsletter limit does not block contact or benevole', async () => {
    const app = await buildApp();
    // Épuise le budget de la newsletter.
    for (let i = 0; i < 6; i++) {
      await request(app).post('/api/newsletter').send({});
    }
    // Contact + benevole ont toujours leur budget complet — 400
    // (validation), pas 429.
    const contactRes = await request(app).post('/api/contact').send({});
    expect(contactRes.status).not.toBe(429);
    const benevoleRes = await request(app).post('/api/benevole').send({});
    expect(benevoleRes.status).not.toBe(429);
  });
});
