// ============================================================
// ProtectedRoute.jsx — Garde d'authentification des pages /admin/*.
//
// Appelle useMe (GET /api/auth/me). Trois états :
//   1. Chargement    → squelette vide (pas de flash d'UI non authentifiée).
//   2. Erreur / 401  → redirection vers /admin/login, en conservant la
//                       destination voulue dans l'état du routeur pour
//                       pouvoir y revenir après une connexion réussie.
//   3. Succès        → rend les enfants protégés.
//
// React Query met le résultat en cache 30 s ; un ProtectedRoute sur une
// page admin imbriquée ne refetch pas à chaque navigation.
// ============================================================
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMe } from '@features/auth';

/**
 * À utiliser soit comme wrapper (prop children), SOIT comme élément de
 * route qui rend `<Outlet/>` pour les routes imbriquées :
 *
 *   <Route element={<ProtectedRoute><AdminLayout/></ProtectedRoute>}>
 *     <Route path="dashboard" element={<AdminDashboard/>} />
 *     ...
 *   </Route>
 *
 *   <Route element={<ProtectedRoute/>}>
 *     <Route element={<AdminLayout/>}>
 *       <Route path="dashboard" element={<AdminDashboard/>} />
 *     </Route>
 *   </Route>
 *
 * Les deux formes sont supportées pour que les appelants choisissent la
 * plus claire.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { data: user, isLoading, isError } = useMe();
  if (isLoading) {
    // Espace réservé minimal — sans header/footer pour que le flash non
    // authentifié soit invisible.
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.95rem',
          color: '#6b7280',
        }}
      >
        Vérification de la session…
      </div>
    );
  }
  if (isError || !user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  // Utilisé comme route de layout (sans children), rend les routes imbriquées.
  return children ?? <Outlet />;
}
