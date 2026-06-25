// ============================================================
// SectionWave.jsx — Séparateur SVG ondulé entre sections (cinematic divider)
//
// Évite la coupure "plate" entre deux backgrounds différents (ex: hero warm
// → section blanche). Une vague SVG douce avec une légère oscillation horizontale
// fait respirer la transition, dans l'esprit des sites éditoriaux award-winning.
//
// Performance :
//   - 1 seul <svg> avec preserveAspectRatio (responsive, 0 reflow au resize)
//   - Animation pure CSS (transform sur <path>), GPU-accelerated
//   - Auto-désactivé en prefers-reduced-motion via media query
//   - aria-hidden : décoratif, ignoré par les lecteurs d'écran
// ============================================================
import './SectionWave.scss';
export default function SectionWave({
  from = 'transparent',
  to = '#ffffff',
  flip = false,
  height = 80,
  animated = true,
  className = '',
}) {
  return (
    <div
      className={`section-wave ${flip ? 'section-wave--flip' : ''} ${animated ? 'section-wave--animated' : ''} ${className}`}
      style={{ height: `${height}px`, background: from }}
      aria-hidden="true"
    >
      <svg
        className="section-wave__svg"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
      >
        {/* Deux <path> superposés à phases décalées créent un effet de
            profondeur quand l'animation horizontale les fait osciller. */}
        <path
          className="section-wave__path section-wave__path--back"
          fill={to}
          fillOpacity="0.4"
          d="M0,40 C240,80 480,0 720,30 C960,60 1200,20 1440,50 L1440,80 L0,80 Z"
        />
        <path
          className="section-wave__path section-wave__path--front"
          fill={to}
          d="M0,50 C240,20 480,70 720,40 C960,10 1200,60 1440,30 L1440,80 L0,80 Z"
        />
      </svg>
    </div>
  );
}
