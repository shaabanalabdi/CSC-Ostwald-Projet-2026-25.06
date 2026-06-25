// ============================================================
// useReorderHeroSlides — PATCH /api/admin/hero/reorder.
// Body: { ids: number[] }. Mise à jour optimiste : on réordonne le
// cache localement tout de suite, on restaure le snapshot si l'appel
// échoue. Même motif que useReorderPartners, adapté au fait que la
// liste Hero est un tableau brut (et non un objet paginé `{ items }`).
// ============================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@api/client';

export const useReorderHeroSlides = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'hero', 'reorder'],
    mutationFn: (ids) => apiPatch('/admin/hero/reorder', { ids }),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'hero'] });
      const snapshots = queryClient.getQueriesData({ queryKey: ['admin', 'hero'] });
      for (const [key, data] of snapshots) {
        // Ignore les entrées qui ne sont pas la liste (ex. ['admin','hero',id]
        // garde une slide seule — un objet, pas un tableau).
        if (!Array.isArray(data)) continue;
        const byId = new Map(data.map((s) => [s.id, s]));
        const reordered = ids.map((id) => byId.get(id)).filter((s) => Boolean(s));
        queryClient.setQueryData(key, reordered);
      }
      return { snapshots };
    },
    onError: (_err, _ids, ctx) => {
      ctx?.snapshots.forEach(([key, prev]) => {
        if (prev) queryClient.setQueryData(key, prev);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'hero'] });
      void queryClient.invalidateQueries({ queryKey: ['public', 'hero'] });
    },
  });
};
