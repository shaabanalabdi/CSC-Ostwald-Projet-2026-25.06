// ============================================================
// useDeleteNews — DELETE /api/admin/news/:id.
// ============================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete } from '@api/client';

export const useDeleteNews = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'news', 'delete'],
    mutationFn: (id) => apiDelete(`/admin/news/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
      void queryClient.invalidateQueries({ queryKey: ['public', 'news'] });
    },
  });
};
