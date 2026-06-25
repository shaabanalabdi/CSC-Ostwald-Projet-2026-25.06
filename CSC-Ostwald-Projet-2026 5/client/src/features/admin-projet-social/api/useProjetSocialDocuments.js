// ============================================================
// useProjetSocialDocuments — GET /api/admin/projet-social/documents.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const useProjetSocialDocuments = (opts = {}) => {
  const page = opts.page ?? 1;
  const perPage = opts.perPage ?? 50;
  const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  return useQuery({
    queryKey: ['admin', 'projet-social', 'documents', { page, perPage }],
    queryFn: () => apiGet(`/admin/projet-social/documents?${params.toString()}`),
    staleTime: 30 * 1000,
  });
};
