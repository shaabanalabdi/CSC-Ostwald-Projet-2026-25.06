// ============================================================
// useEvent — GET /api/admin/events/:id (unique).
// Désactivé tant que id ≤ 0 pour que la page d'édition puisse se monter
// avant que le paramètre d'URL soit parsé.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const useEvent = (id) =>
  useQuery({
    queryKey: ['admin', 'events', 'one', id],
    queryFn: () => apiGet(`/admin/events/${id}`),
    enabled: Number.isInteger(id) && id > 0,
    staleTime: 30 * 1000,
  });
