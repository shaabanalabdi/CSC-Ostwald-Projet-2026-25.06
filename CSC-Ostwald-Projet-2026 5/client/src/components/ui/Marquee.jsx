// ============================================================
// Marquee.jsx — Bande défilante horizontale (style 21st.dev)
//
// Affiche une suite d'éléments qui défilent horizontalement en boucle.
// Pause au survol. Respecte prefers-reduced-motion (immobile si activé).
//
// Usage :
//   <Marquee speed={40} pauseOnHover>
//     {logos.map((l) => <img key={l.id} src={l.img} alt={l.name} />)}
//   </Marquee>
// ============================================================
import { useReducedMotion } from 'framer-motion';
import './Marquee.scss';
export default function Marquee({
  children,
  speed = 30,
  direction = 'left',
  pauseOnHover = true,
  gap = 48,
  className = '',
}) {
  const reduceMotion = useReducedMotion();
  // Si reduced motion activé : pas d'animation, contenu statique (overflow auto)
  if (reduceMotion) {
    return (
      <div className={`marquee marquee--static ${className}`}>
        <div className="marquee__track" style={{ gap: `${gap}px` }}>
          {children}
        </div>
      </div>
    );
  }
  const style = {
    '--marquee-duration': `${speed}s`,
    '--marquee-gap': `${gap}px`,
  };
  return (
    <div
      className={`marquee marquee--${direction} ${pauseOnHover ? 'marquee--pause-hover' : ''} ${className}`}
      // CSS custom properties → permettent de paramétrer l'animation via les props
      style={style}
    >
      {/* Le contenu est dupliqué 2× pour créer une boucle visuellement continue
            (quand la 1ère moitié sort à gauche, la 2ème entre par la droite). */}
      <div className="marquee__track">
        <div className="marquee__group" aria-hidden="false">
          {children}
        </div>
        <div className="marquee__group" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
