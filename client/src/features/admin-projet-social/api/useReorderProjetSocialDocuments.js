// ============================================================
// useReorderProjetSocialDocuments — PATCH /api/admin/projet-social/documents/reorder.
// Body: { ids: number[] }. La mise à jour optimiste reflète le motif de
// useReorderPartners / useReorderTeamMembers.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@api/client';
export const useReorderProjetSocialDocuments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'projet-social', 'documents', 'reorder'],
    mutationFn: (ids) => apiPatch('/admin/projet-social/documents/reorder', { ids }),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'projet-social'] });
      const snapshots = queryClient.getQueriesData({
        queryKey: ['admin', 'projet-social'],
      });
      for (const [key, data] of snapshots) {
        if (!data) continue;
        const byId = new Map(data.items.map((d) => [d.id, d]));
        const reordered = ids.map((id) => byId.get(id)).filter((d) => Boolean(d));
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
      void queryClient.invalidateQueries({ queryKey: ['admin', 'projet-social'] });
      void queryClient.invalidateQueries({ queryKey: ['public', 'projet-social'] });
    },
  });
};
