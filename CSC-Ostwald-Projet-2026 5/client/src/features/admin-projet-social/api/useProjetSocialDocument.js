// ============================================================
// useProjetSocialDocument — GET /api/admin/projet-social/documents/:id.
// Activé uniquement quand id > 0 pour que la route « nouveau » ne
// déclenche pas un fetch 404.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const useProjetSocialDocument = (id) =>
  useQuery({
    queryKey: ['admin', 'projet-social', 'documents', id],
    queryFn: () => apiGet(`/admin/projet-social/documents/${id}`),
    enabled: Number.isInteger(id) && id > 0,
    staleTime: 30 * 1000,
  });
