// ============================================================
// GrainTexture.jsx — Couche de bruit organique
//
// Ajoute une texture « grain de film » subtile par-dessus une section.
// Donne un caractère analogique chaleureux qui évite l'aspect « digital flat »
// des sites AI-générés (cf. frontend-design skill : « avoid generic AI aesthetics »).
//
// 100 % SVG inline encodé en data-URI : aucune image externe, aucun téléchargement
// supplémentaire, ~250 octets sur la wire. GPU-accelerated via mix-blend-mode.
//
// Usage :
//   <section style={{ position: 'relative' }}>
//     <GrainTexture opacity={0.04} />
//     ...contenu...
//   </section>
// ============================================================
// SVG noise via feTurbulence : génère un motif fractal procédural côté navigateur.
// baseFrequency : densité (0.9 = grain fin, 0.5 = plus grossier)
// numOctaves : richesse (1 = uniforme, 4 = très organique mais coûteux)
const NOISE_SVG = `<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`;
export default function GrainTexture({ opacity = 0.05, blendMode = 'overlay', className = '' }) {
  return (
    <div
      className={`grain-texture ${className}`}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml;utf8,${NOISE_SVG}")`,
        backgroundSize: '200px 200px',
        opacity,
        mixBlendMode: blendMode,
        // z-index élevé : au-dessus des fonds et gradients, sous le contenu
        // (le contenu doit avoir z-index >= 2 ou position:relative)
        zIndex: 1,
      }}
    />
  );
}
