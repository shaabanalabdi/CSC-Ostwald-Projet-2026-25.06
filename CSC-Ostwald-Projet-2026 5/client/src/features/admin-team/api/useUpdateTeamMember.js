// ============================================================
// useUpdateTeamMember — PATCH /api/admin/team/:id.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@api/client';
export const useUpdateTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'team', 'update'],
    mutationFn: ({ id, payload }) => apiPatch(`/admin/team/${id}`, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'team'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'team', 'one', variables.id] });
    },
  });
};
