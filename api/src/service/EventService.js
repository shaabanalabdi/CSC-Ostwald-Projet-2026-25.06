// ============================================================
// EventService.js — Logique métier des événements de l'agenda.
//
// Deux publics :
//   - Public : listUpcoming() pour l'agenda de la page d'accueil (lecture seule).
//   - Admin  : CRUD complet avec validation partagée.
//
// `date_event` est le seul champ délicat : un <input type="datetime-local">
// HTML envoie une chaîne « YYYY-MM-DDTHH:mm » dans le fuseau horaire local
// de l'utilisateur, sans décalage. MySQL la stocke en DATETIME (sans
// fuseau non plus). On la parse en Date, on rejette tout ce qui est
// invalide, et on stocke en Date — mysql2 fait le reste.
// ============================================================

import { eventRepository } from '../repository/EventRepository.js';
import { Event } from '../entity/Event.js';
import { NotFoundException, UnprocessableEntityException } from '../error/HttpException.js';

const LIMITS = {
  title: { min: 2, max: 200 },
  description: { max: 5000 },
  lieu: { max: 200 },
  cout: { max: 50 },
  category_label: { max: 80 },
  image_url: { max: 500 },
};

// Regex de couleur hex — accepte #rgb ou #rrggbb (les navigateurs rendent les deux).
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

class EventService {
  // ──────────────────────────────────────────────────────────
  // LECTURE
  // ──────────────────────────────────────────────────────────

  /** Public — événements à venir pour l'agenda de l'accueil. */
  listUpcoming = async ({ limit = 10 } = {}) => eventRepository.findUpcoming({ limit });

  /** Admin — liste complète paginée (passés + futurs, publiés + masqués). */
  listPaginated = async ({ page = 1, perPage = 20 } = {}) => {
    const safePage = Math.max(1, Number(page) || 1);
    const safePerPage = Math.min(100, Math.max(1, Number(perPage) || 20));
    return eventRepository.findPaginated({ page: safePage, perPage: safePerPage });
  };

  getOne = async (id) => {
    const event = await eventRepository.find(id);
    if (!event) throw new NotFoundException('Événement introuvable');
    return event;
  };

  // ──────────────────────────────────────────────────────────
  // ÉCRITURE (admin)
  // ──────────────────────────────────────────────────────────

  create = async (payload) => {
    const data = this._validate(payload);
    const event = new Event(data);
    await eventRepository.save(event);
    return eventRepository.find(event.id);
  };

  update = async (id, payload) => {
    const existing = await this.getOne(id);
    const data = this._validate(payload);
    Object.assign(existing, data);
    await eventRepository.save(existing);
    return eventRepository.find(id);
  };

  remove = async (id) => {
    const deleted = await eventRepository.delete(id);
    if (!deleted) throw new NotFoundException('Événement introuvable');
  };

  // ──────────────────────────────────────────────────────────
  // VALIDATION (partagée par create + update)
  // ──────────────────────────────────────────────────────────

  /**
   * Assainit + valide. Renvoie un objet simple sûr à passer à l'entité.
   * Les champs inconnus sont écartés silencieusement.
   *
   * Gestion des dates : accepte les chaînes de type ISO (« 2026-09-12T18:30 »
   * d'un <input type="datetime-local">, ou ISO complet « ...Z »). Rejette
   * tout ce qui ne se parse pas en une Date valide.
   */
  _validate = (payload) => {
    const errors = {};
    const data = {};

    const title = String(payload?.title ?? '').trim();
    if (title.length < LIMITS.title.min || title.length > LIMITS.title.max) {
      errors.title = `Titre entre ${LIMITS.title.min} et ${LIMITS.title.max} caractères`;
    } else {
      data.title = title;
    }

    // ── date_event (obligatoire, bornée par bon sens) ──
    // On accepte les dates jusqu'à 1 an dans le passé (pour que les admins
    // puissent éditer d'anciens événements à des fins d'archivage) et
    // jusqu'à 10 ans dans le futur. Cela attrape les fautes de frappe
    // type 0026/9999 qui passeraient sinon à travers `new Date(...)` et
    // pollueraient l'agenda.
    const rawDate = payload?.date_event;
    if (rawDate == null || rawDate === '') {
      errors.date_event = "Date de l'événement requise";
    } else {
      const parsed = new Date(rawDate);
      if (Number.isNaN(parsed.getTime())) {
        errors.date_event = 'Date invalide';
      } else {
        const now = Date.now();
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        const minTs = now - oneYearMs;
        const maxTs = now + 10 * oneYearMs;
        if (parsed.getTime() < minTs || parsed.getTime() > maxTs) {
          errors.date_event = 'Date hors plage autorisée (entre 1 an passé et 10 ans futur)';
        } else {
          data.date_event = parsed;
        }
      }
    }

    // ── Texte optionnel ──
    const optStr = (field, raw, max) => {
      const str = raw == null || String(raw).trim() === '' ? null : String(raw).trim();
      if (str !== null && str.length > max) {
        errors[field] = `Maximum ${max} caractères`;
      }
      data[field] = str;
    };
    optStr('description', payload?.description, LIMITS.description.max);
    optStr('lieu', payload?.lieu, LIMITS.lieu.max);
    optStr('cout', payload?.cout, LIMITS.cout.max);
    optStr('category_label', payload?.category_label, LIMITS.category_label.max);
    optStr('image_url', payload?.image_url, LIMITS.image_url.max);

    // ── capacite optionnelle (entier positif) ──
    if (payload?.capacite == null || payload.capacite === '') {
      data.capacite = null;
    } else {
      const n = parseInt(payload.capacite, 10);
      if (Number.isNaN(n) || n < 1) {
        errors.capacite = 'Capacité doit être un entier ≥ 1';
      } else {
        data.capacite = n;
      }
    }

    // ── category_color optionnelle (hex) ──
    const rawColor = payload?.category_color;
    if (rawColor == null || String(rawColor).trim() === '') {
      data.category_color = null;
    } else {
      const c = String(rawColor).trim();
      if (!HEX_COLOR.test(c)) {
        errors.category_color = 'Couleur invalide (format #rrggbb attendu)';
      } else {
        data.category_color = c;
      }
    }

    // ── Clé étrangère optionnelle ──
    data.category_id =
      payload?.category_id != null && payload.category_id !== ''
        ? Math.max(1, parseInt(payload.category_id, 10)) || null
        : null;

    // ── Booléen (défaut true — les nouveaux événements sont en général affichés dans l'agenda) ──
    data.show_in_agenda =
      payload?.show_in_agenda === false || payload?.show_in_agenda === 0 ? 0 : 1;

    if (Object.keys(errors).length > 0) {
      throw new UnprocessableEntityException('Validation échouée', { fields: errors });
    }

    return data;
  };
}

export const eventService = new EventService();
