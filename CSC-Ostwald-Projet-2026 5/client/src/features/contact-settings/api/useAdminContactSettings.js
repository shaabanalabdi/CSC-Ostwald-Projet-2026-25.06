import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@api/client';

const QK = ['admin', 'contact-settings'];

export const useAdminContactSettings = () =>
  useQuery({ queryKey: QK, queryFn: () => apiGet('/admin/contact-settings') });

export const useUpdateContactSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiPatch('/admin/contact-settings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
      qc.invalidateQueries({ queryKey: ['contact-settings'] });
    },
  });
};
