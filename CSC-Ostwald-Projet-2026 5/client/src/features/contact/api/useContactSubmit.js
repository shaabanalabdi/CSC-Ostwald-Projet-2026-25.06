// ============================================================
// useContactSubmit — Mutation pour POST /api/contact
// ============================================================
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@api/client';
/**
 * Hook React Query pour envoyer un message de contact.
 */
export const useContactSubmit = () =>
  useMutation({
    mutationKey: ['contact', 'submit'],
    mutationFn: (payload) => apiPost('/contact', payload),
  });
