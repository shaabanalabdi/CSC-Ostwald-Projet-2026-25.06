// ============================================================
// PartnerService.test.js — Tests unitaires du module partenaires.
//
// Repository mocké au niveau du singleton. Couvre :
//   - la validation de longueur du nom
//   - logo_url obligatoire + doit être http(s) (pas de javascript: / data:)
//   - website_url optionnelle + même garde d'URL quand fournie
//   - l'enum category — une mauvaise valeur lève 400 (BadRequest), pas 422
//   - la coercition / le défaut / les négatifs OK de display_order
//   - le câblage CRUD (NotFound, save appelé une fois)
//   - listAllOrdered délègue au repo
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../repository/PartnerRepository.js', () => ({
  partnerRepository: {
    find: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    findPaginated: vi.fn(),
    findAllOrdered: vi.fn(),
  },
}));

import { partnerService } from '../PartnerService.js';
import { partnerRepository } from '../../repository/PartnerRepository.js';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '../../error/HttpException.js';

const VALID_PAYLOAD = {
  name: "Ville d'Ostwald",
  logo_url: 'https://example.com/logo.png',
  website_url: 'https://ostwald.fr',
  category: 'institutionnel',
  display_order: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PartnerService.create — validation', () => {
  it('rejects a missing name', async () => {
    const err = await partnerService.create({ ...VALID_PAYLOAD, name: '' }).catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('name');
  });

  it('rejects a missing logo_url', async () => {
    const err = await partnerService.create({ ...VALID_PAYLOAD, logo_url: '' }).catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('logo_url');
  });

  it('rejects a non-http logo_url (javascript:)', async () => {
    const err = await partnerService
      .create({ ...VALID_PAYLOAD, logo_url: 'javascript:alert(1)' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('logo_url');
  });

  it('rejects a non-http logo_url (data: URI)', async () => {
    const err = await partnerService
      .create({ ...VALID_PAYLOAD, logo_url: 'data:image/svg+xml;base64,...' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('logo_url');
  });

  it('accepts http://', async () => {
    partnerRepository.save.mockResolvedValue(undefined);
    partnerRepository.find.mockResolvedValue({ id: 1 });
    await partnerService.create({ ...VALID_PAYLOAD, logo_url: 'http://example.com/x.png' });
    expect(partnerRepository.save).toHaveBeenCalled();
  });

  it('accepts an empty website_url and stores null', async () => {
    partnerRepository.save.mockResolvedValue(undefined);
    partnerRepository.find.mockResolvedValue({ id: 1 });
    await partnerService.create({ ...VALID_PAYLOAD, website_url: '' });
    expect(partnerRepository.save.mock.calls[0][0].website_url).toBeNull();
  });

  it('rejects a malformed website_url when provided', async () => {
    const err = await partnerService
      .create({ ...VALID_PAYLOAD, website_url: 'not a url' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('website_url');
  });

  it('throws BadRequestException (400) on a bad category enum', async () => {
    const err = await partnerService
      .create({ ...VALID_PAYLOAD, category: 'mystery' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.status).toBe(400);
  });

  it('defaults display_order to 0 when omitted', async () => {
    partnerRepository.save.mockResolvedValue(undefined);
    partnerRepository.find.mockResolvedValue({ id: 1 });
    const { display_order: _omit, ...rest } = VALID_PAYLOAD;
    void _omit;
    await partnerService.create(rest);
    expect(partnerRepository.save.mock.calls[0][0].display_order).toBe(0);
  });

  it('accepts a negative display_order (pin-to-top sentinel)', async () => {
    partnerRepository.save.mockResolvedValue(undefined);
    partnerRepository.find.mockResolvedValue({ id: 1 });
    await partnerService.create({ ...VALID_PAYLOAD, display_order: -10 });
    expect(partnerRepository.save.mock.calls[0][0].display_order).toBe(-10);
  });

  it('drops unknown fields from the payload', async () => {
    partnerRepository.save.mockResolvedValue(undefined);
    partnerRepository.find.mockResolvedValue({ id: 1 });
    await partnerService.create({ ...VALID_PAYLOAD, evil: '<script>', id: 9999 });
    const saved = partnerRepository.save.mock.calls[0][0];
    expect(saved).not.toHaveProperty('evil');
    expect(saved.id).toBeNull();
  });
});

describe('PartnerService.update', () => {
  it('throws NotFoundException when partner does not exist', async () => {
    partnerRepository.find.mockResolvedValue(null);
    await expect(partnerService.update(99, VALID_PAYLOAD)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('merges validated payload onto existing row', async () => {
    const existing = { id: 1, name: 'Old', category: 'associatif' };
    partnerRepository.find.mockResolvedValueOnce(existing);
    partnerRepository.save.mockResolvedValue(undefined);
    partnerRepository.find.mockResolvedValueOnce({ id: 1, ...VALID_PAYLOAD });

    await partnerService.update(1, VALID_PAYLOAD);
    const saved = partnerRepository.save.mock.calls[0][0];
    expect(saved.id).toBe(1);
    expect(saved.name).toBe(VALID_PAYLOAD.name);
    expect(saved.category).toBe('institutionnel');
  });
});

describe('PartnerService.remove', () => {
  it('throws NotFoundException when nothing was deleted', async () => {
    partnerRepository.delete.mockResolvedValue(false);
    await expect(partnerService.remove(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('resolves silently on successful delete', async () => {
    partnerRepository.delete.mockResolvedValue(true);
    await expect(partnerService.remove(1)).resolves.toBeUndefined();
  });
});

describe('PartnerService.listAllOrdered', () => {
  it('forwards directly to the repository', async () => {
    partnerRepository.findAllOrdered.mockResolvedValue([]);
    await partnerService.listAllOrdered();
    expect(partnerRepository.findAllOrdered).toHaveBeenCalledTimes(1);
  });
});
