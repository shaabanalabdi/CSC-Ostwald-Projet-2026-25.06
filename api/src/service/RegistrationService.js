// ============================================================
// RegistrationService.js — Logique métier des inscriptions payantes.
//
// Le parcours public (createPendingRegistration + markPaidByTransactionId)
// et les méthodes admin (liste, statut, suppression, export) cohabitent
// ici. Le prix est TOUJOURS lu côté serveur depuis `activity.price_cents`
// — le montant fourni par le client est ignoré.
// ============================================================

import { registrationRepository } from '../repository/RegistrationRepository.js';
import { activityRepository } from '../repository/ActivityRepository.js';
import { Registration } from '../entity/Registration.js';
import { Validator } from '../utils/Validator.js';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '../error/HttpException.js';

const ALLOWED_STATUSES = ['pending', 'paid', 'refunded'];

class RegistrationService {
  /** Liste paginée avec le titre de l'activité joint (dashboard admin). */
  listPaginated = async ({ page = 1, perPage = 20 } = {}) => {
    const safePage = Math.max(1, Number(page) || 1);
    const safePerPage = Math.min(100, Math.max(1, Number(perPage) || 20));
    return registrationRepository.findPaginatedWithActivity({
      page: safePage,
      perPage: safePerPage,
    });
  };

  /** Recherche d'une inscription unique. */
  getOne = async (id) => {
    const registration = await registrationRepository.find(id);
    if (!registration) throw new NotFoundException('Inscription introuvable');
    return registration;
  };

  /**
   * L'admin remplace le statut du workflow. Utilisé pour les
   * remboursements manuels ou l'annulation quand HelloAsso n'est pas la
   * source de vérité (ex. un paiement en espèces sur place enregistré
   * après coup).
   */
  updateStatus = async (id, newStatus) => {
    if (!ALLOWED_STATUSES.includes(newStatus)) {
      throw new BadRequestException(
        `Statut invalide. Valeurs autorisées : ${ALLOWED_STATUSES.join(', ')}`,
        { field: 'status' },
      );
    }
    const reg = await this.getOne(id);
    if (reg.status === newStatus) return reg;
    reg.status = newStatus;
    await registrationRepository.save(reg);
    return reg;
  };

  /** Supprime définitivement une ligne d'inscription. */
  remove = async (id) => {
    const deleted = await registrationRepository.delete(id);
    if (!deleted) throw new NotFoundException('Inscription introuvable');
  };

  /**
   * Export complet des inscriptions avec le titre de l'activité joint.
   * Alimente l'export CSV admin. Les plus récentes d'abord.
   */
  exportAll = async () => registrationRepository.findAllOrderedWithActivity();

  // ──────────────────────────────────────────────────────────
  // Parcours de paiement PUBLIC — appelé par le PaymentController.
  // ──────────────────────────────────────────────────────────

  /**
   * Crée une inscription en attente (status='pending', pas encore d'id
   * de transaction). L'appelant demande ensuite une URL de checkout à
   * HelloAssoService et met à jour la ligne avec la référence de
   * transaction. Renvoie l'inscription sauvegardée.
   *
   * @throws {UnprocessableEntityException} erreurs de validation par champ.
   * @throws {NotFoundException} l'activité référencée n'existe pas.
   * @throws {BadRequestException} l'activité n'est pas une activité
   *                                Jeunesse ou n'est pas publiée.
   */
  createPendingRegistration = async (payload) => {
    const errors = {};

    const prenom = String(payload?.prenom ?? '').trim();
    if (prenom.length < 2 || prenom.length > 80) {
      errors.prenom = 'Le prénom doit faire entre 2 et 80 caractères';
    }

    const nom = String(payload?.nom ?? '').trim();
    if (nom.length < 2 || nom.length > 80) {
      errors.nom = 'Le nom doit faire entre 2 et 80 caractères';
    }

    const email = String(payload?.email ?? '')
      .trim()
      .toLowerCase();
    if (!Validator.isEmail(email)) {
      errors.email = 'Adresse e-mail invalide';
    }

    const activityId = parseInt(payload?.activity_id, 10);
    if (!Number.isInteger(activityId) || activityId < 1) {
      errors.activity_id = "Référence d'activité invalide";
    }

    // IMPORTANT : amount_cents fourni par le client est IGNORÉ. Le prix
    // est lu depuis `activity.price_cents` ci-dessous — sinon un
    // utilisateur pourrait payer 0,01 € pour un camp à 50 € en éditant
    // l'URL. Le champ n'est conservé dans le schéma du payload que pour
    // que le frontend puisse pré-afficher le prix ; il n'atteint jamais
    // HelloAsso.

    if (Object.keys(errors).length > 0) {
      throw new UnprocessableEntityException('Validation échouée', { fields: errors });
    }

    // L'activité doit exister, être de type Jeunesse, et être publiée.
    const activity = await activityRepository.find(activityId);
    if (!activity) {
      throw new NotFoundException('Activité introuvable');
    }
    if (activity.activity_type !== 'jeunesse') {
      throw new BadRequestException(
        "Seules les activités Jeunesse peuvent faire l'objet d'une inscription payante",
      );
    }
    if (activity.is_published !== 1) {
      throw new BadRequestException("Cette activité n'est pas ouverte aux inscriptions");
    }

    // Prix autoritaire serveur. `null` signifie que l'admin n'a pas
    // encore défini de prix — refuser de démarrer un checkout payant
    // dans cet état (l'admin doit renseigner `price_cents` d'abord, même
    // si c'est 0 pour une activité gratuite).
    if (activity.price_cents == null) {
      throw new BadRequestException(
        "Le prix de cette activité n'a pas été configuré par l'administration",
      );
    }
    const serverAmountCents = Number(activity.price_cents);
    if (!Number.isInteger(serverAmountCents) || serverAmountCents < 0) {
      throw new BadRequestException('Configuration de prix invalide pour cette activité');
    }

    // Dédoublonnage : refuser une deuxième inscription en attente pour le
    // même couple (activité, e-mail) — cause typique : un rafraîchissement
    // / double-clic pendant la redirection HelloAsso. La première ligne
    // en attente est réutilisée quand l'utilisateur réessaie depuis le
    // lien de confirmation par e-mail.
    const existingPending = await registrationRepository.findOneBy({
      activity_id: activityId,
      email,
      status: 'pending',
    });
    if (existingPending) {
      return existingPending;
    }

    const row = new Registration({
      activity_id: activityId,
      prenom,
      nom,
      email,
      amount_cents: serverAmountCents,
      status: 'pending',
      // helloasso_transaction_id défini plus tard par attachTransactionRef.
    });
    await registrationRepository.save(row);
    return row;
  };

  /**
   * Définit la référence de transaction renvoyée par
   * HelloAssoService.createCheckout. Étape séparée pour que l'appelant
   * puisse annuler l'inscription si la création du checkout échoue.
   */
  attachTransactionRef = async (registrationId, transactionRef) => {
    const reg = await this.getOne(registrationId);
    reg.helloasso_transaction_id = transactionRef;
    await registrationRepository.save(reg);
    return reg;
  };

  /**
   * Bascule une inscription en attente vers payée. Idempotent — les
   * webhooks peuvent être re-livrés, et cette méthode ne doit pas
   * double-débiter ni double-enregistrer.
   *
   * @returns {Promise<Registration>}
   * @throws {NotFoundException} aucune inscription avec cette référence de transaction.
   */
  markPaidByTransactionId = async (transactionRef, paidAmountCents) => {
    const reg = await registrationRepository.findByHelloAssoTransactionId(transactionRef);
    if (!reg) {
      throw new NotFoundException(`Aucune inscription avec la transaction ${transactionRef}`);
    }
    if (reg.status === 'paid') return reg; // idempotent — re-livraison du webhook
    reg.status = 'paid';
    if (Number.isInteger(paidAmountCents) && paidAmountCents > 0) {
      reg.amount_cents = paidAmountCents; // faire confiance au webhook plutôt qu'à l'intent
    }
    await registrationRepository.save(reg);
    return reg;
  };
}

export const registrationService = new RegistrationService();
