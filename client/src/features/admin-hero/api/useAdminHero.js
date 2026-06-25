// ============================================================
// useAdminHero — GET /api/admin/hero. Renvoie TOUTES les slides
// (brouillons inclus), dans l'ordre du carrousel. Pas de pagination :
// le Hero ne contient qu'une poignée de slides.
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';

export const useAdminHero = () =>
  useQuery({
    queryKey: ['admin', 'hero'],
    queryFn: () => apiGet('/admin/hero'),
    staleTime: 30 * 1000,
  });
