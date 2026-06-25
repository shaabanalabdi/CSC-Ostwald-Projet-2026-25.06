import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';

export const usePublicProgrammeMensuel = () =>
  useQuery({
    queryKey: ['public', 'programme-mensuel'],
    queryFn: () => apiGet('/programme-mensuel'),
    staleTime: 30 * 60 * 1000,
  });
