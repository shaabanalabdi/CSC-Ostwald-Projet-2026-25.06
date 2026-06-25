// ============================================================
// useDeleteBenevoleApplication — DELETE /api/admin/benevole/:id.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete } from '@api/client';
export const useDeleteBenevoleApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'benevole', 'delete'],
    mutationFn: (id) => apiDelete(`/admin/benevole/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'benevole'] });
    },
  });
};
