// ============================================================
// useBenevoleApply — Mutation pour POST /api/benevole
// ============================================================
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@api/client';
/**
 * Hook React Query pour soumettre une candidature bénévole.
 */
export const useBenevoleApply = () =>
  useMutation({
    mutationKey: ['benevole', 'apply'],
    mutationFn: (payload) => apiPost('/benevole', payload),
  });
