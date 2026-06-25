// ============================================================
// useCreateActivity — POST /api/admin/activities.
// Invalide la query de liste pour que la nouvelle ligne apparaisse au retour.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@api/client';
export const useCreateActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'activities', 'create'],
    mutationFn: (payload) => apiPost('/admin/activities', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'activities'] });
    },
  });
};
