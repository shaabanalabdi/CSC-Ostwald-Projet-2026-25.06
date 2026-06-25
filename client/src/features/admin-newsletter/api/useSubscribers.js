// ============================================================
// useSubscribers — GET /api/admin/newsletter (paginé).
// confirmation_token est retiré par NewsletterSubscriber.toJSON() côté
// backend, il est donc intentionnellement absent de ce type.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const useSubscribers = (opts = {}) => {
  const page = opts.page ?? 1;
  const perPage = opts.perPage ?? 20;
  return useQuery({
    queryKey: ['admin', 'newsletter', { page, perPage }],
    queryFn: () => apiGet(`/admin/newsletter?page=${page}&perPage=${perPage}`),
    staleTime: 30 * 1000,
  });
};
