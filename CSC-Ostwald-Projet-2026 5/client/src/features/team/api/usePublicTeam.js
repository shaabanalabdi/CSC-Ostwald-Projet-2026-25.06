// ============================================================
// usePublicTeam — GET /api/team (public, sans auth).
//
// Utilisé par la page « Qui sommes-nous ». Renvoie chaque membre de
// l'équipe trié par display_order (curé par l'admin). Le backend ne
// retire aucun champ — voir TeamMember.toPublicJSON — car la carte
// d'équipe publique affiche à la fois l'e-mail et le téléphone.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@api/client';
export const usePublicTeam = () =>
  useQuery({
    queryKey: ['public', 'team'],
    queryFn: () => apiGet('/team'),
    // L'équipe change rarement ; la page peut garder ceci une heure. Les
    // mutations de l'admin contournent quand même ce cache car elles
    // invalident ['admin', 'team'] qui est une clé différente.
    staleTime: 60 * 60 * 1000,
  });
