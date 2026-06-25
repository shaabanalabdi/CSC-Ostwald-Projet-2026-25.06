// ============================================================
// useDeleteEvent — DELETE /api/admin/events/:id.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete } from '@api/client';
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'events', 'delete'],
    mutationFn: (id) => apiDelete(`/admin/events/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
    },
  });
};
