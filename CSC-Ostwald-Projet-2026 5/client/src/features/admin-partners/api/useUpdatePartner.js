// ============================================================
// useUpdatePartner — PATCH /api/admin/partners/:id.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@api/client';
export const useUpdatePartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'partners', 'update'],
    mutationFn: ({ id, payload }) => apiPatch(`/admin/partners/${id}`, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partners', 'one', variables.id] });
    },
  });
};
