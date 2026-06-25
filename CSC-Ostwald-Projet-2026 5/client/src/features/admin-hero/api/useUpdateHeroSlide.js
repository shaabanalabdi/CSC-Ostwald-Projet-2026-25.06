// ============================================================
// useUpdateHeroSlide — PATCH /api/admin/hero/:id.
// ============================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@api/client';

export const useUpdateHeroSlide = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'hero', 'update'],
    mutationFn: ({ id, payload }) => apiPatch(`/admin/hero/${id}`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'hero'] });
      void queryClient.invalidateQueries({ queryKey: ['public', 'hero'] });
    },
  });
};
