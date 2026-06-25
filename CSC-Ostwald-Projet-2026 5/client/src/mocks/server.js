// ============================================================
// server.js — Bootstrap MSW pour les tests (environnement Node)
//
// Pendant le développement, MSW utilise un Service Worker (cf. browser.js).
// En tests Vitest, on n'a pas de SW → on utilise `setupServer` de `msw/node`
// qui patch `globalThis.fetch` directement.
//
// Importé par `src/test/setup.js`. Les mêmes `handlers` sont partagés
// entre dev (SW) et tests (Node), ce qui garantit que les attentes
// d'API testées correspondent à ce que voit l'app en dev.
// ============================================================
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
export const server = setupServer(...handlers);
