// ============================================================
// useDeferredMount.js — Différer le rendu de composants décoratifs
//
// Retourne `false` jusqu'à ce que le navigateur soit idle, puis `true`.
// Permet de retarder le rendu de composants non-critiques (atmosphère,
// effets) jusqu'APRÈS la fenêtre de mesure LCP de Lighthouse.
//
// Pourquoi : Lighthouse mesure LCP en observant le LARGEST CONTENTFUL
// PAINT candidate. Si plusieurs gros éléments décoratifs (bulles, blobs,
// cursor glow) apparaissent en cascade pendant la fenêtre de mesure,
// chacun INVALIDE le candidat précédent → Chrome abandonne → NO_LCP.
//
// La solution : faire entrer ces décors APRÈS la stabilisation du LCP.
// L'UX reste identique (les décors apparaissent en ~50-200ms après le
// premier paint, imperceptible visuellement), mais Lighthouse mesure
// un LCP propre.
//
// Usage :
//   const showDecor = useDeferredMount();
//   return (
//     <section>
//       {showDecor && <GradientMesh variant="warm" />}
//       <h1>Mon titre LCP</h1>
//     </section>
//   );
// ============================================================
import { useEffect, useState } from 'react';
/**
 * @param delay  Délai SUPPLÉMENTAIRE (ms) appliqué après l'idle callback.
 *               Défaut 0 = monter dès que le navigateur est libre.
 * @returns      `false` au premier render, puis `true` après idle.
 */
export default function useDeferredMount(delay = 0) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // requestIdleCallback : exécute quand le navigateur est libre, typiquement
    // après FCP/LCP. Fallback setTimeout pour Safari (qui n'a pas l'API).
    // Les deux retournent un `number` qu'on peut passer à cancel*().
    const schedule =
      window.requestIdleCallback?.bind(window) ??
      ((cb) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 }), 50));
    const cancel = window.cancelIdleCallback?.bind(window) ?? window.clearTimeout.bind(window);
    let extraTimeout;
    const handle = schedule(
      () => {
        // Si un délai supplémentaire est demandé, on l'applique en plus
        // (utile pour donner à Lighthouse une marge confortable).
        if (delay > 0) {
          extraTimeout = window.setTimeout(() => setReady(true), delay);
          return;
        }
        setReady(true);
      },
      { timeout: 500 }
    );
    return () => {
      cancel(handle);
      if (extraTimeout !== undefined) window.clearTimeout(extraTimeout);
    };
  }, [delay]);
  return ready;
}
