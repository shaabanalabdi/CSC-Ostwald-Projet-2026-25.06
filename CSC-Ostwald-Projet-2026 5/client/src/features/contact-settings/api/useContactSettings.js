import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';

export const useContactSettings = () =>
  useQuery({
    queryKey: ['contact-settings'],
    queryFn: () => apiGet('/contact-settings'),
    staleTime: 5 * 60 * 1000,
  });
