// ============================================================
// NewsletterService.test.js — Tests unitaires de l'inscription à la
// newsletter.
//
// Repository mocké. Couvre :
//   - subscribe() rejette un e-mail malformé (400)
//   - subscribe() rejette un doublon (409)
//   - subscribe() génère un confirmation_token hex (double opt-in)
//   - subscribe() met l'e-mail en minuscules + le rogne
//   - remove() lève NotFoundException quand rien n'est supprimé
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../repository/NewsletterRepository.js', () => ({
  newsletterRepository: {
    find: vi.fn(),
    findOneBy: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    findPaginated: vi.fn(),
  },
}));

import { newsletterService } from '../NewsletterService.js';
import { newsletterRepository } from '../../repository/NewsletterRepository.js';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '../../error/HttpException.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('NewsletterService.subscribe', () => {
  it('throws BadRequestException (400) on a malformed email', async () => {
    const err = await newsletterService.subscribe({ email: 'not-an-email' }).catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.status).toBe(400);
  });

  it('throws BadRequestException when email is missing', async () => {
    await expect(newsletterService.subscribe({})).rejects.toBeInstanceOf(BadRequestException);
    await expect(newsletterService.subscribe({ email: '' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(newsletterService.subscribe({ email: null })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws ConflictException (409) when the email is already subscribed', async () => {
    newsletterRepository.findOneBy.mockResolvedValue({ id: 1, email: 'lea@example.com' });
    const err = await newsletterService.subscribe({ email: 'lea@example.com' }).catch((e) => e);
    expect(err).toBeInstanceOf(ConflictException);
    expect(err.status).toBe(409);
  });

  it('saves a new subscriber with is_confirmed=0 and a hex token', async () => {
    newsletterRepository.findOneBy.mockResolvedValue(null);
    newsletterRepository.save.mockImplementation((row) => {
      row.id = 7;
      return Promise.resolve();
    });
    newsletterRepository.find.mockResolvedValue({
      id: 7,
      email: 'lea@example.com',
      subscribed_at: new Date('2026-05-19T12:00:00Z'),
    });

    const result = await newsletterService.subscribe({ email: 'lea@example.com' });
    expect(result.id).toBe(7);
    expect(result.email).toBe('lea@example.com');
    expect(result.subscribed_at).toBeInstanceOf(Date);

    const saved = newsletterRepository.save.mock.calls[0][0];
    expect(saved.is_confirmed).toBe(0);
    // randomBytes(32).toString('hex') → 64 hex chars
    expect(saved.confirmation_token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('lowercases + trims the email before lookup and save', async () => {
    newsletterRepository.findOneBy.mockResolvedValue(null);
    newsletterRepository.save.mockImplementation((row) => {
      row.id = 8;
      return Promise.resolve();
    });
    newsletterRepository.find.mockResolvedValue({
      id: 8,
      email: 'lea@example.com',
      subscribed_at: new Date(),
    });

    await newsletterService.subscribe({ email: '  Lea@Example.COM  ' });

    expect(newsletterRepository.findOneBy).toHaveBeenCalledWith({ email: 'lea@example.com' });
    expect(newsletterRepository.save.mock.calls[0][0].email).toBe('lea@example.com');
  });
});

describe('NewsletterService.remove', () => {
  it('throws NotFoundException when nothing was deleted', async () => {
    newsletterRepository.delete.mockResolvedValue(false);
    await expect(newsletterService.remove(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('resolves silently on successful delete', async () => {
    newsletterRepository.delete.mockResolvedValue(true);
    await expect(newsletterService.remove(1)).resolves.toBeUndefined();
  });
});

describe('NewsletterService.listPaginated', () => {
  it('defaults page=1 / perPage=20 and forwards to the repository', async () => {
    newsletterRepository.findPaginated.mockResolvedValue({ items: [], total: 0 });
    await newsletterService.listPaginated();
    expect(newsletterRepository.findPaginated).toHaveBeenCalledWith({ page: 1, perPage: 20 });
  });

  it('clamps invalid input to safe bounds', async () => {
    newsletterRepository.findPaginated.mockResolvedValue({ items: [], total: 0 });
    await newsletterService.listPaginated({ page: -3, perPage: 9999 });
    expect(newsletterRepository.findPaginated).toHaveBeenCalledWith({ page: 1, perPage: 100 });
  });
});
