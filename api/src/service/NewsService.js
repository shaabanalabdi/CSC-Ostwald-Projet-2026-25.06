// ============================================================
// NewsService.js — Logique métier des cartes « Nos actualités ».
//
// Deux publics :
//   - Public : listPublished({ limit }) — uniquement `is_published = 1`,
//     les plus récentes d'abord. La page d'accueil passe limit=4 pour que
//     la section reste compacte même après une année de publications.
//   - Admin  : liste complète paginée + CRUD.
//
// `image_url` et `social_url` acceptent soit `/uploads/...` (endpoint
// d'upload admin), soit des URLs http(s) absolues.
// ============================================================

import { newsRepository } from '../repository/NewsRepository.js';
import { News } from '../entity/News.js';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '../error/HttpException.js';

const ALLOWED_PLATFORMS = ['instagram', 'facebook', 'none'];

const LIMITS = {
  title: { min: 2, max: 200 },
  excerpt: { min: 10, max: 2000 },
  image_url: { max: 500 },
  social_url: { max: 500 },
};

class NewsService {
  // ──────────────────────────────────────────────────────────
  // LECTURE
  // ──────────────────────────────────────────────────────────

  /** Public — actualités publiées triées par date DESC, avec plafond optionnel. */
  listPublished = async ({ limit = null } = {}) => {
    const parsedLimit = limit != null ? parseInt(limit, 10) : null;
    const safeLimit =
      parsedLimit != null && Number.isInteger(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 50)
        : null;
    return newsRepository.findPublishedOrdered({ limit: safeLimit });
  };

  /** Admin — liste complète paginée (les plus récentes par id DESC). */
  listPaginated = async ({ page = 1, perPage = 50 } = {}) => {
    const safePage = Math.max(1, Number(page) || 1);
    const safePerPage = Math.min(100, Math.max(1, Number(perPage) || 50));
    return newsRepository.findPaginated({ page: safePage, perPage: safePerPage });
  };

  getOne = async (id) => {
    const news = await newsRepository.find(id);
    if (!news) throw new NotFoundException('Actualité introuvable');
    return news;
  };

  // ──────────────────────────────────────────────────────────
  // ÉCRITURE (admin)
  // ──────────────────────────────────────────────────────────

  create = async (payload) => {
    const data = this._validate(payload);
    const news = new News(data);
    await newsRepository.save(news);
    return newsRepository.find(news.id);
  };

  update = async (id, payload) => {
    const existing = await this.getOne(id);
    const data = this._validate(payload);
    Object.assign(existing, data);
    await newsRepository.save(existing);
    return newsRepository.find(id);
  };

  remove = async (id) => {
    const deleted = await newsRepository.delete(id);
    if (!deleted) throw new NotFoundException('Actualité introuvable');
  };

  // ──────────────────────────────────────────────────────────
  // VALIDATION
  // ──────────────────────────────────────────────────────────

  /** /uploads/... (upload admin) OU https://... — même règle que le schéma d'upload. */
  _isValidImageUrl = (value) => {
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

  /** Lien social externe — http(s) seulement (pas de chemins relatifs). */
  _isHttpUrl = (value) => {
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

    // ── excerpt (obligatoire) ──
    const excerpt = String(payload?.excerpt ?? '').trim();
    if (excerpt.length < LIMITS.excerpt.min || excerpt.length > LIMITS.excerpt.max) {
      errors.excerpt = `Extrait entre ${LIMITS.excerpt.min} et ${LIMITS.excerpt.max} caractères`;
    } else {
      data.excerpt = excerpt;
    }

    // ── image_url (optionnelle) ──
    const rawImg = payload?.image_url;
    if (rawImg == null || String(rawImg).trim() === '') {
      data.image_url = null;
    } else {
      const img = String(rawImg).trim();
      if (img.length > LIMITS.image_url.max) {
        errors.image_url = `Maximum ${LIMITS.image_url.max} caractères`;
      } else if (!this._isValidImageUrl(img)) {
        errors.image_url = 'URL invalide (utilisez /uploads/... ou https://...)';
      } else {
        data.image_url = img;
      }
    }

    // ── date_published (obligatoire, YYYY-MM-DD) ──
    const rawDate = String(payload?.date_published ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      errors.date_published = 'Date au format YYYY-MM-DD requise';
    } else {
      const d = new Date(rawDate);
      if (Number.isNaN(d.getTime())) {
        errors.date_published = 'Date invalide';
      } else {
        data.date_published = rawDate;
      }
    }

    // ── social_platform (enum) ──
    const platform = String(payload?.social_platform ?? 'none');
    if (!ALLOWED_PLATFORMS.includes(platform)) {
      throw new BadRequestException(
        `Plateforme invalide. Valeurs autorisées : ${ALLOWED_PLATFORMS.join(', ')}`,
        { field: 'social_platform' },
      );
    }
    data.social_platform = platform;

    // ── social_url (obligatoire si platform != 'none', optionnelle sinon) ──
    const rawSocial = payload?.social_url;
    if (rawSocial == null || String(rawSocial).trim() === '') {
      if (platform !== 'none') {
        errors.social_url = `URL du post ${platform} requise (ou choisir "aucun" en plateforme)`;
      }
      data.social_url = null;
    } else {
      const social = String(rawSocial).trim();
      if (social.length > LIMITS.social_url.max) {
        errors.social_url = `Maximum ${LIMITS.social_url.max} caractères`;
      } else if (!this._isHttpUrl(social)) {
        errors.social_url = 'URL invalide (http:// ou https:// requis)';
      } else {
        data.social_url = social;
      }
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

export const newsService = new NewsService();
