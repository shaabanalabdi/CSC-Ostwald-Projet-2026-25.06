// ============================================================
// Layout.jsx — Structure commune à toutes les pages
// Affiche la Navbar en haut, le contenu de la page via <Outlet>,
// et le Footer en bas. Toutes les routes passent par ce composant.
//
// Skip-link : lien d'évitement (RGAA, WCAG 2.4.1) qui permet aux
// utilisateurs au clavier ou aux lecteurs d'écran de passer directement
// au contenu principal sans tabuler à travers toute la Navbar.
// ============================================================
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import Footer from './Footer';
import AccessibilityWidget from '@components/shared/AccessibilityWidget';
// CursorGlow : halo brand qui suit le curseur (desktop premium).
// Auto-désactivé sur tactile et en prefers-reduced-motion (no-op).
import CursorGlow from '@components/ui/CursorGlow';
export default function Layout() {
  const { t } = useTranslation();
  return (
    // Fragment : la Navbar, le AccessibilityWidget et le skip-link sont frères
    // de .app-wrapper (pas enfants).
    //
    // RAISON : en mode a11y grayscale/negative, un `filter` CSS est appliqué
    // sur .app-wrapper. Tout élément `position: fixed` situé DANS un parent
    // filtré perd son ancrage au viewport et dérive avec le scroll.
    // → Navbar (position: fixed top:0) DOIT rester hors de .app-wrapper.
    // → AccessibilityWidget (position: fixed bottom:30px) idem.
    // → Skip-link placé en tout premier dans le DOM pour rester le 1er
    //   élément focusable au Tab (UX RGAA / WCAG 2.4.1).
    <>
      {/* Skip-link : 1er élément du DOM, invisible jusqu'au focus (Tab) */}
      <a href="#main-content" className="skip-link">
        {t('a11y.skipToContent')}
      </a>

      {/* Barre de navigation fixe — frère de .app-wrapper (cf. note plus haut) */}
      <Navbar />

      <div className="app-wrapper">
        {/* Contenu de la page active (injecté par React Router).
            <main> est obligatoire pour la conformité Lighthouse a11y
            (« Document should have one main landmark »). tabIndex={-1}
            permet au skip-link au-dessus de focuser ici sans entrer
            dans l'ordre Tab naturel. */}
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>

        {/* Pied de page commun */}
        <Footer />
      </div>

      {/* Widget d'accessibilité — DOIT rester hors de .app-wrapper
            pour échapper au filter CSS appliqué en mode grayscale/négatif */}
      <AccessibilityWidget />
    </>
  );
}
