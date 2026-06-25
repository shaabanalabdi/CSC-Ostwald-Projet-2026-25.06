// ============================================================
// HelloAssoService.js — Abstraction au-dessus de l'API Checkout HelloAsso.
//
// Deux modes (sélectionnés via la variable d'env HELLOASSO_MODE) :
//   1. mock   — renvoie une URL locale pointant vers GET /api/payment/mock-success
//               afin que tout le parcours d'inscription puisse être
//               exercé en dev sans compte HelloAsso réel.
//   2. real   — appelle l'API HelloAsso (OAuth + initialisation du
//               Checkout). L'implémentation effectue l'appel OAuth puis
//               crée un checkout-intent.
//
// L'interface publique reste identique dans les deux modes : l'appelant
// (le PaymentController) passe un enregistrement d'inscription et reçoit
// en retour une URL vers laquelle rediriger l'utilisateur.
// ============================================================

import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  HELLOASSO_BASE_URL,
  HELLOASSO_CANCEL_URL,
  HELLOASSO_CLIENT_ID,
  HELLOASSO_CLIENT_SECRET,
  HELLOASSO_IS_MOCK,
  HELLOASSO_ORG_SLUG,
  HELLOASSO_RETURN_URL,
  HELLOASSO_WEBHOOK_SECRET,
} from '../config/helloasso.js';

/** Cache au niveau du module pour le token d'accès OAuth HelloAsso. */
let _tokenCache = { token: null, expiresAt: 0 };

/** Rafraîchit les tokens 60 s en avance pour qu'un checkout en cours ne course jamais l'expiration. */
const TOKEN_SKEW_MS = 60 * 1000;

/**
 * Helper réservé aux tests pour vider le cache de token du module. Le
 * code de production ne l'importe jamais ; les tests vitest l'utilisent
 * dans `beforeEach` pour garder les tests hermétiques. Préfixé par `__`
 * pour décourager une utilisation hors test.
 */
export function __resetTokenCacheForTests() {
  _tokenCache = { token: null, expiresAt: 0 };
}

class HelloAssoService {
  /**
   * Crée une session de checkout pour une inscription en attente.
   *
   * @param {object} params
   * @param {number} params.registrationId  - id de ligne dans la table `registration`
   * @param {number} params.amountCents
   * @param {string} params.email
   * @param {string} params.firstName
   * @param {string} params.lastName
   * @param {string} params.activityTitle
   * @returns {Promise<{ checkoutUrl: string, transactionRef: string }>}
   *   - `checkoutUrl`  : URL vers laquelle rediriger l'utilisateur (HelloAsso ou mock).
   *   - `transactionRef`: identifiant que le webhook utilisera pour la
   *      réconciliation — en mode réel c'est le `checkoutIntentId` de
   *      HelloAsso ; en mode mock on synthétise `mock-{registrationId}`
   *      pour que la route mock-success retrouve la bonne ligne.
   */
  createCheckout = async (params) => {
    if (HELLOASSO_IS_MOCK) {
      return this._createMockCheckout(params);
    }
    return this._createRealCheckout(params);
  };

  /**
   * Vérifie une signature de webhook HelloAsso. En mode mock, accepte
   * tout (l'appelant est la route locale mock-success, aucune signature
   * en jeu). En mode réel, calcule un HMAC-SHA256 sur le corps brut avec
   * le secret partagé et le compare à l'en-tête `X-HelloAsso-Signature`
   * en temps constant.
   *
   * @param {Buffer|string} rawBody          - Corps de requête brut AVANT le parsing JSON.
   *                                            Server.js monte `express.raw()` pour la
   *                                            route webhook, donc `req.body` est un Buffer ici.
   * @param {string|undefined} signatureHeader - Valeur de `X-HelloAsso-Signature`. Peut
   *                                              arriver préfixée (ex. `sha256=<hex>`) ; on
   *                                              accepte les formes hex brute et préfixée.
   * @returns {boolean} true quand la signature est valide.
   */
  verifyWebhookSignature = (rawBody, signatureHeader) => {
    if (HELLOASSO_IS_MOCK) return true;

    if (!HELLOASSO_WEBHOOK_SECRET) {
      // env.js échoue déjà immédiatement en prod-réel, donc arriver ici
      // signifie un environnement non-prod mal configuré. Refuser plutôt
      // que de laisser passer silencieusement.
      return false;
    }
    if (!rawBody || !signatureHeader || typeof signatureHeader !== 'string') {
      return false;
    }

    // Normalise : accepte soit `sha256=<hex>`, soit `<hex>`.
    const provided = signatureHeader.startsWith('sha256=')
      ? signatureHeader.slice('sha256='.length)
      : signatureHeader;

    const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
    const expected = createHmac('sha256', HELLOASSO_WEBHOOK_SECRET)
      .update(bodyBuffer)
      .digest('hex');

    // Comparaison en temps constant — les deux buffers doivent d'abord
    // avoir la même longueur.
    let providedBuf;
    let expectedBuf;
    try {
      providedBuf = Buffer.from(provided, 'hex');
      expectedBuf = Buffer.from(expected, 'hex');
    } catch {
      return false;
    }
    if (providedBuf.length !== expectedBuf.length) return false;
    try {
      return timingSafeEqual(providedBuf, expectedBuf);
    } catch {
      return false;
    }
  };

  // ──────────────────────────────────────────────────────────
  // Implémentation mock — entièrement locale, aucun appel externe.
  // ──────────────────────────────────────────────────────────

  _createMockCheckout = async ({ registrationId }) => {
    // Réutilise la même URL de retour que le parcours réel (chemin de
    // succès) pour que l'utilisateur atterrisse au même endroit dans les
    // deux cas.
    const params = new URLSearchParams({
      reg_id: String(registrationId),
      return: HELLOASSO_RETURN_URL,
    });
    return {
      checkoutUrl: `/api/payment/mock-success?${params.toString()}`,
      transactionRef: `mock-${registrationId}`,
    };
  };

  // ──────────────────────────────────────────────────────────
  // Implémentation réelle — OAuth + checkout-intents HelloAsso.
  // ──────────────────────────────────────────────────────────

  /**
   * Récupère (et met en cache) un token d'accès OAuth HelloAsso. L'API
   * émet des tokens à durée de vie courte (~30 min) — on met en cache
   * jusqu'à 60 s avant l'expiration.
   */
  _getAccessToken = async () => {
    const now = Date.now();
    if (_tokenCache.token && _tokenCache.expiresAt > now + TOKEN_SKEW_MS) {
      return _tokenCache.token;
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: HELLOASSO_CLIENT_ID,
      client_secret: HELLOASSO_CLIENT_SECRET,
    });
    const res = await fetch(`${HELLOASSO_BASE_URL}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HelloAsso OAuth failed (${res.status}): ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    // HelloAsso renvoie { access_token, token_type, expires_in } où
    // expires_in est en secondes.
    const ttlMs = Number(json?.expires_in ?? 1800) * 1000;
    _tokenCache = {
      token: String(json.access_token),
      expiresAt: now + ttlMs,
    };
    return _tokenCache.token;
  };

  /**
   * Création réelle d'un checkout HelloAsso.
   * 1. Obtenir le token OAuth (mis en cache).
   * 2. POST /v5/organizations/{slug}/checkout-intents avec payeur + montant.
   * 3. Renvoyer la redirectUrl + l'id du checkoutIntent (utilisé comme transactionRef).
   *
   * Les erreurs remontent comme une Error simple → l'errorHandler en
   * amont la mappe vers un 500 avec un message générique. On NE divulgue
   * PAS le corps de réponse de HelloAsso au client (il peut révéler des
   * identifiants ou un état interne).
   */
  _createRealCheckout = async ({
    registrationId,
    amountCents,
    email,
    firstName,
    lastName,
    activityTitle,
  }) => {
    const token = await this._getAccessToken();

    const payload = {
      totalAmount: amountCents,
      initialAmount: amountCents,
      itemName: activityTitle || `Inscription #${registrationId}`,
      backUrl: HELLOASSO_RETURN_URL,
      errorUrl: HELLOASSO_CANCEL_URL,
      returnUrl: HELLOASSO_RETURN_URL,
      // Id d'inscription embarqué dans les métadonnées pour que le webhook
      // puisse réconcilier même si la forme de l'id de checkout intent de
      // HelloAsso change un jour.
      metadata: { registrationId: String(registrationId) },
      containsDonation: false,
      payer: {
        firstName,
        lastName,
        email,
      },
    };

    const res = await fetch(
      `${HELLOASSO_BASE_URL}/v5/organizations/${encodeURIComponent(HELLOASSO_ORG_SLUG)}/checkout-intents`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      // Log la réponse complète côté serveur pour le débogage ; lève une
      // erreur générique pour que l'errorHandler en amont produise un
      // 500 propre.
      const text = await res.text().catch(() => '');
      console.error(
        `[HelloAsso] checkout-intents failed (${res.status}) for reg=${registrationId}: ${text.slice(0, 500)}`,
      );
      throw new Error('HelloAsso checkout creation failed');
    }

    const json = await res.json();
    const checkoutUrl = json?.redirectUrl;
    const transactionRef = String(json?.id ?? '');
    if (!checkoutUrl || !transactionRef) {
      console.error(`[HelloAsso] unexpected checkout response for reg=${registrationId}:`, json);
      throw new Error('HelloAsso checkout creation returned an unexpected shape');
    }

    return { checkoutUrl, transactionRef };
  };
}

export const helloAssoService = new HelloAssoService();
