// ============================================================
// usePublicPartners — GET /api/partners (public, sans auth).
//
// Utilisé par la page « Nos partenaires ». Renvoie chaque partenaire
// trié par display_order ASC, id ASC. La page est responsable du
// regroupement par catégorie côté client.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const usePublicPartners = () =>
  useQuery({
    queryKey: ['public', 'partners'],
    queryFn: () => apiGet('/partners'),
    // Les partenaires changent quelques fois par an — un cache long convient.
    staleTime: 60 * 60 * 1000,
  });
