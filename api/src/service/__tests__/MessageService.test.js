// ============================================================
// MessageService.test.js — Tests unitaires du service du formulaire de
// contact.
//
// Repository mocké au niveau du singleton. Couvre :
//   - la validation de submit() (422 par champ, 400 mauvais enum)
//   - le téléphone optionnel + la garde de format
//   - le câblage du CRUD admin (list / getOne / idempotence de markAsRead / remove)
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../repository/MessageRepository.js', () => ({
  messageRepository: {
    find: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    findPaginated: vi.fn(),
  },
}));

import { messageService } from '../MessageService.js';
import { messageRepository } from '../../repository/MessageRepository.js';
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
  sujet: 'renseignement',
  message: 'Bonjour, je souhaite plus d’informations sur vos ateliers.',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MessageService.submit — validation', () => {
  it('rejects a short prenom with a per-field error', async () => {
    const err = await messageService.submit({ ...VALID_PAYLOAD, prenom: 'L' }).catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('prenom');
  });

  it('rejects an invalid email', async () => {
    const err = await messageService
      .submit({ ...VALID_PAYLOAD, email: 'not-an-email' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('email');
  });

  it('rejects a too-short message', async () => {
    const err = await messageService.submit({ ...VALID_PAYLOAD, message: 'court' }).catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('message');
  });

  it('throws BadRequestException (400) on a bad sujet enum', async () => {
    const err = await messageService.submit({ ...VALID_PAYLOAD, sujet: 'spam' }).catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.status).toBe(400);
  });

  it('collects multiple field errors at once', async () => {
    const err = await messageService
      .submit({
        prenom: '',
        nom: '',
        email: 'bad',
        telephone: '',
        sujet: 'renseignement',
        message: 'x',
      })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(Object.keys(err.details.fields).length).toBeGreaterThanOrEqual(3);
  });
});

describe('MessageService.submit — telephone (optional)', () => {
  it('accepts an empty telephone and stores null', async () => {
    messageRepository.save.mockResolvedValue(undefined);
    await messageService.submit({ ...VALID_PAYLOAD, telephone: '' });
    expect(messageRepository.save.mock.calls[0][0].telephone).toBeNull();
  });

  it('accepts a missing telephone field', async () => {
    messageRepository.save.mockResolvedValue(undefined);
    const { telephone: _omit, ...withoutPhone } = VALID_PAYLOAD;
    void _omit;
    await messageService.submit(withoutPhone);
    expect(messageRepository.save.mock.calls[0][0].telephone).toBeNull();
  });

  it('rejects a malformed telephone', async () => {
    const err = await messageService
      .submit({ ...VALID_PAYLOAD, telephone: 'pas-un-numero' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('telephone');
  });
});

describe('MessageService.submit — success path', () => {
  it('persists the row with is_read=0 and returns the id', async () => {
    messageRepository.save.mockImplementation((row) => {
      row.id = 42;
      return Promise.resolve();
    });
    const result = await messageService.submit(VALID_PAYLOAD);
    expect(result).toEqual({ id: 42 });
    const saved = messageRepository.save.mock.calls[0][0];
    expect(saved.is_read).toBe(0);
    expect(saved.email).toBe('lea@example.com');
  });

  it('lowercases the email before saving', async () => {
    messageRepository.save.mockResolvedValue(undefined);
    await messageService.submit({ ...VALID_PAYLOAD, email: '  Lea@Example.COM  ' });
    expect(messageRepository.save.mock.calls[0][0].email).toBe('lea@example.com');
  });
});

describe('MessageService.markAsRead — idempotency', () => {
  it('throws NotFoundException when id is missing', async () => {
    messageRepository.find.mockResolvedValue(null);
    await expect(messageService.markAsRead(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('flips is_read 0 → 1 and saves once', async () => {
    const msg = { id: 1, is_read: 0 };
    messageRepository.find.mockResolvedValue(msg);
    messageRepository.save.mockResolvedValue(undefined);
    const result = await messageService.markAsRead(1);
    expect(result.is_read).toBe(1);
    expect(messageRepository.save).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when the message is already read', async () => {
    const msg = { id: 1, is_read: 1 };
    messageRepository.find.mockResolvedValue(msg);
    const result = await messageService.markAsRead(1);
    expect(result).toBe(msg);
    expect(messageRepository.save).not.toHaveBeenCalled();
  });
});

describe('MessageService.remove', () => {
  it('throws NotFoundException when nothing was deleted', async () => {
    messageRepository.delete.mockResolvedValue(false);
    await expect(messageService.remove(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('resolves silently on successful delete', async () => {
    messageRepository.delete.mockResolvedValue(true);
    await expect(messageService.remove(1)).resolves.toBeUndefined();
  });
});

describe('MessageService.listPaginated', () => {
  it('clamps perPage to [1, 100]', async () => {
    messageRepository.findPaginated.mockResolvedValue({ items: [], total: 0 });
    await messageService.listPaginated({ page: 1, perPage: 9999 });
    expect(messageRepository.findPaginated).toHaveBeenCalledWith({ page: 1, perPage: 100 });

    vi.clearAllMocks();
    messageRepository.findPaginated.mockResolvedValue({ items: [], total: 0 });
    await messageService.listPaginated({ page: 1, perPage: -5 });
    expect(messageRepository.findPaginated).toHaveBeenCalledWith({ page: 1, perPage: 1 });
  });

  it('defaults to page 1 / perPage 20', async () => {
    messageRepository.findPaginated.mockResolvedValue({ items: [], total: 0 });
    await messageService.listPaginated();
    expect(messageRepository.findPaginated).toHaveBeenCalledWith({ page: 1, perPage: 20 });
  });
});
