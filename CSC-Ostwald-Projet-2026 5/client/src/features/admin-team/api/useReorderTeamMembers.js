// ============================================================
// useReorderTeamMembers — PATCH /api/admin/team/reorder.
// Body: { ids: number[] }. Mise à jour optimiste : la liste admin
// affiche immédiatement le nouvel ordre, le serveur confirme, le refetch
// réconcilie. En cas d'échec le snapshot est restauré pour que l'UI
// corresponde à la réalité.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@api/client';
export const useReorderTeamMembers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'team', 'reorder'],
    mutationFn: (ids) => apiPatch('/admin/team/reorder', { ids }),
    onMutate: async (ids) => {
      // Annule toute query en vol qui écraserait notre mise à jour
      // optimiste en cours de route.
      await queryClient.cancelQueries({ queryKey: ['admin', 'team'] });
      // Snapshot de chaque page en cache pour que onError puisse restaurer.
      const snapshots = queryClient.getQueriesData({
        queryKey: ['admin', 'team'],
      });
      // Réordonne chaque page en cache selon le nouveau tableau d'ids.
      for (const [key, data] of snapshots) {
        if (!data) continue;
        const byId = new Map(data.items.map((m) => [m.id, m]));
        const reordered = ids.map((id) => byId.get(id)).filter((m) => Boolean(m));
        queryClient.setQueryData(key, { ...data, items: reordered });
      }
      return { snapshots };
    },
    onError: (_err, _ids, ctx) => {
      // Restaure chaque snapshot qu'on a muté.
      ctx?.snapshots.forEach(([key, prev]) => {
        if (prev) queryClient.setQueryData(key, prev);
      });
    },
    onSettled: () => {
      // Réconcilie avec le serveur : refetch des listes ordonnées admin + publique.
      void queryClient.invalidateQueries({ queryKey: ['admin', 'team'] });
      void queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
};
