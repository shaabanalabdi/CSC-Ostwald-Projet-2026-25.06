// ============================================================
// useResetPassword — Hook de mutation POST /api/auth/reset-password.
//
// Envoie le token (lu depuis l'URL) et le nouveau mot de passe.
// 204 → succès, rediriger vers /admin/login.
// 400 → token invalide/expiré ou mot de passe trop court.
// ============================================================
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@api/client';

export const useResetPassword = () =>
  useMutation({
    mutationKey: ['auth', 'reset-password'],
    mutationFn: (payload) => apiPost('/auth/reset-password', payload),
  });
