// ============================================================
// HeroSlideService.js — Logique métier des slides du carrousel Hero.
//
// Deux publics :
//   - Public : listPublished() — uniquement `is_published = 1`,
//     dans l'ordre du carrousel. Sert la section Hero de l'Accueil.
//   - Admin  : liste complète + CRUD + réordonnancement.
//
// `display_order` n'est PAS validé ici : il est posé à 0 à la création
// puis géré exclusivement par `reorder` (glisser-déposer admin). Le
// laisser hors de `_validate` évite qu'une simple édition de titre ne
// réinitialise la position de la slide dans le carrousel.
// ============================================================

import { heroSlideRepository } from '../repository/HeroSlideRepository.js';
import { HeroSlide } from '../entity/HeroSlide.js';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '../error/HttpException.js';

const ALLOWED_MEDIA_TYPES = ['none', 'image', 'video'];

const LIMITS = {
  title: { min: 2, max: 200 },
  subtitle: { min: 2, max: 300 },
  media_url: { max: 500 },
};

class HeroSlideService {
  // ──────────────────────────────────────────────────────────
  // LECTURE
  // ──────────────────────────────────────────────────────────

  /** Public — slides publiées dans l'ordre du carrousel. */
  listPublished = async () => heroSlideRepository.findPublishedOrdered();

  /** Admin — toutes les slides (brouillons inclus), dans l'ordre du carrousel. */
  listAll = async () => heroSlideRepository.findAllOrdered();

  getOne = async (id) => {
    const slide = await heroSlideRepository.find(id);
    if (!slide) throw new NotFoundException('Slide introuvable');
    return slide;
  };

  // ──────────────────────────────────────────────────────────
  // ÉCRITURE (admin)
  // ──────────────────────────────────────────────────────────

  create = async (payload) => {
    const data = this._validate(payload);
    // Une nouvelle slide arrive en tête (display_order 0) ; l'admin la
    // repositionne ensuite par glisser-déposer sur /admin/hero.
    data.display_order = 0;
    const slide = new HeroSlide(data);
    await heroSlideRepository.save(slide);
    return heroSlideRepository.find(slide.id);
  };

  update = async (id, payload) => {
    const existing = await this.getOne(id);
    const data = this._validate(payload);
    // `data` ne contient pas display_order — la position dans le
    // carrousel est préservée à l'identique lors d'une édition.
    Object.assign(existing, data);
    await heroSlideRepository.save(existing);
    return heroSlideRepository.find(id);
  };

  remove = async (id) => {
    const deleted = await heroSlideRepository.delete(id);
    if (!deleted) throw new NotFoundException('Slide introuvable');
  };

  /** Remplace le display_order de chaque slide par son index dans `ids`. */
  reorder = async (ids) => heroSlideRepository.bulkReorder(ids);

  // ──────────────────────────────────────────────────────────
  // VALIDATION (partagée par create + update)
  // ──────────────────────────────────────────────────────────

  /** /uploads/... (upload admin) OU https://... — refuse `..` (path-traversal). */
  _isValidMediaUrl = (value) => {
    if (typeof value !== 'string' || value.length === 0) return false;
    if (value.includes('..')) return false;
    if (value.startsWith('/uploads/')) return true;
    try {
      const u = new URL(value);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  _validate = (payload) => {
    const errors = {};
    const data = {};

    // ── title (obligatoire) ──
    const title = String(payload?.title ?? '').trim();
    if (title.length < LIMITS.title.min || title.length > LIMITS.title.max) {
      errors.title = `Titre entre ${LIMITS.title.min} et ${LIMITS.title.max} caractères`;
    } else {
      data.title = title;
    }

    // ── subtitle (obligatoire) ──
    const subtitle = String(payload?.subtitle ?? '').trim();
    if (subtitle.length < LIMITS.subtitle.min || subtitle.length > LIMITS.subtitle.max) {
      errors.subtitle = `Sous-titre entre ${LIMITS.subtitle.min} et ${LIMITS.subtitle.max} caractères`;
    } else {
      data.subtitle = subtitle;
    }

    // ── media_type (enum) + media_url ──
    // Un enum invalide est une erreur structurelle (400), pas une faute
    // de frappe par champ. `media_url` est obligatoire dès qu'un type de
    // média est choisi, et ignoré (forcé à null) quand le type est 'none'.
    const mediaType = String(payload?.media_type ?? 'none');
    if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
      throw new BadRequestException(
        `Type de média invalide. Valeurs autorisées : ${ALLOWED_MEDIA_TYPES.join(', ')}`,
        { field: 'media_type' },
      );
    }
    data.media_type = mediaType;

    const rawMedia = payload?.media_url;
    const media = rawMedia == null ? '' : String(rawMedia).trim();
    if (mediaType === 'none') {
      data.media_url = null;
    } else if (media === '') {
      errors.media_url = `URL du média requise pour le type « ${mediaType} »`;
    } else if (media.length > LIMITS.media_url.max) {
      errors.media_url = `Maximum ${LIMITS.media_url.max} caractères`;
    } else if (!this._isValidMediaUrl(media)) {
      errors.media_url = 'URL invalide (utilisez /uploads/... ou https://...)';
    } else {
      data.media_url = media;
    }

    // ── is_published (booléen-ish, défaut 1) ──
    const rawPub = payload?.is_published;
    if (rawPub == null || rawPub === '') {
      data.is_published = 1;
    } else if (rawPub === true || rawPub === 'true' || rawPub === 1 || rawPub === '1') {
      data.is_published = 1;
    } else if (rawPub === false || rawPub === 'false' || rawPub === 0 || rawPub === '0') {
      data.is_published = 0;
    } else {
      errors.is_published = 'is_published doit être 0 ou 1';
    }

    if (Object.keys(errors).length > 0) {
      throw new UnprocessableEntityException('Validation échouée', { fields: errors });
    }

    return data;
  };
}

export const heroSlideService = new HeroSlideService();
