// ============================================================
// useNewsletterSubscribe — Mutation pour POST /api/newsletter
// ============================================================
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@api/client';
/**
 * Hook React Query pour s'inscrire à la newsletter.
 *
 * @example
 *   const subscribe = useNewsletterSubscribe();
 *   const onSubmit = (data: NewsletterFormValues) => {
 *     subscribe.mutate({ email: data.email });
 *   };
 *   {subscribe.isError && <p>{subscribe.error.message}</p>}
 *   {subscribe.isSuccess && <p>Merci !</p>}
 */
export const useNewsletterSubscribe = () =>
  useMutation({
    mutationKey: ['newsletter', 'subscribe'],
    mutationFn: (payload) => apiPost('/newsletter', payload),
  });
