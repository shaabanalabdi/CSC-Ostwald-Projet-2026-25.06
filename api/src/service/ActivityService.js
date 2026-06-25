// ============================================================
// ActivityService.js — Logique métier des activités (CRUD admin).
//
// Un unique `_validate(payload)` privé est partagé par create + update
// afin que les règles au niveau des champs restent cohérentes. Lève 400
// pour une violation d'enum (un champ erroné, échec dur) et 422 pour la
// validation de champs collectée.
// ============================================================

import { activityRepository } from '../repository/ActivityRepository.js';
import { Activity } from '../entity/Activity.js';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '../error/HttpException.js';

const ALLOWED_TYPES = ['famille', 'jeunesse', 'reguliere'];
const ALLOWED_FREQUENCES = ['HEBDO', 'MENSUEL'];

const LIMITS = {
  title: { min: 2, max: 200 },
  description: { min: 10, max: 5000 },
  lieu: { max: 200 },
  jour: { max: 50 },
  horaire: { max: 100 },
  cout: { max: 50 },
  categorie_label: { max: 80 },
  tag: { max: 30 },
  image_url: { max: 500 },
};

class ActivityService {
  // ──────────────────────────────────────────────────────────
  // LECTURE
  // ──────────────────────────────────────────────────────────

  /**
   * Liste publique — utilisée par les pages /famille et /jeunesse. Ne
   * renvoie que les lignes publiées du type demandé. Les types inconnus
   * lèvent 400 pour qu'un appelant distingue « aucun résultat » de
   * « vous avez demandé n'importe quoi ».
   */
  listPublishedByType = async (type) => {
    if (!ALLOWED_TYPES.includes(type)) {
      throw new BadRequestException(
        `Type invalide. Valeurs autorisées : ${ALLOWED_TYPES.join(', ')}`,
        { field: 'type' },
      );
    }
    return activityRepository.findPublishedByType(type);
  };

  listPaginated = async ({ page = 1, perPage = 20, type } = {}) => {
    const safePage = Math.max(1, Number(page) || 1);
    const safePerPage = Math.min(100, Math.max(1, Number(perPage) || 20));
    // Filter pushed to SQL — `total` and `totalPages` now reflect the
    // filtered set, so admin pagination shows the correct number of
    // pages for the selected activity_type. Unknown/missing `type` →
    // unfiltered listing (the original behaviour).
    const safeType = type && ALLOWED_TYPES.includes(type) ? type : null;
    return activityRepository.findPaginatedByType({
      page: safePage,
      perPage: safePerPage,
      type: safeType,
    });
  };

  getOne = async (id) => {
    const activity = await activityRepository.find(id);
    if (!activity) throw new NotFoundException('Activité introuvable');
    return activity;
  };

  // ──────────────────────────────────────────────────────────
  // ÉCRITURE
  // ──────────────────────────────────────────────────────────

  create = async (payload) => {
    const data = this._validate(payload);
    const activity = new Activity(data);
    await activityRepository.save(activity);
    // Re-lecture pour récupérer les created_at / updated_at générés par la DB.
    return activityRepository.find(activity.id);
  };

  update = async (id, payload) => {
    const existing = await this.getOne(id);
    const data = this._validate(payload);
    // Fusionne les champs validés sur la ligne existante. L'id reste ;
    // updated_at est mis à jour automatiquement par MySQL
    // (ON UPDATE CURRENT_TIMESTAMP).
    Object.assign(existing, data);
    await activityRepository.save(existing);
    return activityRepository.find(id);
  };

  remove = async (id) => {
    const deleted = await activityRepository.delete(id);
    if (!deleted) throw new NotFoundException('Activité introuvable');
  };

  // Pas de reorder() — la table `activity` n'a pas de colonne
  // display_order. Si un tri personnalisé devient nécessaire, ajouter la
  // colonne via ALTER TABLE et une méthode reorder calquée sur
  // TeamMemberService.reorder.

  // ──────────────────────────────────────────────────────────
  // VALIDATION (partagée par create + update)
  // ──────────────────────────────────────────────────────────

  /**
   * Assainit + valide. Renvoie un objet simple sûr à passer à l'entité.
   * Écarte silencieusement les champs inconnus (défense en profondeur —
   * les clients ne peuvent pas glisser des colonnes supplémentaires dans
   * l'INSERT).
   */
  _validate = (payload) => {
    const errors = {};
    const data = {};

    // ── Champs obligatoires ──
    const title = String(payload?.title ?? '').trim();
    if (title.length < LIMITS.title.min || title.length > LIMITS.title.max) {
      errors.title = `Titre entre ${LIMITS.title.min} et ${LIMITS.title.max} caractères`;
    } else {
      data.title = title;
    }

    const description = String(payload?.description ?? '').trim();
    if (
      description.length < LIMITS.description.min ||
      description.length > LIMITS.description.max
    ) {
      errors.description = `Description entre ${LIMITS.description.min} et ${LIMITS.description.max} caractères`;
    } else {
      data.description = description;
    }

    const activity_type = String(payload?.activity_type ?? '');
    if (!ALLOWED_TYPES.includes(activity_type)) {
      throw new BadRequestException(
        `Type invalide. Valeurs autorisées : ${ALLOWED_TYPES.join(', ')}`,
        { field: 'activity_type' },
      );
    }
    data.activity_type = activity_type;

    // ── Champs optionnels (null si vides) ──
    const optStr = (field, raw, max) => {
      const str = raw == null || String(raw).trim() === '' ? null : String(raw).trim();
      if (str !== null && str.length > max) {
        errors[field] = `Maximum ${max} caractères`;
      }
      data[field] = str;
    };
    optStr('lieu', payload?.lieu, LIMITS.lieu.max);
    optStr('jour', payload?.jour, LIMITS.jour.max);
    optStr('horaire', payload?.horaire, LIMITS.horaire.max);
    optStr('cout', payload?.cout, LIMITS.cout.max);
    optStr('categorie_label', payload?.categorie_label, LIMITS.categorie_label.max);
    optStr('tag', payload?.tag, LIMITS.tag.max);
    optStr('image_url', payload?.image_url, LIMITS.image_url.max);

    // ── Enum optionnel : frequence (HEBDO / MENSUEL) ──
    const rawFreq = payload?.frequence;
    if (rawFreq == null || String(rawFreq).trim() === '') {
      data.frequence = null;
    } else {
      const f = String(rawFreq).trim().toUpperCase();
      if (!ALLOWED_FREQUENCES.includes(f)) {
        errors.frequence = `Fréquence invalide. Valeurs : ${ALLOWED_FREQUENCES.join(', ')}`;
      } else {
        data.frequence = f;
      }
    }

    // ── Champs numériques optionnels ──
    data.category_id =
      payload?.category_id != null && payload.category_id !== ''
        ? Math.max(1, parseInt(payload.category_id, 10)) || null
        : null;

    if (payload?.capacite != null && payload.capacite !== '') {
      const cap = parseInt(payload.capacite, 10);
      if (Number.isNaN(cap) || cap < 1) {
        errors.capacite = 'Capacité doit être un entier ≥ 1';
      } else {
        data.capacite = cap;
      }
    } else {
      data.capacite = null;
    }

    // ── price_cents (prix autoritaire serveur pour les inscriptions
    //    Jeunesse payantes) ──
    // `cout` est un libellé libre (« Gratuit », « 5€ ») ; price_cents est
    // le montant débité via HelloAsso. On ne fait JAMAIS confiance au
    // montant fourni par le client sur /api/payment/checkout — le service
    // d'inscription lit cette colonne à la place. Null signifie « gratuit
    // ou non vendable » (le service d'inscription rejette les prix null
    // pour les activités marquées Jeunesse).
    if (payload?.price_cents == null || payload.price_cents === '') {
      data.price_cents = null;
    } else {
      const price = parseInt(payload.price_cents, 10);
      if (Number.isNaN(price) || price < 0 || price > 100_000_00) {
        errors.price_cents = 'Prix invalide (en centimes, 0 à 100 000,00 €)';
      } else {
        data.price_cents = price;
      }
    }

    // ── Booléen (défaut true — les nouvelles activités sont en général publiées) ──
    data.is_published = payload?.is_published === false || payload?.is_published === 0 ? 0 : 1;

    if (Object.keys(errors).length > 0) {
      throw new UnprocessableEntityException('Validation échouée', { fields: errors });
    }

    return data;
  };
}

export const activityService = new ActivityService();
