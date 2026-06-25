// ============================================================
// useBenevoleApplications — GET /api/admin/benevole (paginated).
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const useBenevoleApplications = (opts = {}) => {
  const page = opts.page ?? 1;
  const perPage = opts.perPage ?? 20;
  return useQuery({
    queryKey: ['admin', 'benevole', { page, perPage }],
    queryFn: () => apiGet(`/admin/benevole?page=${page}&perPage=${perPage}`),
    staleTime: 30 * 1000,
  });
};
