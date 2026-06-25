// ============================================================
// TextReveal.jsx — Cascade de mots qui apparaissent à l'entrée du viewport
//
// Split un texte en mots, chaque mot anime opacity + y avec un délai
// croissant (effet « lecture » naturel). Idéal pour les titres signature
// du site (hero, section titles importants).
//
// Respecte prefers-reduced-motion : retourne le texte brut sans animation.
// Préserve l'accessibilité : tout le texte reste sélectionnable et lisible
// par les lecteurs d'écran (les spans n'ont pas role/aria, restent inline).
//
// Usage :
//   <TextReveal text="Bienvenue au CSC d'Ostwald" as="h1" />
// ============================================================
import { m, useReducedMotion } from 'framer-motion';
// Tuple cubic-bezier signature CSC (ease-out smooth) — typé explicitement
// pour que framer-motion l'accepte comme BezierDefinition.
const EASE_CSC = [0.16, 1, 0.3, 1];
export default function TextReveal({
  text,
  as: Component = 'span',
  className = '',
  delay = 0,
  stagger = 0.06,
}) {
  const reduceMotion = useReducedMotion();
  // Reduced motion → rendu statique simple (pas d'animation, lisible direct)
  if (reduceMotion) {
    return <Component className={className}>{text}</Component>;
  }
  // Split par espaces (préserve les ponctuations attachées aux mots)
  const words = text.split(' ');
  const parent = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: delay,
        staggerChildren: stagger,
      },
    },
  };
  const child = {
    hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.55, ease: EASE_CSC },
    },
  };
  return (
    <Component className={`text-reveal ${className}`}>
      <m.span
        className="text-reveal__inner"
        style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.25em' }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={parent}
      >
        {words.map((word, i) => (
          <m.span
            key={i}
            className="text-reveal__word"
            variants={child}
            style={{ display: 'inline-block' }}
          >
            {word}
          </m.span>
        ))}
      </m.span>
    </Component>
  );
}
