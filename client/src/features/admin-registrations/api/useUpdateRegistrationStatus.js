// ============================================================
// useUpdateRegistrationStatus — PATCH /api/admin/registrations/:id/status.
// Body: { status: 'pending' | 'paid' | 'refunded' }
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@api/client';
export const useUpdateRegistrationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'registrations', 'update-status'],
    mutationFn: ({ id, status }) => apiPatch(`/admin/registrations/${id}/status`, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] });
    },
  });
};
