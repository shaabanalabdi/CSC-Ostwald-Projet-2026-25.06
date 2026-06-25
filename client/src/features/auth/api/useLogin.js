// ============================================================
// useLogin — Hook de mutation POST /api/auth/login.
//
// En cas de succès, le backend pose un cookie HTTPOnly (jwt_token). Le
// navigateur l'inclut sur les requêtes same-origin suivantes grâce à
// `credentials: 'include'` configuré globalement dans @api/client.
// ============================================================
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@api/client';
/**
 * Hook React Query pour la connexion admin.
 *
 * @example
 *   const login = useLogin();
 *   await login.mutateAsync({ email, password });
 *   // → cookie posé, ProtectedRoute peut maintenant rendre
 */
export const useLogin = () =>
  useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: (payload) => apiPost('/auth/login', payload),
  });
