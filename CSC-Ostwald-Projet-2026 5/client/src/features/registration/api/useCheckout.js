// ============================================================
// useCheckout — POST /api/payment/checkout.
//
// En cas de succès, le backend renvoie une URL vers laquelle rediriger
// l'utilisateur (checkout HelloAsso réel OU le mock-success local).
// L'appelant est responsable de faire `window.location.href = checkoutUrl`
// — on ne le fait pas ici pour que le hook reste testable et réutilisable.
// ============================================================
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@api/client';
export const useCheckout = () =>
  useMutation({
    mutationKey: ['payment', 'checkout'],
    mutationFn: (payload) => apiPost('/payment/checkout', payload),
  });
