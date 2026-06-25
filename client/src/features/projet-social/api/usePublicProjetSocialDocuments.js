// ============================================================
// usePublicProjetSocialDocuments — GET /api/projet-social/documents.
// Lecture publique pour la page « Projet Social ». Renvoie les
// documents publiés triés par display_order ASC, id ASC.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const usePublicProjetSocialDocuments = () =>
  useQuery({
    queryKey: ['public', 'projet-social', 'documents'],
    queryFn: () => apiGet('/projet-social/documents'),
    // Les documents changent rarement — un cache long convient.
    staleTime: 60 * 60 * 1000,
  });
