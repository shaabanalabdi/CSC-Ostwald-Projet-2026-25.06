// ============================================================
// useNewsItem — GET /api/admin/news/:id. Désactivé quand id ≤ 0 pour
// que la page « nouveau » ne déclenche pas un 404 inutile.
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';

export const useNewsItem = (id) =>
  useQuery({
    queryKey: ['admin', 'news', id],
    queryFn: () => apiGet(`/admin/news/${id}`),
    enabled: Number.isInteger(id) && id > 0,
    staleTime: 30 * 1000,
  });
