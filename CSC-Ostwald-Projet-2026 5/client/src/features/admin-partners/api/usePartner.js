// ============================================================
// usePartner — GET /api/admin/partners/:id (single).
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const usePartner = (id) =>
  useQuery({
    queryKey: ['admin', 'partners', 'one', id],
    queryFn: () => apiGet(`/admin/partners/${id}`),
    enabled: Number.isInteger(id) && id > 0,
    staleTime: 30 * 1000,
  });
