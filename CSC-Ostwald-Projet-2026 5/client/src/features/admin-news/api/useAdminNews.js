// ============================================================
// useAdminNews — GET /api/admin/news (paginated).
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';

export const useAdminNews = (opts = {}) => {
  const page = opts.page ?? 1;
  const perPage = opts.perPage ?? 50;
  const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  return useQuery({
    queryKey: ['admin', 'news', { page, perPage }],
    queryFn: () => apiGet(`/admin/news?${params.toString()}`),
    staleTime: 30 * 1000,
  });
};
