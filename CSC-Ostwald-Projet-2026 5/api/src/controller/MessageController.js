// ============================================================
// MessageController.js — Couche HTTP du formulaire de contact.
//
// Méthodes statiques sur une classe (convention CLAUDE.md). Wrappers
// fins au-dessus de messageService — la logique métier reste hors du
// monde HTTP.
// ============================================================

import { messageService } from '../service/MessageService.js';

export class MessageController {
  /**
   * POST /api/contact
   * Body:  { prenom, nom, email, telephone?, sujet, message }
   * 201 →  { id }
   * 400 →  { message, details: { field } }   `sujet` invalide
   * 422 →  { message, details: { fields } }  une ou plusieurs erreurs de champ
   */
  static submit = async (req, res) => {
    const result = await messageService.submit(req.body);
    return res.status(201).json(result);
  };
}
