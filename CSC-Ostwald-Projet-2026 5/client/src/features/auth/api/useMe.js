// ============================================================
// useMe — Hook de query GET /api/auth/me (session admin courante).
//
// Utilisé par ProtectedRoute pour protéger les pages /admin/*, et par
// AdminDashboard pour afficher « Connecté en tant que … ». Un 401 du
// backend n'est PAS réessayé — l'appelant le traite comme « non
// connecté » et redirige vers /admin/login.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const useMe = () =>
  useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiGet('/auth/me'),
    // 401 = « non connecté » — inutile de gaspiller des cycles à réessayer.
    retry: false,
    // Périmé après 30 s ; refetch au focus pour qu'une session expirée
    // côté serveur se reflète dans l'UI sans rechargement manuel.
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
