// ============================================================
// useEvents — GET /api/admin/events (paginated).
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const useEvents = (opts = {}) => {
  const page = opts.page ?? 1;
  const perPage = opts.perPage ?? 20;
  const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  return useQuery({
    queryKey: ['admin', 'events', { page, perPage }],
    queryFn: () => apiGet(`/admin/events?${params.toString()}`),
    staleTime: 30 * 1000,
  });
};
