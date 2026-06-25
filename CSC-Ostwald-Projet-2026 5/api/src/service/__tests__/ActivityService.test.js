// ============================================================
// ActivityService.test.js — Tests unitaires du service activité.
//
// Concentrés sur les ajouts de la Phase 19 (validation de frequence /
// categorie_label / tag + listPublishedByType) plus la garde de l'enum
// activity_type. Le chemin CRUD create/update plus large est exercé
// dans les tests d'intégration admin ; ici on garde la suite resserrée
// autour de ce qui est nouveau ou contractuellement important.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../repository/ActivityRepository.js', () => ({
  activityRepository: {
    find: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    findPaginated: vi.fn(),
    findPaginatedByType: vi.fn(),
    findPublishedByType: vi.fn(),
  },
}));

import { activityService } from '../ActivityService.js';
import { activityRepository } from '../../repository/ActivityRepository.js';
import { BadRequestException, UnprocessableEntityException } from '../../error/HttpException.js';

const VALID_PAYLOAD = {
  title: 'Escapades en famille',
  description: 'Un jour par semaine, on quitte le quartier pour explorer.',
  activity_type: 'famille',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ActivityService.listPublishedByType', () => {
  it('forwards a valid type to the repository', async () => {
    activityRepository.findPublishedByType.mockResolvedValue([]);
    await activityService.listPublishedByType('jeunesse');
    expect(activityRepository.findPublishedByType).toHaveBeenCalledWith('jeunesse');
  });

  it('rejects an unknown type with BadRequestException (400)', async () => {
    const err = await activityService.listPublishedByType('mystery').catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.status).toBe(400);
  });

  it('rejects undefined / null type', async () => {
    await expect(activityService.listPublishedByType(undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(activityService.listPublishedByType(null)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('ActivityService.create — Phase 19 fields', () => {
  it('accepts HEBDO / MENSUEL frequence', async () => {
    activityRepository.save.mockResolvedValue(undefined);
    activityRepository.find.mockResolvedValue({ id: 1 });
    await activityService.create({ ...VALID_PAYLOAD, frequence: 'HEBDO' });
    expect(activityRepository.save.mock.calls[0][0].frequence).toBe('HEBDO');
  });

  it('uppercases the frequence input', async () => {
    activityRepository.save.mockResolvedValue(undefined);
    activityRepository.find.mockResolvedValue({ id: 1 });
    await activityService.create({ ...VALID_PAYLOAD, frequence: 'hebdo' });
    expect(activityRepository.save.mock.calls[0][0].frequence).toBe('HEBDO');
  });

  it('rejects an unknown frequence value', async () => {
    const err = await activityService
      .create({ ...VALID_PAYLOAD, frequence: 'YEARLY' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('frequence');
  });

  it('stores empty frequence / categorie_label / tag as null', async () => {
    activityRepository.save.mockResolvedValue(undefined);
    activityRepository.find.mockResolvedValue({ id: 1 });
    await activityService.create({
      ...VALID_PAYLOAD,
      frequence: '',
      categorie_label: '',
      tag: '',
    });
    const saved = activityRepository.save.mock.calls[0][0];
    expect(saved.frequence).toBeNull();
    expect(saved.categorie_label).toBeNull();
    expect(saved.tag).toBeNull();
  });

  it('caps tag at 30 chars', async () => {
    const err = await activityService
      .create({ ...VALID_PAYLOAD, tag: 'x'.repeat(31) })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('tag');
  });
});

describe('ActivityService.listPaginated — type filter pushed to SQL', () => {
  it('forwards a valid type to findPaginatedByType', async () => {
    activityRepository.findPaginatedByType.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    });
    await activityService.listPaginated({ type: 'jeunesse' });
    expect(activityRepository.findPaginatedByType).toHaveBeenCalledWith({
      page: 1,
      perPage: 20,
      type: 'jeunesse',
    });
  });

  it('passes type=null when the filter is missing', async () => {
    activityRepository.findPaginatedByType.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    });
    await activityService.listPaginated({});
    expect(activityRepository.findPaginatedByType).toHaveBeenCalledWith({
      page: 1,
      perPage: 20,
      type: null,
    });
  });

  // Un type hostile est ramené à null au lieu d'être poussé vers le SQL.
  it('clamps a hostile type to null instead of pushing it down', async () => {
    activityRepository.findPaginatedByType.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    });
    await activityService.listPaginated({ type: "'; DROP TABLE activity --" });
    expect(activityRepository.findPaginatedByType).toHaveBeenCalledWith({
      page: 1,
      perPage: 20,
      type: null,
    });
  });
});
