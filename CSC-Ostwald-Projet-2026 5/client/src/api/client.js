// ============================================================
// client.js — Wrapper minimal autour de `fetch` pour appeler le backend
//
// Pourquoi un wrapper et pas `fetch` direct dans chaque hook :
//   1. `fetch` ne throw PAS sur 4xx/5xx — il faut tester `res.ok` manuellement,
//      sinon React Query croit que la requête a réussi et n'appelle pas onError.
//   2. Centraliser le préfixe `/api`, les headers JSON, et la sérialisation.
//   3. Typer les réponses (TResponse) et les corps (TBody) côté appel.
//   4. Wrapper l'erreur dans une `ApiError` qui transporte le `status` HTTP
//      et le payload renvoyé par le serveur (utile pour les détails Zod).
// ============================================================
/** Base URL des appels API. Override possible via `.env` ⇒ VITE_API_BASE_URL. */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
/**
 * Résout une URL d'asset statique (ex. un `/uploads/<hash>.webp` renvoyé
 * par l'endpoint d'upload admin) vers quelque chose que le navigateur
 * peut réellement récupérer — même quand le frontend et l'API vivent sur
 * des origines différentes.
 *
 * Règles :
 *   - Vide/null → chaîne vide (l'appelant gère le cas « pas d'image »).
 *   - URL http(s) absolue → renvoyée inchangée.
 *   - Chemin commençant par `/uploads/` → préfixé par l'origine de l'API
 *     (dérivée de VITE_API_BASE_URL en retirant le suffixe `/api`).
 *   - Tout le reste (ex. `/documents/foo.pdf` servi depuis public/,
 *     `/assets/...` du build Vite) → renvoyé inchangé.
 *
 * En dev (pas de VITE_API_BASE_URL, Vite proxifie `/api` et `/uploads`
 * vers localhost:3001) et en prod via les réécritures Vercel, la fonction
 * est en pratique un no-op — son seul rôle est de faire le pont avec la
 * configuration cross-origin qui survient quand VITE_API_BASE_URL pointe
 * vers un hôte distant.
 */
export function resolveStaticUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (!url.startsWith('/uploads/')) return url;
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');
  return origin + url;
}
/**
 * Erreur lancée par `apiPost` (ou tout autre verbe) quand `res.ok` est `false`.
 * Permet aux consommateurs (React Query, UI) de discriminer client/serveur
 * et d'accéder au payload structuré renvoyé par le backend (ex: erreurs de
 * validation par champ).
 */
export class ApiError extends Error {
  status;
  payload;
  name = 'ApiError';
  constructor(
    /** Code HTTP retourné par le serveur (400, 422, 500, etc.). */
    status,
    /** Message human-readable — soit `payload.message`, soit le statusText HTTP. */
    message,
    /** Payload brut renvoyé par le serveur (utile pour les détails de validation). */
    payload
  ) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}
/** Type guard utile dans les `onError` de React Query. */
export const isApiError = (e) => e instanceof ApiError;

/**
 * Lit le token CSRF émis par le backend à la connexion. Le cookie n'est
 * intentionnellement PAS HttpOnly pour que le frontend légitime puisse le
 * lire via `document.cookie` — voir `api/src/middleware/csrfProtection.js`
 * pour le motif double-submit complet. Une page cross-origin malveillante
 * aurait le cookie attaché automatiquement par le navigateur MAIS ne peut
 * pas le lire (same-origin policy), donc elle ne peut pas reproduire cet
 * en-tête.
 */
export function readCsrfToken() {
  if (typeof document === 'undefined') return ''; // garde SSR / test unitaire
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

/**
 * En-têtes à attacher à TOUT appel modifiant l'état de l'API admin — y
 * compris l'endpoint d'upload multipart qui ne peut pas passer par
 * `apiPost` car celui-ci envoie du JSON. Renvoie `{}` (pas undefined)
 * quand il n'y a pas de token pour que les appelants puissent le spread
 * sans condition.
 */
export function getCsrfHeaders() {
  const token = readCsrfToken();
  return token ? { 'X-CSRF-Token': token } : {};
}

/**
 * En-têtes à attacher aux requêtes modifiant l'état. Les routes admin du
 * backend comparent `X-CSRF-Token` au cookie `csrf_token` ; les endpoints
 * publics (newsletter / contact / benevole / payment-checkout) ignorent
 * l'en-tête mais l'accepter ne coûte rien.
 *
 * Alias interne de `getCsrfHeaders` pour garder les sites d'appel
 * apiPost/Patch/Delete inchangés.
 */
const csrfHeaders = getCsrfHeaders;
/**
 * Parse la réponse en JSON tolérant : un 204 No Content renvoie une string
 * vide qu'on convertit en undefined (sinon `JSON.parse('')` throw).
 * Si la réponse n'est pas 2xx, lève une `ApiError` portant le statut + payload.
 */
async function parseResponse(res) {
  const text = await res.text();
  let payload = undefined;
  if (text.length > 0) {
    try {
      payload = JSON.parse(text);
    } catch {
      // Pas de JSON parseable → on garde `payload = undefined`.
    }
  }
  if (!res.ok) {
    const message =
      (typeof payload === 'object' &&
        payload !== null &&
        'message' in payload &&
        typeof payload.message === 'string' &&
        payload.message) ||
      res.statusText ||
      `HTTP ${res.status}`;
    throw new ApiError(res.status, message, payload);
  }
  return payload;
}
/**
 * Exécute un POST JSON et renvoie la réponse parsée.
 *
 * @template TBody      Type du corps de requête envoyé (sérialisé en JSON).
 * @template TResponse  Type de la réponse parsée renvoyée par le serveur.
 *
 * @throws  `ApiError` si la réponse a un statut non-2xx OU si le serveur
 *          ne renvoie pas de JSON valide.
 */
export async function apiPost(
  /** Chemin relatif à `API_BASE_URL`, commence toujours par `/` (ex: '/newsletter'). */
  path,
  body,
  /** Options additionnelles (signal AbortController, headers custom…). */
  init
) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...csrfHeaders(),
      ...init?.headers,
    },
    body: JSON.stringify(body),
    // `include` envoie/reçoit le cookie HTTPOnly de la session admin.
    // Le backend (cors({credentials: true})) restreint déjà aux origines
    // autorisées — pas de fuite cross-origin.
    credentials: 'include',
  });
  return parseResponse(res);
}
/**
 * Exécute un GET et renvoie la réponse parsée. Mêmes garanties que `apiPost`.
 *
 * @template TResponse  Type de la réponse parsée renvoyée par le serveur.
 */
export async function apiGet(
  /** Chemin relatif à `API_BASE_URL`, commence toujours par `/`. */
  path,
  init
) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
    credentials: 'include',
  });
  return parseResponse(res);
}
/**
 * Exécute un PATCH JSON. Pour les mises à jour partielles (ex: marquer un
 * message comme lu). Body optionnel — passer `undefined` envoie une requête
 * sans payload, utile quand l'opération est encodée dans l'URL.
 */
export async function apiPatch(path, body, init) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...csrfHeaders(),
      ...init?.headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  return parseResponse(res);
}
/**
 * Exécute un DELETE. La réponse est typiquement un 204 No Content, donc
 * `TResponse = void` est l'usage courant.
 */
export async function apiDelete(path, init) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...csrfHeaders(),
      ...init?.headers,
    },
    credentials: 'include',
  });
  return parseResponse(res);
}
/**
 * Récupère un fichier CSV depuis les endpoints d'export admin et
 * déclenche un téléchargement navigateur. Passe par `fetch` (et non un
 * simple `<a href>`) pour pouvoir envoyer le cookie JWT admin avec
 * `credentials: 'include'` et faire remonter les erreurs API via le même
 * canal `ApiError` que le reste du client.
 *
 * @param path     Chemin de l'endpoint (ex. `/admin/newsletter/export.csv`).
 * @param filename Nom de fichier suggéré pour le fichier sauvegardé. Le
 *                 navigateur peut quand même le surcharger depuis
 *                 l'en-tête `Content-Disposition` du serveur — les deux
 *                 sont posés pour que chaque côté l'emporte proprement.
 */
export async function downloadCsv(path, filename) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: { Accept: 'text/csv' },
    credentials: 'include',
  });
  if (!res.ok) {
    // Tente de faire remonter le `message` JSON renvoyé par le serveur,
    // retombe sur statusText. Cela reflète `parseResponse` pour les
    // non-2xx mais pour les payloads binaires on ne peut pas le réutiliser
    // directement.
    let message = res.statusText || `HTTP ${res.status}`;
    try {
      const payload = await res.json();
      if (typeof payload.message === 'string') message = payload.message;
    } catch {
      // Le corps n'était pas du JSON — on garde le repli sur statusText.
    }
    throw new ApiError(res.status, message);
  }
  const blob = await res.blob();
  // Astuce du clic sur ancre : fonctionne dans tous les navigateurs
  // modernes, aucune bibliothèque nécessaire, pas de bloqueurs de popup
  // (c'est un GET initié par l'utilisateur partant d'un clic).
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Libère l'URL du blob au tick suivant — Safari peut abandonner le
  // téléchargement si on révoque de façon synchrone avant que le clic
  // soit traité.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
