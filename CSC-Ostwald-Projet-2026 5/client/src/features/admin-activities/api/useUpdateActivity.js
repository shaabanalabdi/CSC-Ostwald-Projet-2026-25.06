// ============================================================
// useUpdateActivity — PATCH /api/admin/activities/:id.
// Invalide à la fois le cache de liste ET celui de l'enregistrement unique.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@api/client';
export const useUpdateActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'activities', 'update'],
    mutationFn: ({ id, payload }) => apiPatch(`/admin/activities/${id}`, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'activities'] });
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'activities', 'one', variables.id],
      });
    },
  });
};
