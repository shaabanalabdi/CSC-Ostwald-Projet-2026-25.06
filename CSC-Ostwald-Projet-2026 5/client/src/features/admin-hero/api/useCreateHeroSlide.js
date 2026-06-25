// ============================================================
// useCreateHeroSlide — POST /api/admin/hero.
// Invalide les caches admin ET public sur succès.
// ============================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@api/client';

export const useCreateHeroSlide = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'hero', 'create'],
    mutationFn: (payload) => apiPost('/admin/hero', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'hero'] });
      void queryClient.invalidateQueries({ queryKey: ['public', 'hero'] });
    },
  });
};
