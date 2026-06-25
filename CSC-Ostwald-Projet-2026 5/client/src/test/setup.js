// ============================================================
// setup.js — Configuration globale Vitest (chargée avant chaque suite)
//
// Référencée dans vitest.config.js via `test.setupFiles`.
// Doit rester légère : on n'initialise QUE ce qui est strictement
// transversal (matchers, MSW server, cleanup React).
// ============================================================
import { afterAll, afterEach, beforeAll } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { server } from '../mocks/server';
import i18n from '../i18n';
// ─── i18n ──────────────────────────────────────────────────────
// Force le français en tests. Sans ça, le détecteur i18n inspecte
// `navigator.language` (= 'en-US' dans jsdom) et bascule en EN, ce qui
// fait diverger les assertions textuelles des composants de la prod.
// La langue est le français pour 99% des utilisateurs réels du CSC.
beforeAll(() => {
  void i18n.changeLanguage('fr');
});
// ─── MSW server ────────────────────────────────────────────────
// `onUnhandledRequest: 'error'` : en tests, on veut un signal LOUD
// si un appel HTTP non mocké tombe (≠ dev où on bypass silencieux).
// Force les tests à déclarer leurs handlers ou à hériter des handlers.js.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
// Reset entre chaque test : annule les `server.use(...)` ad hoc afin
// qu'un test n'affecte pas l'isolation des suivants.
afterEach(() => {
  server.resetHandlers();
  // Unmount tous les composants React montés avec @testing-library/react
  // (cleanup auto avec React 18+ mais explicite ici pour clarté).
  cleanup();
});
// Tear down propre du worker à la fin du run complet.
afterAll(() => server.close());
