// ============================================================
// useDeleteActivity — DELETE /api/admin/activities/:id.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete } from '@api/client';
export const useDeleteActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'activities', 'delete'],
    mutationFn: (id) => apiDelete(`/admin/activities/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'activities'] });
    },
  });
};
