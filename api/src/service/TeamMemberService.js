// ============================================================
// TeamMemberService.js — Logique métier des membres de l'équipe.
//
// Deux publics :
//   - Public : listAllOrdered() pour la page « Qui sommes-nous » (lecture seule).
//   - Admin  : CRUD complet avec validation partagée.
//
// `email` est OPTIONNEL — les services civiques et bénévoles n'ont
// souvent qu'une adresse personnelle que l'on choisit délibérément de ne
// pas stocker/afficher. Quand elle est fournie, elle doit ressembler à un
// e-mail (même regex Validator que les autres entités). `display_order`
// est un INT libre — les admins le trient en éditant directement la
// valeur (un futur glisser-déposer est hors périmètre).
// ============================================================

import { teamMemberRepository } from '../repository/TeamMemberRepository.js';
import { TeamMember } from '../entity/TeamMember.js';
import { Validator } from '../utils/Validator.js';
import { NotFoundException, UnprocessableEntityException } from '../error/HttpException.js';

const LIMITS = {
  nom: { min: 1, max: 100 },
  prenom: { min: 1, max: 100 },
  role: { min: 2, max: 150 },
  email: { max: 100 },
  phone: { max: 20 },
  photo_url: { max: 500 },
};

class TeamMemberService {
  // ──────────────────────────────────────────────────────────
  // LECTURE
  // ──────────────────────────────────────────────────────────

  /** Public — liste ordonnée pour « Qui sommes-nous ». */
  listAllOrdered = async () => teamMemberRepository.findAllOrdered();

  /** Admin — liste complète paginée (même ordre que le public, juste paginée). */
  listPaginated = async ({ page = 1, perPage = 50 } = {}) => {
    const safePage = Math.max(1, Number(page) || 1);
    const safePerPage = Math.min(100, Math.max(1, Number(perPage) || 50));
    return teamMemberRepository.findPaginated({ page: safePage, perPage: safePerPage });
  };

  getOne = async (id) => {
    const member = await teamMemberRepository.find(id);
    if (!member) throw new NotFoundException('Membre introuvable');
    return member;
  };

  // ──────────────────────────────────────────────────────────
  // ÉCRITURE (admin)
  // ──────────────────────────────────────────────────────────

  create = async (payload) => {
    const data = this._validate(payload);
    const member = new TeamMember(data);
    await teamMemberRepository.save(member);
    return teamMemberRepository.find(member.id);
  };

  update = async (id, payload) => {
    const existing = await this.getOne(id);
    const data = this._validate(payload);
    Object.assign(existing, data);
    await teamMemberRepository.save(existing);
    return teamMemberRepository.find(id);
  };

  remove = async (id) => {
    const deleted = await teamMemberRepository.delete(id);
    if (!deleted) throw new NotFoundException('Membre introuvable');
  };

  /**
   * Remplace le display_order de chaque membre par son index dans `ids`.
   * Utilisé par l'UI admin de réorganisation par glisser-déposer.
   * Encapsulé dans une transaction SQL (voir Repository.bulkReorder) —
   * les échecs partiels ne laissent pas la liste à moitié triée.
   */
  reorder = async (ids) => teamMemberRepository.bulkReorder(ids);

  // ──────────────────────────────────────────────────────────
  // VALIDATION (partagée par create + update)
  // ──────────────────────────────────────────────────────────

  _validate = (payload) => {
    const errors = {};
    const data = {};

    // ── Obligatoires ──
    const required = (field, label) => {
      const v = String(payload?.[field] ?? '').trim();
      const lim = LIMITS[field];
      if (v.length < lim.min || v.length > lim.max) {
        errors[field] = `${label} entre ${lim.min} et ${lim.max} caractères`;
      } else {
        data[field] = v;
      }
    };
    required('nom', 'Nom');
    required('prenom', 'Prénom');
    required('role', 'Rôle');

    // ── E-mail optionnel ──
    const rawEmail = payload?.email;
    if (rawEmail == null || String(rawEmail).trim() === '') {
      data.email = null;
    } else {
      const e = String(rawEmail).trim().toLowerCase();
      if (e.length > LIMITS.email.max) {
        errors.email = `Maximum ${LIMITS.email.max} caractères`;
      } else if (!Validator.isEmail(e)) {
        errors.email = 'Adresse e-mail invalide';
      } else {
        data.email = e;
      }
    }

    // ── Téléphone optionnel (format français quand fourni) ──
    const rawPhone = payload?.phone;
    if (rawPhone == null || String(rawPhone).trim() === '') {
      data.phone = null;
    } else {
      const phone = String(rawPhone).trim();
      if (phone.length > LIMITS.phone.max) {
        errors.phone = `Maximum ${LIMITS.phone.max} caractères`;
      } else if (!Validator.isPhoneFR(phone)) {
        errors.phone = 'Numéro de téléphone français invalide';
      } else {
        data.phone = phone;
      }
    }

    // ── photo_url optionnelle ──
    const rawPhoto = payload?.photo_url;
    if (rawPhoto == null || String(rawPhoto).trim() === '') {
      data.photo_url = null;
    } else {
      const p = String(rawPhoto).trim();
      if (p.length > LIMITS.photo_url.max) {
        errors.photo_url = `Maximum ${LIMITS.photo_url.max} caractères`;
      } else {
        data.photo_url = p;
      }
    }

    // ── display_order ──
    // Vaut 0 par défaut ; accepte les négatifs pour un tri type
    // « épingler en haut ».
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

export const teamMemberService = new TeamMemberService();
