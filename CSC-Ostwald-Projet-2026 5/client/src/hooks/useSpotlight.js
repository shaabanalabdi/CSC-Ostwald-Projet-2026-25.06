// ============================================================
// useSpotlight.js — Effet « spotlight » qui suit le curseur
//
// Installe un listener global délégué : sur mousemove, met à jour
// les variables CSS --mx/--my de la carte sous le curseur. Le rendu
// visuel (radial-gradient) est piloté par SCSS (.spotlight-card ::before).
//
// Performance : un seul listener pour TOUTES les cartes (event delegation),
// throttlé par requestAnimationFrame. Respecte prefers-reduced-motion.
//
// Usage : monter ce hook UNE fois dans App.jsx, puis ajouter la classe
// `spotlight-card` à toute carte qui doit recevoir l'effet.
// ============================================================
import { useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';
export default function useSpotlight() {
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (reduceMotion) return;
    // Sur appareils tactiles primaires, l'effet spotlight n'apporte rien (pas de
    // hover) et alourdit inutilement le pipeline. Désactivation propre.
    if (!window.matchMedia('(hover: hover)').matches) return;
    let raf = null;
    let currentCard = null;
    const handleMove = (e) => {
      // e.target peut être n'importe quel EventTarget (Element ou autre).
      // On utilise un guard pour s'assurer que c'est bien un Element avant `.closest()`.
      const target = e.target;
      if (!(target instanceof Element)) return;
      const card = target.closest('.spotlight-card');
      if (!card) {
        currentCard = null;
        return;
      }
      currentCard = card;
      if (raf !== null) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!currentCard) return;
        const rect = currentCard.getBoundingClientRect();
        currentCard.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        currentCard.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });
    };
    document.addEventListener('mousemove', handleMove, { passive: true });
    return () => {
      document.removeEventListener('mousemove', handleMove);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [reduceMotion]);
}
