// ============================================================
// EventController.js — Couche HTTP publique des événements.
//
// Endpoint unique pour l'agenda de la page d'accueil : événements à
// venir uniquement, sans auth, aucune donnée personnelle à divulguer.
// De futures pages de détail d'événement ajouteraient GET /:id ici.
// ============================================================

import { eventService } from '../service/EventService.js';

export class EventController {
  /**
   * GET /api/events/upcoming?limit=10
   * 200 → Event[] (triés par date_event croissante)
   *
   * La limite est bornée côté serveur (1..50) afin qu'une requête forgée
   * ne puisse pas tirer toute la table.
   */
  static listUpcoming = async (req, res) => {
    const events = await eventService.listUpcoming({ limit: req.query.limit });
    return res.status(200).json(events);
  };
}
