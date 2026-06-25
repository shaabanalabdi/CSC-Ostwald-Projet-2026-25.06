// ============================================================
// APropos.jsx — Page parente de la section "À Propos"
//
// Cette page ne contient pas de contenu propre : elle sert uniquement
// de layout pour ses sous-pages (QuiSommesNous, NosPartenaires, ProjetSocial).
// <Outlet /> est le placeholder où React Router injecte la sous-page active.
//
// Structure des routes dans App.jsx :
//   /a-propos/qui-sommes-nous  → QuiSommesNous
//   /a-propos/nos-partenaires  → NosPartenaires
//   /a-propos/projet-social    → ProjetSocial
// ============================================================
import { Outlet } from 'react-router-dom';
import './APropos.scss';
export default function APropos() {
  return (
    <div className="apropos">
      {/* Contenu injecté automatiquement selon la sous-route active */}
      {/* Le SEO est géré par chaque sous-page (QuiSommesNous, NosPartenaires, ProjetSocial) */}
      <Outlet />
    </div>
  );
}
