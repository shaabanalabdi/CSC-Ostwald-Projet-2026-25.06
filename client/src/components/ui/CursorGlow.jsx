// ============================================================
// CursorGlow.jsx — Halo brand qui suit le curseur (signature interactive)
//
// Un blob orange/bleu doux qui suit la souris avec une légère traîne
// (spring physics framer-motion). mix-blend-mode: screen sur fonds clairs
// pour "éclairer" la page sans masquer le contenu. Reste discret (low
// opacity), comme un projecteur ambient — pas un effet criard.
//
// Désactivé automatiquement quand :
//   - L'appareil n'a pas de pointeur fin (`hover: hover` + `pointer: fine`)
//     → mobile/tablette : aucun rendu, aucun coût
//   - L'utilisateur a activé prefers-reduced-motion
//   - Le navigateur n'est pas encore idle (post-LCP, voir useDeferredMount)
//
// Performance :
//   - 1 seul listener mousemove (passive)
//   - rAF naturel via framer-motion springs (GPU-accelerated transform)
//   - pointer-events: none → ne bloque jamais l'UI
//   - opacity 0 initial → fade in après 1er mouvement
// ============================================================
import { useEffect, useState } from 'react';
import { m, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import useDeferredMount from '@hooks/useDeferredMount';
export default function CursorGlow() {
  const reduceMotion = useReducedMotion();
  // Différer le montage : un blob 520×520 avec mix-blend-mode + filter:blur
  // qui apparaît juste après le 1er paint peut invalider le LCP candidate
  // de Lighthouse. On attend l'idle callback avant de monter quoi que ce soit.
  const mountReady = useDeferredMount();
  // Détection capacité pointeur fin (desktop avec souris).
  // useState + useEffect : matchMedia n'existe pas en SSR, on évite tout
  // accès direct pendant le rendu initial.
  const [hasFinePointer, setHasFinePointer] = useState(false);
  // Visible = true dès le 1er mouvement souris (fade in doux)
  const [visible, setVisible] = useState(false);
  // useMotionValue<number> : valeur réactive sans déclencher de re-render React.
  // Le DOM est mis à jour par framer-motion directement via transform.
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  // Spring : ajoute une légère traîne (le blob "rattrape" le curseur).
  // damping élevé + stiffness modéré = mouvement smooth, pas wobbly.
  const springX = useSpring(x, { stiffness: 150, damping: 18, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 150, damping: 18, mass: 0.5 });
  useEffect(() => {
    // Détection unique au montage (matchMedia.addEventListener pour réactivité
    // si l'utilisateur branche/débranche une souris — rare mais correct).
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setHasFinePointer(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  useEffect(() => {
    if (!hasFinePointer || reduceMotion) return;
    const handleMove = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!visible) setVisible(true);
    };
    // passive: true → le navigateur peut optimiser le scroll en parallèle
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [hasFinePointer, reduceMotion, visible, x, y]);
  // Rendu strictement conditionnel : si pas de pointeur fin OU reduced motion
  // OU pas encore prêt (post-LCP), aucun élément n'est inséré (zéro coût).
  if (!mountReady || !hasFinePointer || reduceMotion) return null;
  return (
    <m.div
      aria-hidden="true"
      className="cursor-glow"
      style={{
        // translate via motion values (GPU-accelerated, pas de layout)
        x: springX,
        y: springY,
        opacity: visible ? 1 : 0,
      }}
    />
  );
}
