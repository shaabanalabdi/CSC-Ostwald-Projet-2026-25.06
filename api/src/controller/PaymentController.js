// ============================================================
// PaymentController.js — Couche HTTP du parcours de paiement HelloAsso.
//
// Trois endpoints publics (pas de isAuthenticated — les utilisateurs ne
// sont pas des admins) :
//   POST /api/payment/checkout       crée une inscription en attente + le checkout
//   GET  /api/payment/mock-success   callback mock réservé au dev (simule le webhook)
//   POST /api/payment/webhook        vrai webhook HelloAsso
// ============================================================

import { registrationService } from '../service/RegistrationService.js';
import { helloAssoService } from '../service/HelloAssoService.js';
import {
  HELLOASSO_IS_MOCK,
  HELLOASSO_RETURN_URL,
  HELLOASSO_CANCEL_URL,
  RETURN_URL_ALLOWED_ORIGINS,
} from '../config/helloasso.js';

/**
 * Valide une URL de redirection candidate contre la liste blanche
 * configurée. Renvoie la chaîne d'URL si elle est sûre, `null` sinon.
 * Protection contre l'open redirect : ne jamais laisser une entrée
 * utilisateur piloter un en-tête Location 30x.
 */
function safeReturnUrl(candidate) {
  if (typeof candidate !== 'string' || candidate.length === 0) return null;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!RETURN_URL_ALLOWED_ORIGINS.has(url.origin)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export class PaymentController {
  /**
   * POST /api/payment/checkout
   * Body: { prenom, nom, email, activity_id, amount_cents }
   * 200 → { checkoutUrl, registrationId }
   * 404 → l'activité n'existe pas
   * 400 → mauvais type d'activité / non publiée
   * 422 → erreurs de validation au niveau des champs
   */
  static checkout = async (req, res) => {
    // 1. Crée D'ABORD l'inscription en attente dans notre DB. Si quoi que
    //    ce soit d'autre échoue, on garde un enregistrement qu'on peut
    //    inspecter / nettoyer.
    const registration = await registrationService.createPendingRegistration(req.body);

    // 2. Demande à HelloAsso (ou à son mock) une URL de checkout.
    const activityTitle =
      typeof req.body?.activity_title === 'string' ? req.body.activity_title : '';
    const { checkoutUrl, transactionRef } = await helloAssoService.createCheckout({
      registrationId: registration.id,
      amountCents: registration.amount_cents,
      email: registration.email,
      firstName: registration.prenom,
      lastName: registration.nom,
      activityTitle,
    });

    // 3. Attache la référence pour que le webhook puisse réconcilier plus tard.
    await registrationService.attachTransactionRef(registration.id, transactionRef);

    return res.status(200).json({
      checkoutUrl,
      registrationId: registration.id,
    });
  };

  /**
   * GET /api/payment/mock-success?reg_id=…&return=…
   * Remplaçant réservé au dev du vrai parcours HelloAsso → webhook.
   * Quand HELLOASSO_MODE=real, cette route renvoie 404 pour faire
   * remonter une mauvaise configuration.
   *
   * Comportement en mode mock :
   *   1. Marque l'inscription comme payée (sans vérifier de signature —
   *      cela ne tourne qu'en local pendant le dev).
   *   2. Redirige le navigateur vers l'URL `return` pour que
   *      l'utilisateur atterrisse sur la page de succès du frontend
   *      exactement comme il le ferait en prod.
   */
  static mockSuccess = async (req, res) => {
    if (!HELLOASSO_IS_MOCK) {
      return res.status(404).json({
        message:
          'mock-success is only available when HELLOASSO_MODE=mock (dev). Did you forget to switch to real webhooks?',
      });
    }

    const regId = parseInt(String(req.query.reg_id ?? ''), 10);
    if (!Number.isInteger(regId) || regId < 1) {
      return res.status(400).json({ message: 'reg_id invalide' });
    }

    // Simule le webhook : marque payée par la référence de transaction synthétique.
    try {
      await registrationService.markPaidByTransactionId(`mock-${regId}`, 0);
    } catch {
      // Même si la ligne a disparu ou est déjà payée, rediriger quand
      // même — l'URL de l'utilisateur est la source de vérité du
      // parcours UX.
    }

    // Protection contre l'open redirect : le paramètre de requête `return`
    // provient d'une URL que l'utilisateur peut éditer. Rejette tout ce
    // qui sort des origines en liste blanche (HELLOASSO_RETURN_URL /
    // HELLOASSO_CANCEL_URL configurées) et retombe sur l'URL de retour
    // configurée pour que l'UX se termine proprement.
    const returnUrl = safeReturnUrl(req.query.return) ?? HELLOASSO_RETURN_URL;
    return res.redirect(302, returnUrl);
  };

  /**
   * POST /api/payment/webhook — Callback du webhook HelloAsso.
   *
   * server.js monte `express.raw({ type: 'application/json' })` pour
   * cette route AVANT le `express.json()` global, donc `req.body` est un
   * `Buffer` (les octets JSON bruts envoyés par HelloAsso). On calcule le
   * HMAC sur ce buffer, puis on le parse manuellement.
   *
   * Le mode mock renvoie 404 — HelloAsso n'appelle jamais un backend
   * mock ; le parcours mock utilise GET /api/payment/mock-success.
   *
   * Contrat du mode réel :
   *   1. Vérifier l'en-tête `X-HelloAsso-Signature` (HMAC-SHA256 sur le corps brut).
   *   2. Parser l'événement. Pour les événements `Order` avec
   *      `payments[].state === "Authorized"` (ou équivalent), appeler
   *      markPaidByTransactionId.
   *   3. Toujours renvoyer 200 rapidement — HelloAsso réessaie sur 4xx/5xx,
   *      donc tout travail lent doit être différé vers une file. Les échecs
   *      de signature renvoient 401 (on veut que HelloAsso ARRÊTE de
   *      réessayer un événement malformé/forgé).
   */
  static webhook = async (req, res) => {
    if (HELLOASSO_IS_MOCK) {
      return res.status(404).json({
        message:
          'Webhook /api/payment/webhook is only used in HELLOASSO_MODE=real. In mock mode use /api/payment/mock-success.',
      });
    }

    // 1. Vérification de signature sur le buffer du corps BRUT.
    const signature = req.get('X-HelloAsso-Signature');
    const rawBody = req.body; // Buffer grâce au montage express.raw() dans server.js.
    const valid = helloAssoService.verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      // Ne pas renvoyer pourquoi — les attaquants ne doivent pas savoir si
      // c'était l'en-tête ou le corps qui était erroné. HelloAsso utilise
      // le 401 pour arrêter les tentatives.
      return res.status(401).json({ message: 'Signature webhook invalide' });
    }

    // 2. Parse le corps maintenant qu'on lui fait confiance.
    let event;
    try {
      event = JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody));
    } catch {
      return res.status(400).json({ message: 'Corps webhook non-JSON' });
    }

    // 3. Extrait la transactionRef + le montant selon la forme de
    //    l'événement HelloAsso. HelloAsso émet plusieurs types
    //    d'événements (Order, Payment, Form). On ne s'intéresse qu'aux
    //    paiements réussis ici. Parsing défensif — les formes inconnues
    //    sont 200-OK pour que HelloAsso ne réessaie pas indéfiniment.
    try {
      const eventType = event?.eventType ?? event?.type;
      const data = event?.data ?? event;

      // Les formes de paiement réussi varient selon l'intégration ;
      // couvrir celles documentées :
      //   - data.payments[].state === 'Authorized' sur un événement Order
      //   - data.state === 'Authorized' sur un événement Payment
      const payments = Array.isArray(data?.payments) ? data.payments : [];
      const authorizedPayment =
        payments.find((p) => p?.state === 'Authorized') ??
        (data?.state === 'Authorized' ? data : null);

      if (authorizedPayment) {
        const transactionRef = String(
          data?.checkoutIntentId ?? authorizedPayment?.id ?? data?.id ?? '',
        );
        const amountCents = Number(authorizedPayment?.amount ?? data?.amount ?? 0);
        if (transactionRef) {
          await registrationService.markPaidByTransactionId(transactionRef, amountCents);
        }
      }
      // Pour les événements hors paiement (Refund, Form, ...) on accuse
      // réception sans action.
      console.info(`[webhook] processed event type=${eventType ?? 'unknown'}`);
    } catch (err) {
      // Avale les erreurs de traitement avec un 200 — HelloAsso ne doit
      // pas réessayer indéfiniment sur nos bugs. On journalise pour
      // pouvoir enquêter.
      console.error('[webhook] processing error:', err);
    }

    return res.status(200).json({ received: true });
  };

  /**
   * GET /api/payment/return-urls — expose les URLs de retour configurées.
   * Le frontend les lit pour savoir où envoyer l'utilisateur en cas de
   * succès ou d'annulation, au lieu de les coder en dur.
   * (Public — ce ne sont pas des secrets, juste de la config dont le
   * client a besoin.)
   */
  static returnUrls = async (req, res) => {
    return res.status(200).json({
      returnUrl: HELLOASSO_RETURN_URL,
      cancelUrl: HELLOASSO_CANCEL_URL,
      mode: HELLOASSO_IS_MOCK ? 'mock' : 'real',
    });
  };
}
