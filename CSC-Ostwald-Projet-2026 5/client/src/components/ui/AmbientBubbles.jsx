// ============================================================
// AmbientBubbles.jsx — Décoration passive : bulles flottantes
//
// Petites bulles colorées qui flottent en arrière-plan d'une section,
// donnant un effet « alive » sans demander d'interaction. Cohérent avec
// l'identité visuelle Instagram CSC (motifs ronds, bubbles, blob).
//
// Le rendu est 100% CSS (animation keyframes bubbleFloat dans global.scss),
// React ne fait que générer les divs avec leurs paramètres aléatoires
// (couleur, taille, position, durée, délai) une seule fois au montage.
//
// Usage :
//   <section style={{ position: 'relative' }}>
//     <AmbientBubbles count={6} />
//     ...contenu...
//   </section>
//
// Le parent DOIT avoir position:relative (ou autre non-static) pour
// que les bulles absolument positionnées s'ancrent correctement.
// ============================================================
import { useMemo } from 'react';
const PALETTE = [
  { color: 'rgba(238, 150, 27, 0.18)', label: 'orange' }, // $orange de la charte
  { color: 'rgba(1, 50, 204, 0.12)', label: 'bleu' }, // $bleu de la charte
  { color: 'rgba(88, 179, 13, 0.14)', label: 'green' }, // $green de la charte
];
/**
 * Génère un nombre pseudo-aléatoire reproductible (`seed`).
 * Permet une stabilité SSR et un rendu identique entre les rerenders.
 */
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
export default function AmbientBubbles({ count = 6, seed = 1, className = '' }) {
  // useMemo : les positions/tailles sont calculées UNE seule fois.
  // Si le composant re-render, les bulles ne « sautent » pas.
  const bubbles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const r1 = seededRandom(seed + i * 7.3);
      const r2 = seededRandom(seed + i * 13.1);
      const r3 = seededRandom(seed + i * 19.7);
      const r4 = seededRandom(seed + i * 23.5);
      const size = 40 + r1 * 90; // 40-130px
      const left = r2 * 100; // 0-100%
      const top = r3 * 100; // 0-100%
      const duration = 10 + r4 * 8; // 10-18s
      const delay = -r1 * 10; // -10 à 0s (décalage de phase)
      const color = PALETTE[i % PALETTE.length];
      return { size, left, top, duration, delay, color };
    });
  }, [count, seed]);
  return (
    <div className={`ambient-bubbles ${className}`} aria-hidden="true">
      {bubbles.map((b, i) => {
        const style = {
          width: `${b.size}px`,
          height: `${b.size}px`,
          left: `${b.left}%`,
          top: `${b.top}%`,
          background: `radial-gradient(circle, ${b.color.color}, transparent 70%)`,
          '--duration': `${b.duration}s`,
          '--delay': `${b.delay}s`,
        };
        return <span key={i} className="ambient-bubbles__bubble" style={style} />;
      })}
    </div>
  );
}
