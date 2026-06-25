// ============================================================
// EventRepository.js — CRUD pour la table `event`.
//
// Ajoute `findUpcoming` pour l'agenda public (page d'accueil) — renvoie
// les N prochains événements à partir de maintenant, triés par date
// croissante. Les événements passés sont exclus afin que l'agenda
// reflète toujours ce qui vient, sans que les admins aient à désactiver
// manuellement show_in_agenda après chaque événement.
// ============================================================

import { Repository } from '../core/Repository.js';
import { Event } from '../entity/Event.js';
import { pool } from '../config/database.js';

class EventRepository extends Repository {
  constructor() {
    super('event', Event);
  }

  /**
   * Événements à venir pour l'agenda public.
   *   - date_event >= NOW()
   *   - show_in_agenda = 1
   *   - triés par date croissante
   *
   * @param {object} [opts]
   * @param {number} [opts.limit=10]
   * @returns {Promise<Event[]>}
   */
  findUpcoming = async ({ limit = 10 } = {}) => {
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
    const [rows] = await pool.query(
      'SELECT * FROM event WHERE date_event >= NOW() AND show_in_agenda = 1 ORDER BY date_event ASC LIMIT ?',
      [safeLimit],
    );
    return rows.map((row) => new Event(row));
  };
}

export const eventRepository = new EventRepository();
