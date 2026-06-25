// ============================================================
// NewsletterService.js — Logique métier de l'inscription à la newsletter.
//
// Parcours :
//   1. Normaliser l'e-mail (rognage + minuscules).
//   2. Valider le format via Validator.isEmail.
//   3. Rejeter les doublons avec un 409 Conflict.
//   4. Générer un confirmation_token à usage unique (double opt-in).
//   5. Insérer l'abonné avec is_confirmed = 0.
//   6. Re-lire pour renvoyer le timestamp subscribed_at généré par la DB.
//
// L'E-MAIL de confirmation lui-même n'est pas encore envoyé ici — c'est
// une phase future (nécessite nodemailer + un fournisseur SMTP). Le token
// est stocké pour que l'endpoint e-mail/confirmation puisse être ajouté
// sans changement de schéma.
// ============================================================

import { randomBytes } from 'node:crypto';
import { newsletterRepository } from '../repository/NewsletterRepository.js';
import { NewsletterSubscriber } from '../entity/NewsletterSubscriber.js';
import { Validator } from '../utils/Validator.js';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '../error/HttpException.js';

class NewsletterService {
  /**
   * Inscrit un e-mail à la newsletter (double opt-in : état en attente).
   *
   * @param {{ email?: unknown }} payload - Corps de requête brut (non validé).
   * @returns {Promise<{ id: number, email: string, subscribed_at: Date | string }>}
   * @throws {BadRequestException} e-mail absent ou malformé.
   * @throws {ConflictException}   e-mail déjà inscrit.
   */
  subscribe = async (payload) => {
    const email = String(payload?.email ?? '')
      .trim()
      .toLowerCase();

    if (!Validator.isEmail(email)) {
      throw new BadRequestException('Adresse e-mail invalide', { field: 'email' });
    }

    const existing = await newsletterRepository.findOneBy({ email });
    if (existing) {
      throw new ConflictException('Cette adresse est déjà inscrite à la newsletter');
    }

    const subscriber = new NewsletterSubscriber({
      email,
      is_confirmed: 0,
      confirmation_token: randomBytes(32).toString('hex'),
    });

    await newsletterRepository.save(subscriber);

    // Re-lecture pour que la réponse inclue le subscribed_at généré par
    // la DB (défaut CURRENT_TIMESTAMP). Évite un bug de dérive d'horloge
    // client-serveur si l'heure du serveur diverge de celle de MySQL.
    const saved = await newsletterRepository.find(subscriber.id);
    return {
      id: saved.id,
      email: saved.email,
      subscribed_at: saved.subscribed_at,
      // Renvoyé pour que l'appelant (contrôleur) puisse construire le lien
      // de confirmation une fois le SMTP branché (Phase 11.5). Le frontend
      // ne le voit JAMAIS — le contrôleur le retire de la réponse JSON.
      _confirmation_token: saved.confirmation_token,
    };
  };

  /**
   * Confirme une inscription par token (double opt-in). Recherche la
   * ligne par son `confirmation_token`, bascule `is_confirmed=1`, estampe
   * `confirmed_at=NOW()`, et met le token à null pour que le lien soit à
   * usage unique.
   *
   * @param {string} token   - Token hex aléatoire émis lors de l'inscription.
   * @returns {Promise<{ id: number, email: string }>}
   * @throws {BadRequestException} token vide/absent.
   * @throws {NotFoundException}   aucun abonné correspondant (déjà confirmé,
   *                                 déjà désinscrit, ou simplement mauvais lien).
   */
  confirm = async (token) => {
    const safeToken = String(token ?? '').trim();
    // N'accepte que 64 caractères hex — randomBytes(32).toString('hex').
    // Refuse tôt les altérations évidentes sans divulguer de différences
    // de timing via SQL.
    if (!/^[a-f0-9]{64}$/i.test(safeToken)) {
      throw new BadRequestException('Token invalide');
    }
    const subscriber = await newsletterRepository.findOneBy({ confirmation_token: safeToken });
    if (!subscriber) {
      throw new NotFoundException('Lien de confirmation invalide ou expiré');
    }
    subscriber.is_confirmed = 1;
    subscriber.confirmed_at = new Date();
    subscriber.confirmation_token = null;
    await newsletterRepository.save(subscriber);
    return { id: subscriber.id, email: subscriber.email };
  };

  /**
   * Désinscription par e-mail (la CNIL / le RGPD imposent un opt-out en
   * 1 clic dans chaque message marketing). Suppression douce en posant
   * `unsubscribed_at=NOW()` ; la ligne reste afin de pouvoir prouver que
   * l'utilisateur a un jour consenti en cas de contestation.
   *
   * Renvoie la MÊME forme de succès que l'e-mail soit trouvé, non trouvé,
   * ou déjà désinscrit. C'est intentionnel : distinguer ces trois états
   * permettrait à un appelant d'énumérer les e-mails des abonnés. Le RGPD
   * ne nous oblige pas à confirmer si quelqu'un était inscrit — seulement
   * que la demande d'opt-out réussisse quand l'adresse était bien fichée.
   *
   * Les e-mails malformés reçoivent toujours un 400 puisque c'est une
   * erreur de validation côté client, pas un canal de divulgation d'état.
   *
   * @param {string} email
   * @returns {Promise<{ ok: true }>}
   * @throws {BadRequestException} e-mail malformé.
   */
  unsubscribe = async (email) => {
    const safeEmail = String(email ?? '')
      .trim()
      .toLowerCase();
    if (!Validator.isEmail(safeEmail)) {
      throw new BadRequestException('Adresse e-mail invalide', { field: 'email' });
    }
    const subscriber = await newsletterRepository.findOneBy({ email: safeEmail });
    if (subscriber && !subscriber.unsubscribed_at) {
      subscriber.unsubscribed_at = new Date();
      subscriber.is_confirmed = 0;
      subscriber.confirmation_token = null;
      await newsletterRepository.save(subscriber);
    }
    // Succès générique — ne jamais révéler si l'e-mail existait.
    return { ok: true };
  };

  // ──────────────────────────────────────────────────────────
  // Méthodes ADMIN — protégées par isAuthenticated en amont.
  // NewsletterSubscriber.toJSON() retire confirmation_token de chaque
  // réponse afin que le secret ne fuie jamais.
  // ──────────────────────────────────────────────────────────

  /** Liste paginée des abonnés, les plus récents d'abord. */
  listPaginated = async ({ page = 1, perPage = 20 } = {}) => {
    const safePage = Math.max(1, Number(page) || 1);
    const safePerPage = Math.min(100, Math.max(1, Number(perPage) || 20));
    return newsletterRepository.findPaginated({ page: safePage, perPage: safePerPage });
  };

  /** Supprime définitivement un abonné (droit à l'oubli RGPD). */
  remove = async (id) => {
    const deleted = await newsletterRepository.delete(id);
    if (!deleted) throw new NotFoundException('Abonné introuvable');
  };

  /**
   * Export complet des abonnés pour l'export CSV admin. Les plus récents
   * d'abord, même ordre que la liste paginée. Le plafond est intentionnel
   * — si la table dépasse un jour les 10 000 lignes, une logique d'export
   * en streaming devrait remplacer ceci.
   */
  exportAll = async () => newsletterRepository.findAllOrdered();
}

export const newsletterService = new NewsletterService();
