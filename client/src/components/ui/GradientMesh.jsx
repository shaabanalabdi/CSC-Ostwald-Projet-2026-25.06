// ============================================================
// GradientMesh.jsx — Fond gradient mesh animé (radial blobs)
//
// Plusieurs radial-gradients flous se déplacent lentement pour créer un fond
// vivant mais paisible. Inspiré des sites premium (Linear, Vercel, Stripe).
// Variantes adaptées à la charte CSC :
//   - warm   : orange + jaune (Hero, espaces accueillants)
//   - cool   : bleu + green (Bénévole, professionnel)
//   - sunset : orange + pink + bleu (sections festives)
//   - calm   : bleu pâle + green doux (sections d'info)
//
// Animation 100 % CSS keyframes, GPU-accelerated (transform + opacity).
// Aucun JS au runtime → coût quasi nul + reduced-motion respecté.
// ============================================================
import './GradientMesh.scss';
export default function GradientMesh({ variant = 'warm', className = '' }) {
  return (
    <div className={`gradient-mesh gradient-mesh--${variant} ${className}`} aria-hidden="true">
      <span className="gradient-mesh__blob gradient-mesh__blob--1" />
      <span className="gradient-mesh__blob gradient-mesh__blob--2" />
      <span className="gradient-mesh__blob gradient-mesh__blob--3" />
    </div>
  );
}
