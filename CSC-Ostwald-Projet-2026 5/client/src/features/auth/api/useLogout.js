// ============================================================
// useLogout — Hook de mutation POST /api/auth/logout.
// Le backend efface le cookie ; l'appelant est responsable d'invalider
// tout état d'auth en cache (useMe) et de rediriger hors de /admin/*.
// ============================================================
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@api/client';
export const useLogout = () =>
  useMutation({
    mutationKey: ['auth', 'logout'],
    mutationFn: () => apiPost('/auth/logout', {}),
  });
