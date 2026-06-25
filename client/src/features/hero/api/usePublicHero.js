// ============================================================
// usePublicHero — GET /api/hero. Lecture publique pour le carrousel
// Hero de l'Accueil. Renvoie les slides publiées, dans l'ordre du
// carrousel (display_order ASC).
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';

export const usePublicHero = () =>
  useQuery({
    queryKey: ['public', 'hero'],
    queryFn: () => apiGet('/hero'),
    // Le contenu du Hero change rarement (quelques fois par an) — on garde
    // le cache une heure pour ne pas refetch à chaque retour sur l'accueil.
    staleTime: 60 * 60 * 1000,
  });
