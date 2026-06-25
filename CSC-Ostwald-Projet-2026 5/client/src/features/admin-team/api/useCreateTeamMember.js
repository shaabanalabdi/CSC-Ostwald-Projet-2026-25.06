// ============================================================
// useCreateTeamMember — POST /api/admin/team.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@api/client';
export const useCreateTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'team', 'create'],
    mutationFn: (payload) => apiPost('/admin/team', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'team'] });
    },
  });
};
