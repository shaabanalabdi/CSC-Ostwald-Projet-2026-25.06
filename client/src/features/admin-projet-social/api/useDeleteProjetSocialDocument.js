// ============================================================
// useDeleteProjetSocialDocument — DELETE /api/admin/projet-social/documents/:id.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete } from '@api/client';
export const useDeleteProjetSocialDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'projet-social', 'documents', 'delete'],
    mutationFn: (id) => apiDelete(`/admin/projet-social/documents/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'projet-social'] });
      void queryClient.invalidateQueries({ queryKey: ['public', 'projet-social'] });
    },
  });
};
