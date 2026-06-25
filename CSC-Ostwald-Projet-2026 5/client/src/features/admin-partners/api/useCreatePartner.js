// ============================================================
// useCreatePartner — POST /api/admin/partners.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@api/client';
export const useCreatePartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'partners', 'create'],
    mutationFn: (payload) => apiPost('/admin/partners', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
    },
  });
};
