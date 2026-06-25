// ============================================================
// useParallax.js — Parallax léger lié au scroll
//
// Retourne `{ ref, y }` où `y` est un `MotionValue<number>` à brancher
// sur le style d'un élément `m.div` (ou `m.span`, etc.). L'élément se
// déplace verticalement en fonction du scroll, créant un effet de
// profondeur subtil.
//
// La force (offset max en px) est paramétrable. Respecte
// prefers-reduced-motion : si activé, `y` reste à 0 → aucun déplacement.
//
// Performance : 1 listener scroll global partagé par framer-motion +
// 1 useSpring pour lisser. GPU-accelerated via transform.
//
// Usage :
//   function Hero() {
//     const { ref, y } = useParallax(40);  // ±40px de déplacement max
//     return (
//       <section ref={ref}>
//         <m.div style={{ y }}>Contenu qui flotte</m.div>
//       </section>
//     );
//   }
// ============================================================
import { useRef } from 'react';
import { useScroll, useTransform, useSpring, useReducedMotion } from 'framer-motion';
/**
 * @param strength  Force du parallax en pixels (±). Défaut 30. Si l'utilisateur
 *                  a activé `prefers-reduced-motion`, la force est forcée à 0
 *                  (aucun déplacement, hooks toujours appelés dans le même ordre).
 */
export default function useParallax(strength = 30) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  // useScroll avec target=ref : suit la progression du scroll RELATIVE
  // à l'élément (0 quand juste sous la viewport, 1 quand juste au-dessus).
  // offset ["start end", "end start"] : commence quand le top de l'élément
  // touche le bottom de la viewport, finit quand son bottom touche le top.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  // reduced-motion : force la strength à 0 (les hooks restent appelés dans
  // le même ordre, conforme aux Rules of Hooks).
  const effectiveStrength = reduceMotion ? 0 : strength;
  // Mappe progression [0..1] → translation [+strength..-strength]
  // (descend vers le haut quand on scrolle vers le bas = effet parallax classique)
  const rawY = useTransform(scrollYProgress, [0, 1], [effectiveStrength, -effectiveStrength]);
  // Spring pour lisser les micro-saccades du scroll
  const y = useSpring(rawY, { stiffness: 80, damping: 30, mass: 0.5 });
  return { ref, y };
}
