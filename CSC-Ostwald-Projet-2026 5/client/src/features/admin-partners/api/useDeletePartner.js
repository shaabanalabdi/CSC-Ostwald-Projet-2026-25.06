// ============================================================
// useDeletePartner — DELETE /api/admin/partners/:id.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete } from '@api/client';
export const useDeletePartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'partners', 'delete'],
    mutationFn: (id) => apiDelete(`/admin/partners/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
    },
  });
};
