// ============================================================
// public-endpoints.test.js — Tests d'intégration pour les endpoints
// publics en lecture seule qui alimentent le site public :
//   GET /api/team
//   GET /api/partners
//   GET /api/events/upcoming
//   GET /api/activities?type=...
//
// Ces tests gardent le contrat de la frontière HTTP :
//   - le câblage de route (chemin → contrôleur → service → repository)
//   - le parsing des paramètres de requête (`type`, `limit`)
//   - le comportement 4xx sur entrée invalide
//   - la forme de la réponse JSON (les champs consommés par le frontend)
//
// Les repositories sont mockés au niveau du singleton. Contrairement à
// auth-rateLimit, on n'a PAS besoin de vi.resetModules ici — les routes
// publiques n'ont pas d'état par requête (pas de limiteur de débit),
// donc une seule instance d'app partagée entre les tests fonctionne
// bien et garde les références de mock alignées.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../repository/TeamMemberRepository.js', () => ({
  teamMemberRepository: { findAllOrdered: vi.fn() },
}));
vi.mock('../../repository/PartnerRepository.js', () => ({
  partnerRepository: { findAllOrdered: vi.fn() },
}));
vi.mock('../../repository/EventRepository.js', () => ({
  eventRepository: { findUpcoming: vi.fn() },
}));
vi.mock('../../repository/ActivityRepository.js', () => ({
  activityRepository: { findPublishedByType: vi.fn() },
}));

// Imports statiques — même cache de modules que les contrôleurs testés,
// donc l'identité des vi.fn() mockés est partagée.
import teamRoutes from '../routes/team.js';
import partnersRoutes from '../routes/partners.js';
import eventsRoutes from '../routes/events.js';
import activitiesRoutes from '../routes/activities.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import { teamMemberRepository } from '../../repository/TeamMemberRepository.js';
import { partnerRepository } from '../../repository/PartnerRepository.js';
import { eventRepository } from '../../repository/EventRepository.js';
import { activityRepository } from '../../repository/ActivityRepository.js';
import { TeamMember } from '../../entity/TeamMember.js';

const app = express();
app.use(express.json());
app.use('/api/team', teamRoutes);
app.use('/api/partners', partnersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use(errorHandler);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/team', () => {
  it('returns 200 + array, public-safe shape (email + phone kept)', async () => {
    teamMemberRepository.findAllOrdered.mockResolvedValue([
      new TeamMember({
        id: 1,
        prenom: 'Etienne',
        nom: 'ENETTE',
        role: 'Directeur',
        email: 'direction@csc-ostwald.fr',
        phone: null,
        photo_url: null,
        display_order: 1,
      }),
    ]);

    const res = await request(app).get('/api/team');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({
      id: 1,
      prenom: 'Etienne',
      nom: 'ENETTE',
      role: 'Directeur',
      email: 'direction@csc-ostwald.fr',
    });
  });

  it('returns 200 + [] when the team table is empty', async () => {
    teamMemberRepository.findAllOrdered.mockResolvedValue([]);
    const res = await request(app).get('/api/team');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/partners', () => {
  it('returns 200 + array with website_url and category', async () => {
    partnerRepository.findAllOrdered.mockResolvedValue([
      {
        id: 1,
        name: 'CAF du Bas-Rhin',
        logo_url: '/assets/logos/logo-caf-671.png',
        website_url: 'https://www.caf.fr/allocataires/caf-du-bas-rhin',
        category: 'institutionnel',
        display_order: 1,
      },
      {
        id: 7,
        name: 'Centres Sociaux',
        logo_url: '/assets/logos/logo-centre-sociaux.png',
        website_url: null,
        category: 'associatif',
        display_order: 10,
      },
    ]);

    const res = await request(app).get('/api/partners');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].category).toBe('institutionnel');
    expect(res.body[1].website_url).toBeNull();
  });
});

describe('GET /api/events/upcoming', () => {
  it('forwards the limit query param to the repository', async () => {
    eventRepository.findUpcoming.mockResolvedValue([]);
    await request(app).get('/api/events/upcoming?limit=5');
    // Express parse les paramètres de requête en chaînes — le service
    // les transmet tels quels au repo, qui effectue le bornage numérique.
    expect(eventRepository.findUpcoming).toHaveBeenCalledWith({ limit: '5' });
  });

  it('returns an event with the Phase 18 fields (cout, capacite, category_*)', async () => {
    const ev = {
      id: 1,
      title: 'Atelier Peinture',
      description: null,
      date_event: '2026-11-15T13:00:00.000Z',
      lieu: 'Centre CSC Ostwald',
      cout: 'Gratuit',
      capacite: 30,
      category_id: null,
      category_label: 'Atelier pour enfants',
      category_color: '#ee961b',
      image_url: '/assets/events/event-enfants.webp',
      show_in_agenda: 1,
    };
    eventRepository.findUpcoming.mockResolvedValue([ev]);

    const res = await request(app).get('/api/events/upcoming');
    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({
      title: 'Atelier Peinture',
      cout: 'Gratuit',
      capacite: 30,
      category_label: 'Atelier pour enfants',
      category_color: '#ee961b',
    });
  });

  it('defaults to limit=10 when omitted (service-side default)', async () => {
    eventRepository.findUpcoming.mockResolvedValue([]);
    await request(app).get('/api/events/upcoming');
    // `req.query.limit` est undefined → le service applique son défaut de 10.
    expect(eventRepository.findUpcoming).toHaveBeenCalledWith({ limit: 10 });
  });
});

describe('GET /api/activities', () => {
  it('returns 200 + activities for a valid type', async () => {
    activityRepository.findPublishedByType.mockResolvedValue([
      {
        id: 1,
        title: 'Escapades en famille',
        description: 'Une sortie hebdomadaire.',
        activity_type: 'famille',
        categorie_label: 'SORTIE EN TRIBU',
        lieu: 'Centre CSC Ostwald',
        jour: 'Chaque semaine',
        horaire: null,
        frequence: 'HEBDO',
        cout: 'Gratuit',
        capacite: 20,
        tag: 'famille',
        image_url: '/assets/activities/event-enfants.webp',
        is_published: 1,
      },
    ]);

    const res = await request(app).get('/api/activities?type=famille');
    expect(res.status).toBe(200);
    expect(res.body[0].frequence).toBe('HEBDO');
    expect(res.body[0].categorie_label).toBe('SORTIE EN TRIBU');
    expect(activityRepository.findPublishedByType).toHaveBeenCalledWith('famille');
  });

  it('returns 400 when type is missing', async () => {
    const res = await request(app).get('/api/activities');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/type/i);
  });

  it('returns 400 when type is not one of the allowed enum values', async () => {
    const res = await request(app).get('/api/activities?type=mystery');
    expect(res.status).toBe(400);
  });

  it('accepts each valid type: famille, jeunesse, reguliere', async () => {
    activityRepository.findPublishedByType.mockResolvedValue([]);
    for (const type of ['famille', 'jeunesse', 'reguliere']) {
      const res = await request(app).get(`/api/activities?type=${type}`);
      expect(res.status).toBe(200);
    }
    expect(activityRepository.findPublishedByType).toHaveBeenCalledTimes(3);
  });
});
