// ============================================================
// useActivities — GET /api/admin/activities (paginated, optional type filter).
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const useActivities = (opts = {}) => {
  const page = opts.page ?? 1;
  const perPage = opts.perPage ?? 20;
  const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  if (opts.type) params.set('type', opts.type);
  return useQuery({
    queryKey: ['admin', 'activities', { page, perPage, type: opts.type ?? null }],
    queryFn: () => apiGet(`/admin/activities?${params.toString()}`),
    staleTime: 30 * 1000,
  });
};
