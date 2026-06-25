// ============================================================
// useDeleteTeamMember — DELETE /api/admin/team/:id.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete } from '@api/client';
export const useDeleteTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'team', 'delete'],
    mutationFn: (id) => apiDelete(`/admin/team/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'team'] });
    },
  });
};
