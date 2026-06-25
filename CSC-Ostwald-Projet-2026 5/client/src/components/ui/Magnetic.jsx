// ============================================================
// Magnetic.jsx — Wrapper qui fait « attirer » son contenu vers le curseur
//
// Effet signature pour les CTAs principaux : quand la souris s'approche
// du bouton, celui-ci se décale légèrement dans la direction du curseur,
// avec un retour spring fluide quand la souris s'éloigne.
//
// Respecte prefers-reduced-motion : retourne un wrapper statique sans
// animation. Sur touch (mobile), aucun effet (mousemove ne se déclenche pas).
//
// Usage :
//   <Magnetic strength={0.3}>
//     <button className="btn-bubble btn-bubble--orange">Cliquer</button>
//   </Magnetic>
// ============================================================
import { m, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
export default function Magnetic({ children, strength = 0.3, className = '' }) {
  const reduceMotion = useReducedMotion();
  // useMotionValue : valeur tracée sans déclencher de re-render React
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  // useSpring : interpolation physique « élastique » sur les valeurs
  const x = useSpring(rawX, { stiffness: 180, damping: 20, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 180, damping: 20, mass: 0.4 });
  // Reduced motion → wrapper statique inline-block (préserve le layout)
  if (reduceMotion) {
    return (
      <span className={className} style={{ display: 'inline-block' }}>
        {children}
      </span>
    );
  }
  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Décalage du centre du bouton, multiplié par strength
    rawX.set((e.clientX - rect.left - rect.width / 2) * strength);
    rawY.set((e.clientY - rect.top - rect.height / 2) * strength);
  };
  const handleLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };
  return (
    <m.span
      className={className}
      style={{ x, y, display: 'inline-block' }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </m.span>
  );
}
