// ============================================================
// useTeamMember — GET /api/admin/team/:id (single).
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const useTeamMember = (id) =>
  useQuery({
    queryKey: ['admin', 'team', 'one', id],
    queryFn: () => apiGet(`/admin/team/${id}`),
    enabled: Number.isInteger(id) && id > 0,
    staleTime: 30 * 1000,
  });
