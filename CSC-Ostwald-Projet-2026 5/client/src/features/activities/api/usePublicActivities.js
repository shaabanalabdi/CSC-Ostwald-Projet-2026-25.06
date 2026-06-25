// ============================================================
// usePublicActivities — GET /api/activities?type=...
//
// Alimente les pages publiques /famille et /jeunesse. Seules les lignes
// publiées sont renvoyées par l'API (filtre is_published = 1 appliqué
// côté serveur).
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const usePublicActivities = (type) =>
  useQuery({
    queryKey: ['public', 'activities', type],
    queryFn: () => apiGet(`/activities?type=${type}`),
    // Les activités changent rarement — cache long, même fenêtre que team/partners.
    staleTime: 60 * 60 * 1000,
  });
