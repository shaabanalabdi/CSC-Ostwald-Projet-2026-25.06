// ============================================================
// browser.js — Bootstrap du Service Worker MSW
//
// Importé UNIQUEMENT en dev (cf. main.jsx, garde `import.meta.env.DEV`).
// En production, ce module n'est jamais chargé → zéro coût bundle.
//
// Le SW lui-même est généré une fois via `npx msw init public/`
// (publié dans `public/mockServiceWorker.js`, versionné dans le repo).
// ============================================================
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
export const worker = setupWorker(...handlers);
