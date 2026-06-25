// ============================================================
// useUpdateNews — PATCH /api/admin/news/:id.
// ============================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@api/client';

export const useUpdateNews = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'news', 'update'],
    mutationFn: ({ id, payload }) => apiPatch(`/admin/news/${id}`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
      void queryClient.invalidateQueries({ queryKey: ['public', 'news'] });
    },
  });
};
