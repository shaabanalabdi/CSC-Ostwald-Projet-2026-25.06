// ============================================================
// useActivity — GET /api/admin/activities/:id (unique).
// Activé uniquement quand id > 0 pour que la page d'édition puisse se
// monter sans déclencher la requête en attendant le paramètre d'URL.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const useActivity = (id) =>
  useQuery({
    queryKey: ['admin', 'activities', 'one', id],
    queryFn: () => apiGet(`/admin/activities/${id}`),
    enabled: Number.isInteger(id) && id > 0,
    staleTime: 30 * 1000,
  });
