// ============================================================
// RegistrationService.test.js — Tests unitaires de la logique du
// parcours de paiement.
//
// Les deux singletons de repository (registration, activity) sont
// remplacés par des vi.fn() pour que la suite tourne sans connexion
// MySQL. Les tests se concentrent sur les règles MÉTIER que le service
// applique :
//
//   - createPendingRegistration valide les champs du payload
//   - createPendingRegistration rejette les activités non-Jeunesse / non publiées
//   - markPaidByTransactionId est idempotent (re-livraison de webhook sûre)
//   - updateStatus rejette les valeurs d'enum inconnues
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../repository/RegistrationRepository.js', () => ({
  registrationRepository: {
    find: vi.fn(),
    findOneBy: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    findPaginatedWithActivity: vi.fn(),
    findByHelloAssoTransactionId: vi.fn(),
  },
}));

vi.mock('../../repository/ActivityRepository.js', () => ({
  activityRepository: {
    find: vi.fn(),
  },
}));

import { registrationService } from '../RegistrationService.js';
import { registrationRepository } from '../../repository/RegistrationRepository.js';
import { activityRepository } from '../../repository/ActivityRepository.js';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '../../error/HttpException.js';

// Note: amount_cents is intentionally absent from the payload — the
// service IGNORES the client value and reads activity.price_cents from
// the DB (see Phase 24 hardening). Tests verify that behaviour below.
const VALID_PAYLOAD = {
  prenom: 'Léa',
  nom: 'Dupont',
  email: 'lea@example.com',
  activity_id: 201,
};

const VALID_ACTIVITY = {
  id: 201,
  activity_type: 'jeunesse',
  is_published: 1,
  title: 'Atelier Rap',
  price_cents: 500, // €5 — server-authoritative
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createPendingRegistration — validation', () => {
  it('rejects short prenom with per-field details', async () => {
    const err = await registrationService
      .createPendingRegistration({ ...VALID_PAYLOAD, prenom: 'L' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('prenom');
  });

  it('rejects bad email', async () => {
    const err = await registrationService
      .createPendingRegistration({ ...VALID_PAYLOAD, email: 'not-an-email' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('email');
  });

  it('ignores client-supplied amount_cents (server uses activity.price_cents)', async () => {
    activityRepository.find.mockResolvedValue(VALID_ACTIVITY);
    registrationRepository.findOneBy.mockResolvedValue(null);
    registrationRepository.save.mockResolvedValue(undefined);

    // Client sends a forged €0.01 amount; the service should ignore it
    // entirely and save the row with the server's €5 price.
    const result = await registrationService.createPendingRegistration({
      ...VALID_PAYLOAD,
      amount_cents: 1,
    });
    expect(result.amount_cents).toBe(500);
  });

  it('collects multiple field errors in a single response', async () => {
    const err = await registrationService
      .createPendingRegistration({
        prenom: '',
        nom: '',
        email: 'bad',
        activity_id: 0,
      })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(Object.keys(err.details.fields).length).toBeGreaterThanOrEqual(4);
  });
});

describe('createPendingRegistration — activity rules', () => {
  it('throws NotFoundException when activity does not exist', async () => {
    activityRepository.find.mockResolvedValue(null);
    await expect(
      registrationService.createPendingRegistration(VALID_PAYLOAD),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException when activity is not Jeunesse', async () => {
    activityRepository.find.mockResolvedValue({ ...VALID_ACTIVITY, activity_type: 'famille' });
    await expect(
      registrationService.createPendingRegistration(VALID_PAYLOAD),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException when activity is unpublished', async () => {
    activityRepository.find.mockResolvedValue({ ...VALID_ACTIVITY, is_published: 0 });
    await expect(
      registrationService.createPendingRegistration(VALID_PAYLOAD),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('saves a pending registration when activity is valid', async () => {
    activityRepository.find.mockResolvedValue(VALID_ACTIVITY);
    registrationRepository.findOneBy.mockResolvedValue(null);
    registrationRepository.save.mockResolvedValue(undefined);

    const result = await registrationService.createPendingRegistration(VALID_PAYLOAD);

    expect(result.status).toBe('pending');
    expect(result.prenom).toBe('Léa');
    expect(result.email).toBe('lea@example.com');
    expect(result.activity_id).toBe(201);
    // amount_cents must come from activity.price_cents, not the client.
    expect(result.amount_cents).toBe(500);
    expect(registrationRepository.save).toHaveBeenCalledTimes(1);
    expect(registrationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending', amount_cents: 500 }),
    );
  });

  it('refuses checkout when activity.price_cents is null (admin did not configure)', async () => {
    activityRepository.find.mockResolvedValue({ ...VALID_ACTIVITY, price_cents: null });
    await expect(
      registrationService.createPendingRegistration(VALID_PAYLOAD),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reuses an existing pending registration on retry (dedupe)', async () => {
    activityRepository.find.mockResolvedValue(VALID_ACTIVITY);
    const existing = {
      id: 7,
      status: 'pending',
      email: 'lea@example.com',
      activity_id: 201,
      amount_cents: 500,
    };
    registrationRepository.findOneBy.mockResolvedValue(existing);

    const result = await registrationService.createPendingRegistration(VALID_PAYLOAD);
    expect(result).toBe(existing);
    expect(registrationRepository.save).not.toHaveBeenCalled();
  });
});

describe('markPaidByTransactionId — idempotency', () => {
  it('throws NotFoundException when no registration matches the transaction', async () => {
    registrationRepository.findByHelloAssoTransactionId.mockResolvedValue(null);
    await expect(
      registrationService.markPaidByTransactionId('mock-99', 500),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('flips pending → paid and saves once', async () => {
    const reg = { id: 1, status: 'pending', amount_cents: 0 };
    registrationRepository.findByHelloAssoTransactionId.mockResolvedValue(reg);
    registrationRepository.save.mockResolvedValue(undefined);

    const result = await registrationService.markPaidByTransactionId('mock-1', 500);

    expect(result.status).toBe('paid');
    expect(result.amount_cents).toBe(500); // webhook overrides intent
    expect(registrationRepository.save).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when the registration is already paid (webhook redelivery)', async () => {
    const reg = { id: 1, status: 'paid', amount_cents: 500 };
    registrationRepository.findByHelloAssoTransactionId.mockResolvedValue(reg);

    const result = await registrationService.markPaidByTransactionId('mock-1', 500);

    expect(result).toBe(reg);
    expect(registrationRepository.save).not.toHaveBeenCalled();
  });

  it('ignores a zero / non-positive paid amount', async () => {
    const reg = { id: 1, status: 'pending', amount_cents: 100 };
    registrationRepository.findByHelloAssoTransactionId.mockResolvedValue(reg);
    registrationRepository.save.mockResolvedValue(undefined);

    await registrationService.markPaidByTransactionId('mock-1', 0);

    expect(reg.amount_cents).toBe(100); // kept the original
  });
});

describe('updateStatus', () => {
  it('rejects an unknown status value', async () => {
    await expect(registrationService.updateStatus(1, 'mystery')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('updates and saves when status is valid', async () => {
    const reg = { id: 1, status: 'pending' };
    registrationRepository.find.mockResolvedValue(reg);
    registrationRepository.save.mockResolvedValue(undefined);

    const result = await registrationService.updateStatus(1, 'refunded');
    expect(result.status).toBe('refunded');
    expect(registrationRepository.save).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when the new status equals the current one', async () => {
    const reg = { id: 1, status: 'paid' };
    registrationRepository.find.mockResolvedValue(reg);

    await registrationService.updateStatus(1, 'paid');
    expect(registrationRepository.save).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when registration is missing', async () => {
    registrationRepository.find.mockResolvedValue(null);
    await expect(registrationService.updateStatus(99, 'paid')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('remove', () => {
  it('throws NotFoundException when nothing was deleted', async () => {
    registrationRepository.delete.mockResolvedValue(false);
    await expect(registrationService.remove(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('resolves silently when delete succeeded', async () => {
    registrationRepository.delete.mockResolvedValue(true);
    await expect(registrationService.remove(1)).resolves.toBeUndefined();
  });
});
