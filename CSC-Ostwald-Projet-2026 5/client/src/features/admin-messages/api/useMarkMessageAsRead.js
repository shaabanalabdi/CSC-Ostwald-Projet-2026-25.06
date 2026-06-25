// ============================================================
// useMarkMessageAsRead — PATCH /api/admin/messages/:id/read.
// Invalide la query de liste pour que l'UI se re-rende avec le nouvel état.
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@api/client';
export const useMarkMessageAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'messages', 'mark-as-read'],
    mutationFn: (id) => apiPatch(`/admin/messages/${id}/read`),
    onSuccess: () => {
      // Rafraîchit chaque page en cache de la liste des messages — la
      // ligne concernée peut vivre sur n'importe quelle page.
      void queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] });
    },
  });
};
