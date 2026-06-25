// ============================================================
// useDeleteRegistration — DELETE /api/admin/registrations/:id.
// Suppression définitive — à utiliser avec parcimonie ; en général
// `status: 'refunded'` est préféré pour garder la piste d'audit intacte.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete } from '@api/client';
export const useDeleteRegistration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'registrations', 'delete'],
    mutationFn: (id) => apiDelete(`/admin/registrations/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] });
    },
  });
};
