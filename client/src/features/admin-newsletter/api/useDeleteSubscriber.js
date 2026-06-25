// ============================================================
// useDeleteSubscriber — DELETE /api/admin/newsletter/:id.
// GDPR right-to-be-forgotten path (permanent).
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete } from '@api/client';
export const useDeleteSubscriber = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'newsletter', 'delete'],
    mutationFn: (id) => apiDelete(`/admin/newsletter/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'newsletter'] });
    },
  });
};
