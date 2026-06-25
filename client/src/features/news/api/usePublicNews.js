// ============================================================
// usePublicNews — GET /api/news?limit=N. Lecture publique pour la
// section « Nos actualités » de l'Accueil. Renvoie les lignes publiées
// triées par date_published DESC.
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';

export const usePublicNews = ({ limit } = {}) => {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  return useQuery({
    queryKey: ['public', 'news', { limit: limit ?? null }],
    queryFn: () => apiGet(`/news${qs ? `?${qs}` : ''}`),
    // Les actualités changent deux ou trois fois par mois — on garde le
    // cache une heure pour éviter de marteler l'API à chaque retour sur
    // l'accueil.
    staleTime: 60 * 60 * 1000,
  });
};
