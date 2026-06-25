// ============================================================
// useDeleteMessage — DELETE /api/admin/messages/:id.
// Invalide la query de liste en cas de succès.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete } from '@api/client';
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'messages', 'delete'],
    mutationFn: (id) => apiDelete(`/admin/messages/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] });
    },
  });
};
