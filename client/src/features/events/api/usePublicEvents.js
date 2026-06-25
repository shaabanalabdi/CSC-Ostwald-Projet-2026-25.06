// ============================================================
// usePublicEvents — GET /api/events/upcoming.
//
// Utilisé par le carrousel AgendaEvenements de la page d'accueil. Le
// backend filtre déjà les événements avec `show_in_agenda = 1` ET
// `date_event >= NOW()`, triés par ordre croissant — aucun filtre côté
// client nécessaire. Borné côté serveur (1..50) ; on demande 20 ici, ce
// qui couvre toute fenêtre d'agenda réaliste.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const usePublicEvents = (opts = {}) => {
  const limit = opts.limit ?? 20;
  return useQuery({
    queryKey: ['public', 'events', 'upcoming', { limit }],
    queryFn: () => apiGet(`/events/upcoming?limit=${limit}`),
    // L'agenda se met à jour plus souvent que team/partners — on garde
    // le cache plus serré pour qu'un nouvel événement ajouté le matin
    // apparaisse l'après-midi sans rafraîchissement forcé.
    staleTime: 5 * 60 * 1000,
  });
};
