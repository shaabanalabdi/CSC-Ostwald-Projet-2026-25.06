// ============================================================
// BenevoleApplicationService.js — Logique métier du formulaire bénévole.
//
// Valide les mêmes champs que le schéma Zod du frontend
// (client/src/features/benevole/schemas/benevole.schema.js) :
//   - nom, prenom, email   : chaînes obligatoires
//   - telephone            : optionnel, format téléphone français si présent
//   - domaines, competences, jours, plages : tableaux de chaînes (peuvent être vides)
//   - message              : optionnel, max 2000 caractères
//
// `rgpdConsent` est une barrière UX du frontend — le client le retire
// avant d'envoyer — donc ce service ne doit pas l'attendre.
// ============================================================

import { benevoleApplicationRepository } from '../repository/BenevoleApplicationRepository.js';
import { BenevoleApplication } from '../entity/BenevoleApplication.js';
import { Validator } from '../utils/Validator.js';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '../error/HttpException.js';

/** Statuts autorisés pour une candidature bénévole. */
const ALLOWED_STATUSES = ['new', 'contacted', 'rejected'];

export const LIMITS = {
  nom: { min: 2, max: 80 },
  prenom: { min: 2, max: 80 },
  email: { max: 100 },
  telephone: { max: 20 },
  message: { max: 1000 },
};

const ARRAY_FIELDS = ['domaines', 'competences', 'jours', 'plages'];

class BenevoleApplicationService {
  /**
   * Persiste une candidature bénévole.
   *
   * @param {object} payload - { nom, prenom, email, telephone?, domaines,
   *                              competences, jours, plages, message? }
   * @returns {Promise<{ id: number }>} correspond au BenevoleResponse du frontend.
   * @throws {UnprocessableEntityException} erreurs de validation par champ.
   */
  apply = async (payload) => {
    const errors = {};

    const nom = String(payload?.nom ?? '').trim();
    if (nom.length < LIMITS.nom.min || nom.length > LIMITS.nom.max) {
      errors.nom = `Le nom doit faire entre ${LIMITS.nom.min} et ${LIMITS.nom.max} caractères`;
    }

    const prenom = String(payload?.prenom ?? '').trim();
    if (prenom.length < LIMITS.prenom.min || prenom.length > LIMITS.prenom.max) {
      errors.prenom = `Le prénom doit faire entre ${LIMITS.prenom.min} et ${LIMITS.prenom.max} caractères`;
    }

    const email = String(payload?.email ?? '')
      .trim()
      .toLowerCase();
    if (!Validator.isEmail(email) || email.length > LIMITS.email.max) {
      errors.email = 'Adresse e-mail invalide';
    }

    // Téléphone optionnel — chaîne vide → null en DB.
    const telephoneRaw = String(payload?.telephone ?? '').trim();
    const telephone = telephoneRaw === '' ? null : telephoneRaw;
    if (telephone !== null) {
      if (!Validator.isPhoneFR(telephone)) {
        errors.telephone = 'Numéro de téléphone invalide (format français attendu)';
      } else if (telephone.length > LIMITS.telephone.max) {
        errors.telephone = `Le téléphone ne doit pas dépasser ${LIMITS.telephone.max} caractères`;
      }
    }

    // Tableaux — chacun doit être un tableau de chaînes (un tableau vide est autorisé).
    const arrays = {};
    for (const field of ARRAY_FIELDS) {
      const value = payload?.[field];
      if (value === undefined || value === null) {
        // Tolère l'omission — le frontend défaut à [].
        arrays[field] = [];
        continue;
      }
      if (!Validator.isStringArray(value) && !(Array.isArray(value) && value.length === 0)) {
        errors[field] = `${field} doit être un tableau de chaînes`;
        continue;
      }
      arrays[field] = value;
    }

    // Message optionnel.
    const messageBody = String(payload?.message ?? '').trim();
    if (messageBody.length > LIMITS.message.max) {
      errors.message = `Le message ne doit pas dépasser ${LIMITS.message.max} caractères`;
    }

    if (Object.keys(errors).length > 0) {
      throw new UnprocessableEntityException('Validation échouée', { fields: errors });
    }

    const row = new BenevoleApplication({
      nom,
      prenom,
      email,
      telephone,
      // mysql2 sérialise automatiquement les tableaux JS dans les colonnes JSON.
      domaines: arrays.domaines,
      competences: arrays.competences,
      jours: arrays.jours,
      plages: arrays.plages,
      message: messageBody === '' ? null : messageBody,
      status: 'new',
    });

    await benevoleApplicationRepository.save(row);

    return { id: row.id };
  };

  // ──────────────────────────────────────────────────────────
  // Méthodes ADMIN — toutes derrière isAuthenticated en amont.
  // ──────────────────────────────────────────────────────────

  /** Liste paginée, les plus récentes d'abord. */
  listPaginated = async ({ page = 1, perPage = 20 } = {}) => {
    const safePage = Math.max(1, Number(page) || 1);
    const safePerPage = Math.min(100, Math.max(1, Number(perPage) || 20));
    return benevoleApplicationRepository.findPaginated({
      page: safePage,
      perPage: safePerPage,
    });
  };

  /** Recherche d'une candidature unique. */
  getOne = async (id) => {
    const app = await benevoleApplicationRepository.find(id);
    if (!app) throw new NotFoundException('Candidature introuvable');
    return app;
  };

  /**
   * Change le statut du workflow (new / contacted / rejected).
   * @throws {BadRequestException} statut hors de l'enum.
   * @throws {NotFoundException}   l'id de candidature n'existe pas.
   */
  updateStatus = async (id, newStatus) => {
    if (!ALLOWED_STATUSES.includes(newStatus)) {
      throw new BadRequestException(
        `Statut invalide. Valeurs autorisées : ${ALLOWED_STATUSES.join(', ')}`,
        { field: 'status' },
      );
    }
    const app = await this.getOne(id);
    if (app.status === newStatus) return app; // idempotent
    app.status = newStatus;
    await benevoleApplicationRepository.save(app);
    return app;
  };

  /** Supprime définitivement une candidature. */
  remove = async (id) => {
    const deleted = await benevoleApplicationRepository.delete(id);
    if (!deleted) throw new NotFoundException('Candidature introuvable');
  };

  /** Export complet des candidatures pour l'export CSV admin. Les plus récentes d'abord. */
  exportAll = async () => benevoleApplicationRepository.findAllOrdered();
}

export const benevoleApplicationService = new BenevoleApplicationService();
