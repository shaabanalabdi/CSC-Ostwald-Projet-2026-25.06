// ============================================================
// useHeroSlide — GET /api/admin/hero/:id. Désactivé quand id ≤ 0 pour
// que la page « nouvelle slide » ne déclenche pas un 404 inutile.
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';

export const useHeroSlide = (id) =>
  useQuery({
    queryKey: ['admin', 'hero', id],
    queryFn: () => apiGet(`/admin/hero/${id}`),
    enabled: Number.isInteger(id) && id > 0,
    staleTime: 30 * 1000,
  });
