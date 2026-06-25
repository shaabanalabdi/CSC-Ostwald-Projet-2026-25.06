// ============================================================
// useRegistrations — GET /api/admin/registrations (paginé).
// Chaque ligne porte le `activity_title` joint pour que l'admin n'ait
// pas besoin d'un fetch N+1 pour afficher « Inscription pour Atelier
// Cuisine ».
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const useRegistrations = (opts = {}) => {
  const page = opts.page ?? 1;
  const perPage = opts.perPage ?? 20;
  return useQuery({
    queryKey: ['admin', 'registrations', { page, perPage }],
    queryFn: () => apiGet(`/admin/registrations?page=${page}&perPage=${perPage}`),
    staleTime: 30 * 1000,
  });
};
