// ============================================================
// EventService.test.js — Tests unitaires du service d'événements de
// l'agenda.
//
// Le Repository est mocké au niveau du singleton — pas de DB nécessaire.
// La suite couvre :
//   - la validation (longueur du titre, date requise + valide, champs
//     optionnels, défaut de show_in_agenda)
//   - le câblage CRUD (NotFoundException pour les lignes manquantes,
//     save appelé une fois)
//   - listUpcoming délègue à la requête personnalisée du repository
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../repository/EventRepository.js', () => ({
  eventRepository: {
    find: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    findPaginated: vi.fn(),
    findUpcoming: vi.fn(),
  },
}));

import { eventService } from '../EventService.js';
import { eventRepository } from '../../repository/EventRepository.js';
import { NotFoundException, UnprocessableEntityException } from '../../error/HttpException.js';

const VALID_PAYLOAD = {
  title: "Soirée d'inauguration",
  description: 'On fête le démarrage du nouveau projet social.',
  date_event: '2027-09-12T18:30',
  lieu: 'Salle des fêtes',
  show_in_agenda: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EventService.create — validation', () => {
  it('rejects a short title with per-field error', async () => {
    const err = await eventService.create({ ...VALID_PAYLOAD, title: 'A' }).catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('title');
  });

  it('rejects a missing date_event', async () => {
    const err = await eventService.create({ ...VALID_PAYLOAD, date_event: '' }).catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('date_event');
  });

  it('rejects an unparseable date_event', async () => {
    const err = await eventService
      .create({ ...VALID_PAYLOAD, date_event: 'pas-une-date' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('date_event');
  });

  it('accepts an ISO-formatted date and parses it to a Date', async () => {
    eventRepository.save.mockResolvedValue(undefined);
    eventRepository.find.mockResolvedValue({ id: 1, ...VALID_PAYLOAD });

    await eventService.create({ ...VALID_PAYLOAD, date_event: '2027-09-12T18:30:00Z' });
    const saved = eventRepository.save.mock.calls[0][0];
    expect(saved.date_event).toBeInstanceOf(Date);
    expect(saved.date_event.toISOString()).toBe('2027-09-12T18:30:00.000Z');
  });

  it('coerces show_in_agenda to 0/1 (default true → 1)', async () => {
    eventRepository.save.mockResolvedValue(undefined);
    eventRepository.find.mockResolvedValue({ id: 1 });

    await eventService.create(VALID_PAYLOAD);
    expect(eventRepository.save.mock.calls[0][0].show_in_agenda).toBe(1);

    vi.clearAllMocks();
    eventRepository.save.mockResolvedValue(undefined);
    eventRepository.find.mockResolvedValue({ id: 2 });
    await eventService.create({ ...VALID_PAYLOAD, show_in_agenda: false });
    expect(eventRepository.save.mock.calls[0][0].show_in_agenda).toBe(0);
  });

  it('drops unknown fields from the payload', async () => {
    eventRepository.save.mockResolvedValue(undefined);
    eventRepository.find.mockResolvedValue({ id: 1 });

    await eventService.create({ ...VALID_PAYLOAD, evil_payload: '<script>', id: 9999 });

    const saved = eventRepository.save.mock.calls[0][0];
    expect(saved).not.toHaveProperty('evil_payload');
    // id stays null at creation (DB generates the real one).
    expect(saved.id).toBeNull();
  });

  it('normalizes empty optional strings to null', async () => {
    eventRepository.save.mockResolvedValue(undefined);
    eventRepository.find.mockResolvedValue({ id: 1 });

    await eventService.create({
      ...VALID_PAYLOAD,
      description: '   ',
      lieu: '',
      image_url: '',
    });

    const saved = eventRepository.save.mock.calls[0][0];
    expect(saved.description).toBeNull();
    expect(saved.lieu).toBeNull();
    expect(saved.image_url).toBeNull();
  });
});

describe('EventService.update', () => {
  it('throws NotFoundException when event is missing', async () => {
    eventRepository.find.mockResolvedValue(null);
    await expect(eventService.update(99, VALID_PAYLOAD)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('merges the validated payload onto the existing row', async () => {
    const existing = {
      id: 1,
      title: 'Old',
      description: 'old',
      date_event: new Date('2026-01-01'),
    };
    eventRepository.find.mockResolvedValueOnce(existing); // getOne
    eventRepository.save.mockResolvedValue(undefined);
    eventRepository.find.mockResolvedValueOnce({ id: 1, ...VALID_PAYLOAD }); // refetch

    await eventService.update(1, VALID_PAYLOAD);
    expect(eventRepository.save).toHaveBeenCalledTimes(1);
    const saved = eventRepository.save.mock.calls[0][0];
    expect(saved.id).toBe(1); // id preserved
    expect(saved.title).toBe(VALID_PAYLOAD.title);
  });
});

describe('EventService.remove', () => {
  it('throws NotFoundException when nothing was deleted', async () => {
    eventRepository.delete.mockResolvedValue(false);
    await expect(eventService.remove(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('resolves silently on successful delete', async () => {
    eventRepository.delete.mockResolvedValue(true);
    await expect(eventService.remove(1)).resolves.toBeUndefined();
  });
});

describe('EventService.listUpcoming', () => {
  it('forwards the limit to the repository', async () => {
    eventRepository.findUpcoming.mockResolvedValue([]);
    await eventService.listUpcoming({ limit: 5 });
    expect(eventRepository.findUpcoming).toHaveBeenCalledWith({ limit: 5 });
  });

  it('uses default limit when none provided', async () => {
    eventRepository.findUpcoming.mockResolvedValue([]);
    await eventService.listUpcoming();
    expect(eventRepository.findUpcoming).toHaveBeenCalledWith({ limit: 10 });
  });
});

describe('EventService.getOne', () => {
  it('throws NotFoundException when not found', async () => {
    eventRepository.find.mockResolvedValue(null);
    await expect(eventService.getOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the event when found', async () => {
    const ev = { id: 1, title: 'Soirée' };
    eventRepository.find.mockResolvedValue(ev);
    await expect(eventService.getOne(1)).resolves.toBe(ev);
  });
});

describe('EventService.create — new fields (Phase 18)', () => {
  it('accepts a valid capacite (positive integer)', async () => {
    eventRepository.save.mockResolvedValue(undefined);
    eventRepository.find.mockResolvedValue({ id: 1 });
    await eventService.create({ ...VALID_PAYLOAD, capacite: '30' });
    expect(eventRepository.save.mock.calls[0][0].capacite).toBe(30);
  });

  it('rejects capacite < 1', async () => {
    const err = await eventService.create({ ...VALID_PAYLOAD, capacite: 0 }).catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('capacite');
  });

  it('accepts cout as free text', async () => {
    eventRepository.save.mockResolvedValue(undefined);
    eventRepository.find.mockResolvedValue({ id: 1 });
    await eventService.create({ ...VALID_PAYLOAD, cout: 'Gratuit' });
    expect(eventRepository.save.mock.calls[0][0].cout).toBe('Gratuit');
  });

  it('accepts category_color in #rrggbb format', async () => {
    eventRepository.save.mockResolvedValue(undefined);
    eventRepository.find.mockResolvedValue({ id: 1 });
    await eventService.create({ ...VALID_PAYLOAD, category_color: '#ee961b' });
    expect(eventRepository.save.mock.calls[0][0].category_color).toBe('#ee961b');
  });

  it('accepts category_color in #rgb shorthand', async () => {
    eventRepository.save.mockResolvedValue(undefined);
    eventRepository.find.mockResolvedValue({ id: 1 });
    await eventService.create({ ...VALID_PAYLOAD, category_color: '#f0a' });
    expect(eventRepository.save.mock.calls[0][0].category_color).toBe('#f0a');
  });

  it('rejects a malformed category_color', async () => {
    const err = await eventService
      .create({ ...VALID_PAYLOAD, category_color: 'orange' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('category_color');
  });

  it('stores empty optional fields as null', async () => {
    eventRepository.save.mockResolvedValue(undefined);
    eventRepository.find.mockResolvedValue({ id: 1 });
    await eventService.create({
      ...VALID_PAYLOAD,
      cout: '',
      capacite: '',
      category_label: '',
      category_color: '',
    });
    const saved = eventRepository.save.mock.calls[0][0];
    expect(saved.cout).toBeNull();
    expect(saved.capacite).toBeNull();
    expect(saved.category_label).toBeNull();
    expect(saved.category_color).toBeNull();
  });
});
