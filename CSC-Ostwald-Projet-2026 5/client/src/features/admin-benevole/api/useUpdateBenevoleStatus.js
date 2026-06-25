// ============================================================
// useUpdateBenevoleStatus — PATCH /api/admin/benevole/:id/status.
// Body: { status: 'new' | 'contacted' | 'rejected' }
// Invalide la query de liste en cas de succès.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@api/client';
export const useUpdateBenevoleStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'benevole', 'update-status'],
    mutationFn: ({ id, status }) => apiPatch(`/admin/benevole/${id}/status`, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'benevole'] });
    },
  });
};
