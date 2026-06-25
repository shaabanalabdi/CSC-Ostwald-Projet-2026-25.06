// ============================================================
// useTeamMembers — GET /api/admin/team (paginated).
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const useTeamMembers = (opts = {}) => {
  const page = opts.page ?? 1;
  const perPage = opts.perPage ?? 50;
  const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  return useQuery({
    queryKey: ['admin', 'team', { page, perPage }],
    queryFn: () => apiGet(`/admin/team?${params.toString()}`),
    staleTime: 30 * 1000,
  });
};
