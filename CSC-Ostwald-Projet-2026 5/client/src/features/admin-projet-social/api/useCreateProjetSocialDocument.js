// ============================================================
// useCreateProjetSocialDocument — POST /api/admin/projet-social/documents.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@api/client';
export const useCreateProjetSocialDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'projet-social', 'documents', 'create'],
    mutationFn: (payload) => apiPost('/admin/projet-social/documents', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'projet-social'] });
      void queryClient.invalidateQueries({ queryKey: ['public', 'projet-social'] });
    },
  });
};
