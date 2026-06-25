// ============================================================
// NewsletterController.js — Couche HTTP de la fonctionnalité newsletter.
//
// Méthodes statiques à dessein (convention CLAUDE.md). Chaque méthode
// est fine : elle transmet `req.body` au service et façonne la réponse
// HTTP. Les erreurs métier sont des sous-classes de HttpException levées
// par le service ; Express 5 attrape automatiquement les throws async et
// les confie au middleware errorHandler centralisé — pas besoin de
// try/catch ici.
// ============================================================

import { newsletterService } from '../service/NewsletterService.js';

export class NewsletterController {
  /**
   * POST /api/newsletter
   * Body:  { email: string }
   * 201 →  { id, email, subscribed_at }      // succès
   * 400 →  { message, details: { field } }    // e-mail invalide
   * 409 →  { message }                        // déjà inscrit
   *
   * NOTE : le service renvoie aussi `_confirmation_token` pour qu'on
   * puisse plus tard envoyer un lien de confirmation par e-mail. On le
   * retire ici afin que la réponse publique ne transporte jamais le
   * secret — le token n'est utile que côté serveur.
   */
  static subscribe = async (req, res) => {
    const result = await newsletterService.subscribe(req.body);
    // Déstructure le token hors de la réponse — le préfixe underscore le
    // marque comme intentionnellement inutilisé (convention standard de
    // la règle ESLint). On le garde lié par nom plutôt que `delete` pour
    // que les futurs mainteneurs voient clairement quel champ est filtré.
    const { _confirmation_token, ...publicResult } = result;
    void _confirmation_token;
    return res.status(201).json(publicResult);
  };

  /**
   * GET /api/newsletter/confirm?token=<hex64>
   * Confirmation du double opt-in. À usage unique — le token est mis à
   * null en cas de succès pour qu'une URL fuitée ne puisse pas être rejouée.
   * 200 → { confirmed: true, email }
   * 400 → { message } token malformé
   * 404 → { message } token inconnu / déjà utilisé
   */
  static confirm = async (req, res) => {
    const { email } = await newsletterService.confirm(req.query.token);
    return res.status(200).json({ confirmed: true, email });
  };

  /**
   * POST /api/newsletter/unsubscribe
   * Body: { email: string }
   * One-click opt-out. Always returns the same `{ unsubscribed: true }` shape
   * regardless of whether the email was on file — see NewsletterService.unsubscribe
   * for the email-enumeration rationale. Malformed emails still get 400.
   * 200 → { unsubscribed: true }
   * 400 → { message } invalid email
   */
  static unsubscribe = async (req, res) => {
    await newsletterService.unsubscribe(req.body?.email);
    return res.status(200).json({ unsubscribed: true });
  };
}
