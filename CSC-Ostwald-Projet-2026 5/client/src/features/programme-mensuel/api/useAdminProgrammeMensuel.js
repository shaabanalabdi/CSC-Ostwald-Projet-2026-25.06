import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@api/client';

const QK = ['admin', 'programme-mensuel'];

export const useAdminProgrammeMensuel = () =>
  useQuery({ queryKey: QK, queryFn: () => apiGet('/admin/programme-mensuel') });

export const useCreateProgramme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiPost('/admin/programme-mensuel', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
};

export const useUpdateProgramme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => apiPatch(`/admin/programme-mensuel/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
};

export const useDeleteProgramme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiDelete(`/admin/programme-mensuel/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
};
