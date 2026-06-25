// ============================================================
// ScrollProgress.jsx — Barre de progression de lecture en haut de page
//
// Suit le scroll vertical de la page et affiche une barre qui se remplit
// de gauche à droite (RTL : de droite à gauche) en haut du viewport.
// Idéal pour pages longues (PolitiqueConfidentialite, MentionsLegales).
//
// Respecte prefers-reduced-motion (la barre reste statique, juste le %).
// ============================================================
import { m, useScroll, useSpring, useReducedMotion } from 'framer-motion';
import './ScrollProgress.scss';
export default function ScrollProgress() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  // useSpring lisse la valeur (sinon le suivi est saccadé).
  // Reduced motion : pas de spring, snap direct (cf. ternaire dans style).
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  return (
    <m.div
      className="scroll-progress"
      style={{ scaleX: reduceMotion ? scrollYProgress : scaleX }}
      aria-hidden="true"
    />
  );
}
