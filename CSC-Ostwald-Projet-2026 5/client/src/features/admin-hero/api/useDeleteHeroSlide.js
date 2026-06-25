// ============================================================
// useDeleteHeroSlide — DELETE /api/admin/hero/:id.
// ============================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete } from '@api/client';

export const useDeleteHeroSlide = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'hero', 'delete'],
    mutationFn: (id) => apiDelete(`/admin/hero/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'hero'] });
      void queryClient.invalidateQueries({ queryKey: ['public', 'hero'] });
    },
  });
};
