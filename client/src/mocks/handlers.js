// ============================================================
// handlers.js — Handlers MSW pour le développement
//
// Intercepte les appels `/api/*` AVANT qu'ils n'atteignent le réseau,
// et renvoie des réponses fake qui matchent le contrat du futur backend
// (Node + Express + MySQL).
//
// Activé UNIQUEMENT en dev (cf. browser.js). En production, ces handlers
// ne sont pas chargés et les requêtes vont vers le vrai backend.
//
// ─── Comportements simulés ────────────────────────────────────
//   - Délai artificiel 300 ms (réalisme réseau, sans bloquer le dev)
//   - Email contenant "fail" → 400 (utile pour tester la branche d'erreur)
//   - Sinon : 201 Created avec un id incrémental
// ============================================================
import { http, HttpResponse, delay } from 'msw';
// Compteur d'ID partagé entre tous les endpoints (suffit pour la démo).
// Réinitialisé à chaque reload de la page.
let nextId = 1;
const NETWORK_DELAY_MS = 300;
/** Helper : génère une erreur de validation 400 sur un champ donné. */
const validationError = (field, message) => HttpResponse.json({ message, field }, { status: 400 });
export const handlers = [
  // ──────────────────────────────────────────────────────────
  // POST /api/newsletter — inscription à la newsletter
  // ──────────────────────────────────────────────────────────
  http.post('/api/newsletter', async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const body = await request.json();
    if (typeof body.email !== 'string') {
      return validationError('email', 'Email manquant');
    }
    // Branche d'erreur déclenchable depuis l'UI pour tester onError
    if (body.email.toLowerCase().includes('fail')) {
      return validationError('email', 'Cet email est déjà inscrit (mock)');
    }
    return HttpResponse.json(
      { id: nextId++, email: body.email, subscribed_at: new Date().toISOString() },
      { status: 201 }
    );
  }),
  // ──────────────────────────────────────────────────────────
  // POST /api/contact — message via formulaire de contact
  // ──────────────────────────────────────────────────────────
  http.post('/api/contact', async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const body = await request.json();
    if (typeof body.email === 'string' && body.email.toLowerCase().includes('fail')) {
      return validationError('email', 'Email invalide (mock)');
    }
    return HttpResponse.json({ id: nextId++ }, { status: 201 });
  }),
  // ──────────────────────────────────────────────────────────
  // POST /api/benevole — candidature bénévole
  // ──────────────────────────────────────────────────────────
  http.post('/api/benevole', async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const body = await request.json();
    if (typeof body.email === 'string' && body.email.toLowerCase().includes('fail')) {
      return validationError('email', 'Candidature déjà existante pour cet email (mock)');
    }
    return HttpResponse.json({ id: nextId++ }, { status: 201 });
  }),
];
