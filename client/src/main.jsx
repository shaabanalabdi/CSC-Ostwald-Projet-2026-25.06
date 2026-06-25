// ============================================================
// main.jsx — Point d'entrée de l'application React
// C'est le premier fichier exécuté par Vite au démarrage.
// ============================================================
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
// Initialise i18next (traductions) avant le premier rendu
import './i18n';
// Polices auto-hébergées (RGPD-compliant, pas de CDN externe).
//
// Le sous-ensemble latin d'Outfit-400/600 + Fredoka-600 est livré via
// `public/fonts/critical.css` (préchargé dans index.html pour qu'ils
// soient disponibles au premier paint et ne déclenchent pas de CLS dû au
// font swap).
//
// Ci-dessous : seulement les AUTRES sous-ensembles/graisses — ils
// utilisent encore swap, mais couvrent des caractères minoritaires
// (latin-ext, cyrillique, arabe) ou des graisses utilisées sous la ligne
// de flottaison, donc le swap a peu d'impact CLS. Outfit ne livre que
// latin + latin-ext — le russe utilise le repli système (acceptable ;
// le rendu russe n'a jamais été en Outfit).
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/600.css';
import '@fontsource/open-sans/700.css';
import '@fontsource/cairo/arabic-400.css';
import '@fontsource/cairo/arabic-600.css';
import '@fontsource/cairo/arabic-700.css';
// Styles globaux (reset CSS de base)
import './index.css';
// Styles globaux SCSS (variables, utilitaires, classes communes)
import './styles/global.scss';
import App from './App';
/**
 * Démarre l'application.
 *
 * Par défaut en dev, les appels `/api/*` sont proxifiés par Vite vers
 * le backend Express (cf. vite.config.js → server.proxy). Pour développer
 * SANS lancer le backend (mode mock), exporter `VITE_USE_MOCKS=true` avant
 * `npm run dev` — MSW interceptera alors les requêtes côté Service Worker.
 *
 * MSW reste toujours actif en TESTS (cf. src/test/setup.js qui utilise
 * le server Node, pas le browser worker — donc indépendant de ce flag).
 *
 * Le bundle `@mocks/browser` est tree-shaken en prod car cet import
 * dynamique est gardé par `import.meta.env.DEV` (constant remplacé par Vite).
 */
async function bootstrap() {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
    const { worker } = await import('@mocks/browser');
    // `onUnhandledRequest: 'bypass'` : laisse passer les requêtes non mockées
    // (fonts, assets, HMR) sans warning. Override par endpoint si besoin.
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
  // getElementById retourne HTMLElement | null. Le `<div id="root">` existe
  // statiquement dans index.html — un échec ici signalerait un index corrompu,
  // on lève donc une erreur explicite au lieu de continuer silencieusement.
  const rootElement = document.getElementById('root');
  if (rootElement === null) {
    throw new Error('Élément #root introuvable dans index.html — le mount React est impossible.');
  }
  createRoot(rootElement).render(
    <StrictMode>
      {/* HelmetProvider enveloppe toute l'app pour activer la gestion des balises <head> */}
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </StrictMode>
  );
}
void bootstrap();
