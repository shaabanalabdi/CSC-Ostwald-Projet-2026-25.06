// ============================================================
// useUpdateEvent — PATCH /api/admin/events/:id.
// Invalide à la fois le cache de liste ET celui de l'enregistrement unique.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@api/client';
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'events', 'update'],
    mutationFn: ({ id, payload }) => apiPatch(`/admin/events/${id}`, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events', 'one', variables.id] });
    },
  });
};
