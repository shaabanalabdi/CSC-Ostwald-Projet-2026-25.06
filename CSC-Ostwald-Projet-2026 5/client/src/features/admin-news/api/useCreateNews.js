// ============================================================
// useCreateNews — POST /api/admin/news.
// Invalidates both admin and public news caches on success.
// ============================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@api/client';

export const useCreateNews = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'news', 'create'],
    mutationFn: (payload) => apiPost('/admin/news', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
      void queryClient.invalidateQueries({ queryKey: ['public', 'news'] });
    },
  });
};
