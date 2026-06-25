// ============================================================
// useForgotPassword — Hook de mutation POST /api/auth/forgot-password.
//
// Le backend répond toujours 204 (même si l'e-mail est inconnu) pour
// ne pas divulguer quels comptes existent. Le frontend affiche donc
// un message de confirmation neutre dans tous les cas.
// ============================================================
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@api/client';

export const useForgotPassword = () =>
  useMutation({
    mutationKey: ['auth', 'forgot-password'],
    mutationFn: (payload) => apiPost('/auth/forgot-password', payload),
  });
