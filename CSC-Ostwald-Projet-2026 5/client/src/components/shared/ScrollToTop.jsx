// ============================================================
// ScrollToTop.jsx — Remonte la page en haut à chaque changement de route
//
// Composant silencieux (return null) à monter UNE fois dans l'arbre,
// idéalement directement dans BrowserRouter. Pas de props.
// ============================================================
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
