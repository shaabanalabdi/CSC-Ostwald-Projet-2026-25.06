// ============================================================
// CSCCard.jsx — Composant carte unifié (style Instagram CSC)
//
// Pattern : compound component avec sous-éléments composables.
// Sert de base réutilisable pour tous les types de cartes du site.
//
// Variantes :
//   variant   : 'elevated' (shadow, défaut) | 'bordered' | 'flat'
//   interactive : true → hover lift + shadow growth (cards cliquables)
//   tilt3D    : true → effet 3D tilt au survol (style 21st.dev)
//                (désactivé sur @media (hover: none) pour mobile)
//
// Sous-composants exposés via Object.assign (pattern moderne TS-friendly) :
//   <CSCCard.Image src={} alt={} badge={} accentBadge={} />
//   <CSCCard.Body>             — flex column, gap, padding
//   <CSCCard.Title>            — titre (h3 par défaut)
//   <CSCCard.Description>      — paragraphe descriptif
//   <CSCCard.Meta>             — liste de méta-infos (lieu, prix, etc.)
//   <CSCCard.Footer>           — bas de carte (badges + CTA)
//
// Exemple :
//
//   <CSCCard interactive>
//     <CSCCard.Image
//       src={img}
//       alt="..."
//       badge={{ text: 'FAMILLE', color: 'orange' }}
//       accentBadge={{ text: '21 MAI', color: 'green', tilt: 'right' }}
//     />
//     <CSCCard.Body>
//       <CSCCard.Title>Titre de l'événement</CSCCard.Title>
//       <CSCCard.Description>Lorem ipsum...</CSCCard.Description>
//       <CSCCard.Footer>
//         <Link to="/contact" className="btn-bubble btn-bubble--orange">
//           S'inscrire
//         </Link>
//       </CSCCard.Footer>
//     </CSCCard.Body>
//   </CSCCard>
// ============================================================
import { useRef, useState } from 'react';
import CSCBadge from './CSCBadge';
// ─── Carte conteneur ─────────────────────────────────────────────
function CSCCardRoot({
  variant = 'elevated',
  interactive = false,
  tilt3D = false,
  className = '',
  children,
  ...rest
}) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  // Tilt 3D (style 21st.dev) : calcule la rotation basée sur position curseur.
  // Désactivé automatiquement si l'utilisateur n'a pas de hover (mobile)
  // ou si tilt3D=false.
  const handleMouseMove = (e) => {
    if (!tilt3D || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    // Inclinaison max : 6deg (subtile, pas désorientante)
    const rotateY = ((x - cx) / cx) * 6;
    const rotateX = -((y - cy) / cy) * 6;
    setTilt({ x: rotateX, y: rotateY });
  };
  const handleMouseLeave = () => {
    if (!tilt3D) return;
    setTilt({ x: 0, y: 0 });
  };
  const classes = [
    'csc-card',
    `csc-card--${variant}`,
    interactive && 'csc-card--interactive',
    tilt3D && 'csc-card--tilt-enabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const style = tilt3D
    ? { transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }
    : undefined;
  return (
    <div
      ref={cardRef}
      className={classes}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {children}
    </div>
  );
}
function Image({ src, alt = '', badge, accentBadge, width, height, className = '' }) {
  return (
    <div className={`csc-card__image-wrapper ${className}`}>
      <img
        src={src}
        alt={alt}
        className="csc-card__image"
        loading="lazy"
        width={width}
        height={height}
      />
      {badge && (
        <CSCBadge
          variant={badge.color ?? 'orange'}
          size="sm"
          tilt={badge.tilt}
          className="csc-card__badge csc-card__badge--top-start"
        >
          {badge.text}
        </CSCBadge>
      )}
      {accentBadge && (
        <CSCBadge
          variant={accentBadge.color ?? 'green'}
          size="sm"
          tilt={accentBadge.tilt ?? 'right'}
          className="csc-card__badge csc-card__badge--bottom-end"
        >
          {accentBadge.text}
        </CSCBadge>
      )}
    </div>
  );
}
function Body({ className = '', children }) {
  return <div className={`csc-card__body ${className}`}>{children}</div>;
}
function Title({ as: Component = 'h3', className = '', children }) {
  return <Component className={`csc-card__title ${className}`}>{children}</Component>;
}
function Description({ className = '', children }) {
  return <p className={`csc-card__description ${className}`}>{children}</p>;
}
function Meta({ className = '', children }) {
  return <ul className={`csc-card__meta ${className}`}>{children}</ul>;
}
function Footer({ className = '', children }) {
  return <div className={`csc-card__footer ${className}`}>{children}</div>;
}
// ─── Compound component via Object.assign ────────────────────────
// Object.assign préserve les types des sous-composants (pattern TS-idiomatique).
// Alternative legacy `CSCCard.Image = Image` casse l'inférence et nécessite
// un cast `as` explicite.
const CSCCard = Object.assign(CSCCardRoot, {
  Image,
  Body,
  Title,
  Description,
  Meta,
  Footer,
});
export default CSCCard;
