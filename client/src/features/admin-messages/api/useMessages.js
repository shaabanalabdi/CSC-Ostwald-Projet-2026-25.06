// ============================================================
// useMessages — GET /api/admin/messages (liste paginée).
//
// Renvoie directement le handle React Query pour que le composant de
// page pilote l'UI depuis `isLoading`, `data`, `refetch`, etc. sans
// enveloppe.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const useMessages = (opts = {}) => {
  const page = opts.page ?? 1;
  const perPage = opts.perPage ?? 20;
  return useQuery({
    queryKey: ['admin', 'messages', { page, perPage }],
    queryFn: () => apiGet(`/admin/messages?page=${page}&perPage=${perPage}`),
    // Données admin — gardées relativement fraîches, mais pas au point
    // de spammer le backend si l'admin laisse l'onglet ouvert.
    staleTime: 30 * 1000,
  });
};
