// ============================================================
// AdminLayout.jsx — Structure commune aux pages d'administration.
//
// Réutilise la Navbar et le Footer publics : le mode admin n'est pas
// hermétique au site, l'admin peut basculer entre vue publique et
// gestion sans changer d'onglet.
//
// Différences avec le `Layout` public :
//   - Pas d'AccessibilityWidget ni de CursorGlow (l'admin est un outil
//     interne, pas une vitrine — on enlève les ornements visuels).
//   - `.admin-layout__main` réserve `$navbar-height` en padding-top
//     pour compenser la Navbar `position: fixed`.
//
// La route `/admin/login` reste en dehors de ce layout (entrée
// publique avant authentification).
// ============================================================
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import Footer from './Footer';
import './AdminLayout.scss';
export default function AdminLayout() {
  const { t } = useTranslation();
  return (
    <>
      {/* Skip-link — premier élément focusable au Tab (RGAA/WCAG 2.4.1). */}
      <a href="#main-content" className="skip-link">
        {t('a11y.skipToContent')}
      </a>

      <Navbar />

      <div className="admin-layout">
        <main id="main-content" className="admin-layout__main" tabIndex={-1}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
}
