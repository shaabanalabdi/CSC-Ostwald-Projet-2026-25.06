// ============================================================
// HeroSlideService.test.js — Tests unitaires du module Hero.
//
// Repository mocké au niveau du singleton. Couvre :
//   - la validation de longueur du titre et du sous-titre
//   - la coercition / le défaut de is_published
//   - display_order : posé à 0 à la création, JAMAIS touché à l'update
//   - le câblage CRUD (NotFound, save appelé une fois)
//   - listPublished / listAll / reorder délèguent au repo
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../repository/HeroSlideRepository.js', () => ({
  heroSlideRepository: {
    find: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    findPublishedOrdered: vi.fn(),
    findAllOrdered: vi.fn(),
    bulkReorder: vi.fn(),
  },
}));

import { heroSlideService } from '../HeroSlideService.js';
import { heroSlideRepository } from '../../repository/HeroSlideRepository.js';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '../../error/HttpException.js';

const VALID_PAYLOAD = {
  title: 'Centre Social et Culturel d’Ostwald',
  subtitle: 'Un lieu ouvert à tout.e.s les habitant.e.s',
  is_published: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('HeroSlideService.create — validation', () => {
  it('rejects a too-short title', async () => {
    const err = await heroSlideService.create({ ...VALID_PAYLOAD, title: 'x' }).catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('title');
  });

  it('rejects a missing subtitle', async () => {
    const err = await heroSlideService.create({ ...VALID_PAYLOAD, subtitle: '' }).catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('subtitle');
  });

  it('accepts a valid payload and calls save', async () => {
    heroSlideRepository.save.mockResolvedValue(undefined);
    heroSlideRepository.find.mockResolvedValue({ id: 1 });
    await heroSlideService.create(VALID_PAYLOAD);
    expect(heroSlideRepository.save).toHaveBeenCalledTimes(1);
  });

  it('pins a new slide to display_order 0', async () => {
    heroSlideRepository.save.mockResolvedValue(undefined);
    heroSlideRepository.find.mockResolvedValue({ id: 1 });
    await heroSlideService.create(VALID_PAYLOAD);
    expect(heroSlideRepository.save.mock.calls[0][0].display_order).toBe(0);
  });

  it('defaults is_published to 1 when omitted', async () => {
    heroSlideRepository.save.mockResolvedValue(undefined);
    heroSlideRepository.find.mockResolvedValue({ id: 1 });
    const { is_published: _omit, ...rest } = VALID_PAYLOAD;
    void _omit;
    await heroSlideService.create(rest);
    expect(heroSlideRepository.save.mock.calls[0][0].is_published).toBe(1);
  });

  it('coerces is_published=false to 0', async () => {
    heroSlideRepository.save.mockResolvedValue(undefined);
    heroSlideRepository.find.mockResolvedValue({ id: 1 });
    await heroSlideService.create({ ...VALID_PAYLOAD, is_published: false });
    expect(heroSlideRepository.save.mock.calls[0][0].is_published).toBe(0);
  });

  it('drops unknown fields from the payload', async () => {
    heroSlideRepository.save.mockResolvedValue(undefined);
    heroSlideRepository.find.mockResolvedValue({ id: 1 });
    await heroSlideService.create({ ...VALID_PAYLOAD, evil: '<script>', id: 9999 });
    const saved = heroSlideRepository.save.mock.calls[0][0];
    expect(saved).not.toHaveProperty('evil');
    expect(saved.id).toBeNull();
  });
});

describe('HeroSlideService — média (image / vidéo)', () => {
  it('defaults media_type to "none" when omitted', async () => {
    heroSlideRepository.save.mockResolvedValue(undefined);
    heroSlideRepository.find.mockResolvedValue({ id: 1 });
    await heroSlideService.create(VALID_PAYLOAD);
    const saved = heroSlideRepository.save.mock.calls[0][0];
    expect(saved.media_type).toBe('none');
    expect(saved.media_url).toBeNull();
  });

  it('throws BadRequestException (400) on an invalid media_type', async () => {
    const err = await heroSlideService
      .create({ ...VALID_PAYLOAD, media_type: 'gif' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.status).toBe(400);
  });

  it('rejects media_type "image" without a media_url', async () => {
    const err = await heroSlideService
      .create({ ...VALID_PAYLOAD, media_type: 'image' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('media_url');
  });

  it('rejects a media_url containing ".." (path-traversal)', async () => {
    const err = await heroSlideService
      .create({ ...VALID_PAYLOAD, media_type: 'image', media_url: '/uploads/../secret' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('media_url');
  });

  it('accepts an uploaded image path', async () => {
    heroSlideRepository.save.mockResolvedValue(undefined);
    heroSlideRepository.find.mockResolvedValue({ id: 1 });
    await heroSlideService.create({
      ...VALID_PAYLOAD,
      media_type: 'image',
      media_url: '/uploads/abc123.webp',
    });
    const saved = heroSlideRepository.save.mock.calls[0][0];
    expect(saved.media_type).toBe('image');
    expect(saved.media_url).toBe('/uploads/abc123.webp');
  });

  it('accepts an uploaded video path', async () => {
    heroSlideRepository.save.mockResolvedValue(undefined);
    heroSlideRepository.find.mockResolvedValue({ id: 1 });
    await heroSlideService.create({
      ...VALID_PAYLOAD,
      media_type: 'video',
      media_url: '/uploads/clip.mp4',
    });
    expect(heroSlideRepository.save.mock.calls[0][0].media_type).toBe('video');
  });

  it('nulls the media_url when media_type is "none" even if a URL is sent', async () => {
    heroSlideRepository.save.mockResolvedValue(undefined);
    heroSlideRepository.find.mockResolvedValue({ id: 1 });
    await heroSlideService.create({
      ...VALID_PAYLOAD,
      media_type: 'none',
      media_url: '/uploads/orphan.webp',
    });
    expect(heroSlideRepository.save.mock.calls[0][0].media_url).toBeNull();
  });
});

describe('HeroSlideService.update', () => {
  it('throws NotFoundException when the slide does not exist', async () => {
    heroSlideRepository.find.mockResolvedValue(null);
    await expect(heroSlideService.update(99, VALID_PAYLOAD)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('merges the validated payload without touching display_order', async () => {
    const existing = { id: 1, title: 'Old', subtitle: 'Old sub', display_order: 7 };
    heroSlideRepository.find.mockResolvedValueOnce(existing);
    heroSlideRepository.save.mockResolvedValue(undefined);
    heroSlideRepository.find.mockResolvedValueOnce({ id: 1, ...VALID_PAYLOAD });

    await heroSlideService.update(1, VALID_PAYLOAD);
    const saved = heroSlideRepository.save.mock.calls[0][0];
    expect(saved.id).toBe(1);
    expect(saved.title).toBe(VALID_PAYLOAD.title);
    // La position dans le carrousel est préservée à l'identique.
    expect(saved.display_order).toBe(7);
  });
});

describe('HeroSlideService.remove', () => {
  it('throws NotFoundException when nothing was deleted', async () => {
    heroSlideRepository.delete.mockResolvedValue(false);
    await expect(heroSlideService.remove(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('resolves silently on successful delete', async () => {
    heroSlideRepository.delete.mockResolvedValue(true);
    await expect(heroSlideService.remove(1)).resolves.toBeUndefined();
  });
});

describe('HeroSlideService — lectures et réordonnancement', () => {
  it('listPublished forwards to the repository', async () => {
    heroSlideRepository.findPublishedOrdered.mockResolvedValue([]);
    await heroSlideService.listPublished();
    expect(heroSlideRepository.findPublishedOrdered).toHaveBeenCalledTimes(1);
  });

  it('listAll forwards to the repository', async () => {
    heroSlideRepository.findAllOrdered.mockResolvedValue([]);
    await heroSlideService.listAll();
    expect(heroSlideRepository.findAllOrdered).toHaveBeenCalledTimes(1);
  });

  it('reorder forwards the id list to the repository', async () => {
    heroSlideRepository.bulkReorder.mockResolvedValue(2);
    await heroSlideService.reorder([3, 1, 2]);
    expect(heroSlideRepository.bulkReorder).toHaveBeenCalledWith([3, 1, 2]);
  });
});
