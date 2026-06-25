// ============================================================
// PartnerService.js — Logique métier des partenaires institutionnels /
// associatifs.
//
// Deux publics :
//   - Public : listAllOrdered() pour la page d'accueil + « Nos partenaires ».
//   - Admin  : CRUD complet avec validation partagée.
//
// `logo_url` est OBLIGATOIRE — un partenaire sans logo s'afficherait
// vide sur la page publique. `website_url` est OPTIONNELLE — certains
// partenaires (ex. une association locale) n'ont pas de site public.
// Les deux URLs passent par Validator.isHttpUrl pour rejeter les valeurs
// vides/corrompues ; l'entité est ensuite stockée telle quelle.
// ============================================================

import { partnerRepository } from '../repository/PartnerRepository.js';
import { Partner } from '../entity/Partner.js';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '../error/HttpException.js';

const ALLOWED_CATEGORIES = ['institutionnel', 'associatif'];

const LIMITS = {
  name: { min: 2, max: 200 },
  logo_url: { max: 500 },
  website_url: { max: 500 },
};

class PartnerService {
  // ──────────────────────────────────────────────────────────
  // LECTURE
  // ──────────────────────────────────────────────────────────

  /** Public — liste ordonnée pour la page des partenaires. */
  listAllOrdered = async () => partnerRepository.findAllOrdered();

  /** Admin — liste complète paginée. */
  listPaginated = async ({ page = 1, perPage = 50 } = {}) => {
    const safePage = Math.max(1, Number(page) || 1);
    const safePerPage = Math.min(100, Math.max(1, Number(perPage) || 50));
    return partnerRepository.findPaginated({ page: safePage, perPage: safePerPage });
  };

  getOne = async (id) => {
    const partner = await partnerRepository.find(id);
    if (!partner) throw new NotFoundException('Partenaire introuvable');
    return partner;
  };

  // ──────────────────────────────────────────────────────────
  // ÉCRITURE (admin)
  // ──────────────────────────────────────────────────────────

  create = async (payload) => {
    const data = this._validate(payload);
    const partner = new Partner(data);
    await partnerRepository.save(partner);
    return partnerRepository.find(partner.id);
  };

  update = async (id, payload) => {
    const existing = await this.getOne(id);
    const data = this._validate(payload);
    Object.assign(existing, data);
    await partnerRepository.save(existing);
    return partnerRepository.find(id);
  };

  remove = async (id) => {
    const deleted = await partnerRepository.delete(id);
    if (!deleted) throw new NotFoundException('Partenaire introuvable');
  };

  /** Remplace le display_order de chaque partenaire par son index dans `ids`. */
  reorder = async (ids) => partnerRepository.bulkReorder(ids);

  // ──────────────────────────────────────────────────────────
  // VALIDATION (partagée par create + update)
  // ──────────────────────────────────────────────────────────

  /**
   * Vérification de bon sens de l'URL du site web externe. On ne
   * s'appuie pas sur Validator ici car la classe Validator cible les
   * e-mails / téléphones / sujets de contact — les URLs méritent leur
   * propre prédicat minimal. On rejette tout ce qui n'est pas http(s)
   * pour que la valeur ne soit jamais rendue comme une URI `javascript:`
   * ou `data:` à la suite d'un copier-coller accidentel.
   */
  _isUrl = (value) => {
    try {
      const u = new URL(value);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  /**
   * L'URL du logo accepte la même forme que celle renvoyée par l'endpoint
   * d'upload (`/uploads/<hash>.<ext>`) en plus d'une URL http(s) complète
   * — afin que les admins puissent soit téléverser un logo (sauvegardé
   * dans api/uploads/), soit coller un lien CDN externe. On interdit `..`
   * pour bloquer le path-traversal.
   */
  _isValidLogoUrl = (value) => {
    if (typeof value !== 'string' || value.length === 0) return false;
    if (value.includes('..')) return false;
    if (value.startsWith('/uploads/')) return true;
    return this._isUrl(value);
  };

  _validate = (payload) => {
    const errors = {};
    const data = {};

    // ── name (obligatoire) ──
    const name = String(payload?.name ?? '').trim();
    if (name.length < LIMITS.name.min || name.length > LIMITS.name.max) {
      errors.name = `Nom entre ${LIMITS.name.min} et ${LIMITS.name.max} caractères`;
    } else {
      data.name = name;
    }

    // ── logo_url (obligatoire) ──
    const logo = String(payload?.logo_url ?? '').trim();
    if (logo.length === 0) {
      errors.logo_url = 'URL du logo requise';
    } else if (logo.length > LIMITS.logo_url.max) {
      errors.logo_url = `Maximum ${LIMITS.logo_url.max} caractères`;
    } else if (!this._isValidLogoUrl(logo)) {
      errors.logo_url = 'URL invalide (utilisez /uploads/... ou https://...)';
    } else {
      data.logo_url = logo;
    }

    // ── website_url (optionnelle) ──
    const rawSite = payload?.website_url;
    if (rawSite == null || String(rawSite).trim() === '') {
      data.website_url = null;
    } else {
      const site = String(rawSite).trim();
      if (site.length > LIMITS.website_url.max) {
        errors.website_url = `Maximum ${LIMITS.website_url.max} caractères`;
      } else if (!this._isUrl(site)) {
        errors.website_url = 'URL invalide (http:// ou https:// requis)';
      } else {
        data.website_url = site;
      }
    }

    // ── category (enum, échec dur avec 400 — un enum invalide est une
    //    erreur structurelle, pas une faute de frappe utilisateur par champ) ──
    const category = String(payload?.category ?? '');
    if (!ALLOWED_CATEGORIES.includes(category)) {
      throw new BadRequestException(
        `Catégorie invalide. Valeurs autorisées : ${ALLOWED_CATEGORIES.join(', ')}`,
        { field: 'category' },
      );
    }
    data.category = category;

    // ── display_order (optionnel, défaut 0) ──
    if (payload?.display_order == null || payload.display_order === '') {
      data.display_order = 0;
    } else {
      const n = parseInt(payload.display_order, 10);
      if (Number.isNaN(n)) {
        errors.display_order = "L'ordre d'affichage doit être un entier";
      } else {
        data.display_order = n;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new UnprocessableEntityException('Validation échouée', { fields: errors });
    }

    return data;
  };
}

export const partnerService = new PartnerService();
