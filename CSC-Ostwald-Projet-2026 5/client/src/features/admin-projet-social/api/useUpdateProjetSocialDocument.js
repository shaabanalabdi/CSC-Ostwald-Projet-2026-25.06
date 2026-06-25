// ============================================================
// useUpdateProjetSocialDocument — PATCH /api/admin/projet-social/documents/:id.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@api/client';
export const useUpdateProjetSocialDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'projet-social', 'documents', 'update'],
    mutationFn: ({ id, payload }) => apiPatch(`/admin/projet-social/documents/${id}`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'projet-social'] });
      void queryClient.invalidateQueries({ queryKey: ['public', 'projet-social'] });
    },
  });
};
