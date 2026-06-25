// ============================================================
// useAdminStats — GET /api/admin/stats.
// Un instantané de tous les compteurs du dashboard ; rafraîchi au focus
// pour que l'admin voie toujours les chiffres actuels sans rechargement
// manuel.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const useAdminStats = () =>
  useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => apiGet('/admin/stats'),
    // 30 s suffit à absorber les double-fetches en dev ; le dashboard
    // refetch au focus de fenêtre de toute façon, donc les chiffres
    // restent frais.
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
