// ============================================================
// PartnerController.js — Couche HTTP publique des partenaires.
//
// Endpoint unique pour la page publique « Nos partenaires ». Aucune
// donnée personnelle à retirer — toutes les colonnes sont publiques.
// Renvoyé trié (display_order ASC, id ASC) pour que la bande de logos de
// la page d'accueil corresponde à la page dédiée.
// ============================================================

import { partnerService } from '../service/PartnerService.js';

export class PartnerController {
  /** GET /api/partners — 200 → Partner[] (ordonnés) */
  static list = async (req, res) => {
    const partners = await partnerService.listAllOrdered();
    return res.status(200).json(partners);
  };
}
