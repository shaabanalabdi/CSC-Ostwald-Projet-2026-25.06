// ============================================================
// MessageService.js — Logique métier du formulaire de contact.
//
// Valide les six mêmes champs que le schéma Zod du frontend
// (client/src/features/contact/schemas/contact.schema.js), puis persiste.
// Le frontend retire `rgpdConsent` avant d'envoyer — c'est une barrière
// UX, pas une donnée stockée — donc ce service ne doit pas l'attendre.
// ============================================================

import { messageRepository } from '../repository/MessageRepository.js';
import { Message } from '../entity/Message.js';
import { Validator } from '../utils/Validator.js';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '../error/HttpException.js';

/**
 * Limites de longueur / format des champs — maintenues synchronisées avec
 * le schéma Zod du frontend. Les centraliser ici facilite l'audit du
 * contrat quand le schéma évolue.
 */
export const LIMITS = {
  prenom: { min: 2, max: 80 },
  nom: { min: 2, max: 80 },
  email: { max: 100 },
  telephone: { max: 20 },
  message: { min: 10, max: 1000 },
};

class MessageService {
  /**
   * Persiste une soumission du formulaire de contact.
   *
   * @param {object} payload - { prenom, nom, email, telephone?, sujet, message }
   * @returns {Promise<{ id: number }>} — réponse minimale correspondant à
   *                                       l'interface `ContactResponse` du frontend.
   * @throws {BadRequestException}            valeur d'enum `sujet` invalide
   * @throws {UnprocessableEntityException}   un ou plusieurs champs échouent à la validation
   *                                          (porte les détails par champ)
   */
  submit = async (payload) => {
    const errors = {};

    const prenom = String(payload?.prenom ?? '').trim();
    if (prenom.length < LIMITS.prenom.min || prenom.length > LIMITS.prenom.max) {
      errors.prenom = `Le prénom doit faire entre ${LIMITS.prenom.min} et ${LIMITS.prenom.max} caractères`;
    }

    const nom = String(payload?.nom ?? '').trim();
    if (nom.length < LIMITS.nom.min || nom.length > LIMITS.nom.max) {
      errors.nom = `Le nom doit faire entre ${LIMITS.nom.min} et ${LIMITS.nom.max} caractères`;
    }

    const email = String(payload?.email ?? '')
      .trim()
      .toLowerCase();
    if (!Validator.isEmail(email) || email.length > LIMITS.email.max) {
      errors.email = 'Adresse e-mail invalide';
    }

    // Le téléphone est OPTIONNEL — le frontend envoie une chaîne vide
    // quand il n'est pas renseigné. Accepte '' OU un téléphone français
    // valide. Rejette toute autre valeur malformée.
    const telephoneRaw = String(payload?.telephone ?? '').trim();
    const telephone = telephoneRaw === '' ? null : telephoneRaw;
    if (telephone !== null && !Validator.isPhoneFR(telephone)) {
      errors.telephone = 'Numéro de téléphone invalide (format français attendu)';
    }
    if (telephone !== null && telephone.length > LIMITS.telephone.max) {
      errors.telephone = `Le téléphone ne doit pas dépasser ${LIMITS.telephone.max} caractères`;
    }

    const sujet = String(payload?.sujet ?? '');
    if (!Validator.isContactSubject(sujet)) {
      // Enum invalide → 400 (erreur client, pas une validation à proprement parler).
      throw new BadRequestException(
        `Sujet invalide. Valeurs autorisées : ${Validator.CONTACT_SUBJECTS.join(', ')}`,
        { field: 'sujet' },
      );
    }

    const messageBody = String(payload?.message ?? '').trim();
    if (messageBody.length < LIMITS.message.min || messageBody.length > LIMITS.message.max) {
      errors.message = `Le message doit faire entre ${LIMITS.message.min} et ${LIMITS.message.max} caractères`;
    }

    if (Object.keys(errors).length > 0) {
      throw new UnprocessableEntityException('Validation échouée', { fields: errors });
    }

    const row = new Message({
      prenom,
      nom,
      email,
      telephone, // null quand non fourni
      sujet,
      message: messageBody,
      is_read: 0,
    });

    await messageRepository.save(row);

    // Réponse minimale — correspond à l'interface ContactResponse du frontend.
    return { id: row.id };
  };

  // ──────────────────────────────────────────────────────────
  // Méthodes ADMIN — toutes protégées par isAuthenticated en amont.
  // ──────────────────────────────────────────────────────────

  /**
   * Liste paginée des messages, les plus récents d'abord. Utilisée par le
   * dashboard admin.
   * @param {{ page?: number, perPage?: number }} opts
   */
  listPaginated = async ({ page = 1, perPage = 20 } = {}) => {
    const safePage = Math.max(1, Number(page) || 1);
    const safePerPage = Math.min(100, Math.max(1, Number(perPage) || 20));
    return messageRepository.findPaginated({ page: safePage, perPage: safePerPage });
  };

  /**
   * Recherche d'un message unique.
   * @throws {NotFoundException} quand l'id n'existe pas.
   */
  getOne = async (id) => {
    const message = await messageRepository.find(id);
    if (!message) throw new NotFoundException('Message introuvable');
    return message;
  };

  /**
   * Bascule is_read à 1. Idempotent — renvoie le message dans tous les cas.
   * @throws {NotFoundException} quand l'id n'existe pas.
   */
  markAsRead = async (id) => {
    const message = await this.getOne(id);
    if (message.is_read === 1) return message;
    message.is_read = 1;
    await messageRepository.save(message);
    return message;
  };

  /**
   * Supprime définitivement un message.
   * @throws {NotFoundException} quand l'id n'existe pas.
   */
  remove = async (id) => {
    const deleted = await messageRepository.delete(id);
    if (!deleted) throw new NotFoundException('Message introuvable');
  };

  /** Export complet des messages pour l'export CSV admin. Les plus récents d'abord. */
  exportAll = async () => messageRepository.findAllOrdered();
}

export const messageService = new MessageService();
