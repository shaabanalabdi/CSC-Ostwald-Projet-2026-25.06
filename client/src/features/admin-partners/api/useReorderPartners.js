// ============================================================
// useReorderPartners — PATCH /api/admin/partners/reorder.
// Body: { ids: number[] }. Même motif optimiste que
// useReorderTeamMembers — voir ce fichier pour la justification.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@api/client';
export const useReorderPartners = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'partners', 'reorder'],
    mutationFn: (ids) => apiPatch('/admin/partners/reorder', { ids }),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'partners'] });
      const snapshots = queryClient.getQueriesData({
        queryKey: ['admin', 'partners'],
      });
      for (const [key, data] of snapshots) {
        if (!data) continue;
        const byId = new Map(data.items.map((p) => [p.id, p]));
        const reordered = ids.map((id) => byId.get(id)).filter((p) => Boolean(p));
        queryClient.setQueryData(key, { ...data, items: reordered });
      }
      return { snapshots };
    },
    onError: (_err, _ids, ctx) => {
      ctx?.snapshots.forEach(([key, prev]) => {
        if (prev) queryClient.setQueryData(key, prev);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
      void queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });
};
