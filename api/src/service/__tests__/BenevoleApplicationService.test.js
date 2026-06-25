// ============================================================
// BenevoleApplicationService.test.js — Tests unitaires du formulaire
// bénévole.
//
// Repository mocké au niveau du singleton. Couvre :
//   - la validation des champs de apply() (UnprocessableEntityException 422)
//   - le téléphone optionnel de apply() + la garde de format quand présent
//   - les champs tableau JSON de apply() (domaines / competences / jours /
//     plages) acceptent les tableaux vides et rejettent les valeurs qui ne
//     sont pas des tableaux de chaînes
//   - le workflow admin : garde d'enum + idempotence de updateStatus,
//     remove, getOne NotFound
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../repository/BenevoleApplicationRepository.js', () => ({
  benevoleApplicationRepository: {
    find: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    findPaginated: vi.fn(),
  },
}));

import { benevoleApplicationService } from '../BenevoleApplicationService.js';
import { benevoleApplicationRepository } from '../../repository/BenevoleApplicationRepository.js';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '../../error/HttpException.js';

const VALID_PAYLOAD = {
  prenom: 'Léa',
  nom: 'Dupont',
  email: 'lea@example.com',
  telephone: '06.12.34.56.78',
  domaines: ['accueil', 'animation'],
  competences: ['français'],
  jours: ['lundi'],
  plages: ['matin'],
  message: 'Je souhaite aider quelques heures par semaine.',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('BenevoleApplicationService.apply — validation', () => {
  it('rejects a short prenom', async () => {
    const err = await benevoleApplicationService
      .apply({ ...VALID_PAYLOAD, prenom: 'L' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('prenom');
  });

  it('rejects a malformed email', async () => {
    const err = await benevoleApplicationService
      .apply({ ...VALID_PAYLOAD, email: 'oops' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('email');
  });

  it('collects multiple field errors at once', async () => {
    const err = await benevoleApplicationService
      .apply({
        nom: '',
        prenom: '',
        email: 'bad',
        telephone: 'bad-phone',
        domaines: [],
        competences: [],
        jours: [],
        plages: [],
      })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(Object.keys(err.details.fields).length).toBeGreaterThanOrEqual(4);
  });
});

describe('BenevoleApplicationService.apply — telephone (optional)', () => {
  it('accepts an empty telephone and stores null', async () => {
    benevoleApplicationRepository.save.mockResolvedValue(undefined);
    await benevoleApplicationService.apply({ ...VALID_PAYLOAD, telephone: '' });
    expect(benevoleApplicationRepository.save.mock.calls[0][0].telephone).toBeNull();
  });

  it('accepts a missing telephone field', async () => {
    benevoleApplicationRepository.save.mockResolvedValue(undefined);
    const { telephone: _omit, ...withoutPhone } = VALID_PAYLOAD;
    void _omit;
    await benevoleApplicationService.apply(withoutPhone);
    expect(benevoleApplicationRepository.save.mock.calls[0][0].telephone).toBeNull();
  });

  it('rejects a malformed telephone', async () => {
    const err = await benevoleApplicationService
      .apply({ ...VALID_PAYLOAD, telephone: 'not-a-number' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('telephone');
  });
});

describe('BenevoleApplicationService.apply — array fields', () => {
  it('accepts empty arrays', async () => {
    benevoleApplicationRepository.save.mockResolvedValue(undefined);
    await benevoleApplicationService.apply({
      ...VALID_PAYLOAD,
      domaines: [],
      competences: [],
      jours: [],
      plages: [],
    });
    const saved = benevoleApplicationRepository.save.mock.calls[0][0];
    expect(saved.domaines).toEqual([]);
    expect(saved.competences).toEqual([]);
  });

  it('defaults missing array fields to []', async () => {
    benevoleApplicationRepository.save.mockResolvedValue(undefined);
    await benevoleApplicationService.apply({
      prenom: 'Léa',
      nom: 'Dupont',
      email: 'lea@example.com',
    });
    const saved = benevoleApplicationRepository.save.mock.calls[0][0];
    expect(saved.domaines).toEqual([]);
    expect(saved.competences).toEqual([]);
    expect(saved.jours).toEqual([]);
    expect(saved.plages).toEqual([]);
  });

  it('rejects an array containing non-string values', async () => {
    const err = await benevoleApplicationService
      .apply({ ...VALID_PAYLOAD, domaines: ['accueil', 42] })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('domaines');
  });
});

describe('BenevoleApplicationService.apply — message (optional)', () => {
  it('stores an empty message as null', async () => {
    benevoleApplicationRepository.save.mockResolvedValue(undefined);
    await benevoleApplicationService.apply({ ...VALID_PAYLOAD, message: '' });
    expect(benevoleApplicationRepository.save.mock.calls[0][0].message).toBeNull();
  });

  it('rejects a message longer than 1000 chars', async () => {
    const err = await benevoleApplicationService
      .apply({ ...VALID_PAYLOAD, message: 'x'.repeat(1001) })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('message');
  });
});

describe('BenevoleApplicationService.apply — success path', () => {
  it('saves with status=new and returns the id', async () => {
    benevoleApplicationRepository.save.mockImplementation((row) => {
      row.id = 42;
      return Promise.resolve();
    });
    const result = await benevoleApplicationService.apply(VALID_PAYLOAD);
    expect(result).toEqual({ id: 42 });
    expect(benevoleApplicationRepository.save.mock.calls[0][0].status).toBe('new');
  });

  it('lowercases the email before saving', async () => {
    benevoleApplicationRepository.save.mockResolvedValue(undefined);
    await benevoleApplicationService.apply({ ...VALID_PAYLOAD, email: '  Lea@Example.COM  ' });
    expect(benevoleApplicationRepository.save.mock.calls[0][0].email).toBe('lea@example.com');
  });
});

describe('BenevoleApplicationService.updateStatus', () => {
  it('rejects an unknown status with BadRequestException (400)', async () => {
    const err = await benevoleApplicationService.updateStatus(1, 'mystery').catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.status).toBe(400);
  });

  it('flips the status and saves once', async () => {
    const app = { id: 1, status: 'new' };
    benevoleApplicationRepository.find.mockResolvedValue(app);
    benevoleApplicationRepository.save.mockResolvedValue(undefined);
    const result = await benevoleApplicationService.updateStatus(1, 'contacted');
    expect(result.status).toBe('contacted');
    expect(benevoleApplicationRepository.save).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when the status is already the requested value', async () => {
    const app = { id: 1, status: 'rejected' };
    benevoleApplicationRepository.find.mockResolvedValue(app);
    const result = await benevoleApplicationService.updateStatus(1, 'rejected');
    expect(result).toBe(app);
    expect(benevoleApplicationRepository.save).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when id is missing', async () => {
    benevoleApplicationRepository.find.mockResolvedValue(null);
    await expect(benevoleApplicationService.updateStatus(99, 'contacted')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('BenevoleApplicationService.remove', () => {
  it('throws NotFoundException when nothing was deleted', async () => {
    benevoleApplicationRepository.delete.mockResolvedValue(false);
    await expect(benevoleApplicationService.remove(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('resolves silently on successful delete', async () => {
    benevoleApplicationRepository.delete.mockResolvedValue(true);
    await expect(benevoleApplicationService.remove(1)).resolves.toBeUndefined();
  });
});

describe('BenevoleApplicationService.getOne', () => {
  it('throws NotFoundException when id is missing', async () => {
    benevoleApplicationRepository.find.mockResolvedValue(null);
    await expect(benevoleApplicationService.getOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the row when found', async () => {
    const app = { id: 1, prenom: 'Léa' };
    benevoleApplicationRepository.find.mockResolvedValue(app);
    await expect(benevoleApplicationService.getOne(1)).resolves.toBe(app);
  });
});
