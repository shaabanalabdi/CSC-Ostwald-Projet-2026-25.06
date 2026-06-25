// ============================================================
// useCreateEvent — POST /api/admin/events.
// Invalide la query de liste pour que la nouvelle ligne apparaisse au retour.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@api/client';
export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'events', 'create'],
    mutationFn: (payload) => apiPost('/admin/events', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
    },
  });
};
