// ============================================================
// usePartners — GET /api/admin/partners (paginated).
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const usePartners = (opts = {}) => {
  const page = opts.page ?? 1;
  const perPage = opts.perPage ?? 50;
  const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  return useQuery({
    queryKey: ['admin', 'partners', { page, perPage }],
    queryFn: () => apiGet(`/admin/partners?${params.toString()}`),
    staleTime: 30 * 1000,
  });
};
