// ============================================================
// ProjetSocialDocumentService.js — Logique métier des documents
// affichés sur la page publique « Projet Social ».
//
// Deux publics :
//   - Public : listPublished() → uniquement `is_published = 1`, ordonnés.
//   - Admin  : liste complète paginée + CRUD + reorder.
//
// `file_url` peut être soit un chemin relatif (ex. `/documents/x.pdf`
// — fichiers dans client/public/documents), soit une URL https absolue
// (ex. un CDN externe plus tard). Le validateur accepte les deux.
// ============================================================

import { projetSocialDocumentRepository } from '../repository/ProjetSocialDocumentRepository.js';
import { ProjetSocialDocument } from '../entity/ProjetSocialDocument.js';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '../error/HttpException.js';

const ALLOWED_COLORS = ['orange', 'blue', 'green'];

const LIMITS = {
  title: { min: 2, max: 150 },
  description: { max: 1000 },
  file_url: { min: 1, max: 500 },
  badge_label: { min: 1, max: 20 },
};

class ProjetSocialDocumentService {
  // ──────────────────────────────────────────────────────────
  // LECTURE
  // ──────────────────────────────────────────────────────────

  /** Public — publiés seulement, ordonnés pour le site web. */
  listPublished = async () => projetSocialDocumentRepository.findPublishedOrdered();

  /** Admin — liste complète paginée (les plus récents d'abord). */
  listPaginated = async ({ page = 1, perPage = 50 } = {}) => {
    const safePage = Math.max(1, Number(page) || 1);
    const safePerPage = Math.min(100, Math.max(1, Number(perPage) || 50));
    return projetSocialDocumentRepository.findPaginated({ page: safePage, perPage: safePerPage });
  };

  getOne = async (id) => {
    const doc = await projetSocialDocumentRepository.find(id);
    if (!doc) throw new NotFoundException('Document introuvable');
    return doc;
  };

  // ──────────────────────────────────────────────────────────
  // ÉCRITURE (admin)
  // ──────────────────────────────────────────────────────────

  create = async (payload) => {
    const data = this._validate(payload);
    const doc = new ProjetSocialDocument(data);
    await projetSocialDocumentRepository.save(doc);
    return projetSocialDocumentRepository.find(doc.id);
  };

  update = async (id, payload) => {
    const existing = await this.getOne(id);
    const data = this._validate(payload);
    Object.assign(existing, data);
    await projetSocialDocumentRepository.save(existing);
    return projetSocialDocumentRepository.find(id);
  };

  remove = async (id) => {
    const deleted = await projetSocialDocumentRepository.delete(id);
    if (!deleted) throw new NotFoundException('Document introuvable');
  };

  /** Remplace le display_order de chaque document par son index dans `ids`. */
  reorder = async (ids) => projetSocialDocumentRepository.bulkReorder(ids);

  // ──────────────────────────────────────────────────────────
  // VALIDATION (partagée par create + update)
  // ──────────────────────────────────────────────────────────

  /**
   * Accepte soit un chemin relatif commençant par `/` (assets livrés
   * sous client/public), soit une URL http(s) absolue. Tout le reste est
   * rejeté — y compris `javascript:`, `data:`, ou les tentatives de
   * path-traversal comme `../`.
   */
  _isValidFileUrl = (value) => {
    if (typeof value !== 'string' || value.length === 0) return false;
    if (value.includes('..')) return false;
    if (value.startsWith('/')) return true;
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

    // ── description (optionnelle) ──
    const rawDesc = payload?.description;
    if (rawDesc == null || String(rawDesc).trim() === '') {
      data.description = null;
    } else {
      const desc = String(rawDesc).trim();
      if (desc.length > LIMITS.description.max) {
        errors.description = `Maximum ${LIMITS.description.max} caractères`;
      } else {
        data.description = desc;
      }
    }

    // ── file_url (obligatoire) ──
    const fileUrl = String(payload?.file_url ?? '').trim();
    if (fileUrl.length === 0) {
      errors.file_url = 'URL du fichier requise';
    } else if (fileUrl.length > LIMITS.file_url.max) {
      errors.file_url = `Maximum ${LIMITS.file_url.max} caractères`;
    } else if (!this._isValidFileUrl(fileUrl)) {
      errors.file_url = 'Chemin invalide (utilisez /documents/... ou https://...)';
    } else {
      data.file_url = fileUrl;
    }

    // ── badge_label (obligatoire) ──
    const badge = String(payload?.badge_label ?? '').trim();
    if (badge.length < LIMITS.badge_label.min || badge.length > LIMITS.badge_label.max) {
      errors.badge_label = `Étiquette entre ${LIMITS.badge_label.min} et ${LIMITS.badge_label.max} caractères`;
    } else {
      data.badge_label = badge;
    }

    // ── color (enum) ──
    const color = String(payload?.color ?? '');
    if (!ALLOWED_COLORS.includes(color)) {
      throw new BadRequestException(
        `Couleur invalide. Valeurs autorisées : ${ALLOWED_COLORS.join(', ')}`,
        { field: 'color' },
      );
    }
    data.color = color;

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

export const projetSocialDocumentService = new ProjetSocialDocumentService();
