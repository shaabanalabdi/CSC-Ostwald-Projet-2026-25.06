// ============================================================
// queryClient.js — Instance singleton de TanStack QueryClient
//
// Importée par App.jsx pour wrap toute l'app dans QueryClientProvider.
// Les défauts ici s'appliquent à TOUTES les queries/mutations sauf override
// explicite côté hook.
// ============================================================
import { QueryClient } from '@tanstack/react-query';
import { isApiError } from './client';
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 30 s — durée pendant laquelle une query est considérée « fraîche ».
      // Évite les re-fetch agressifs au montage d'un composant qui consomme
      // la même clé. Pour des données très volatiles, override côté hook.
      staleTime: 30_000,
      // 5 min — durée de conservation en cache après le dernier observer.
      gcTime: 5 * 60_000,
      // Pas de retry sur erreurs 4xx — c'est un bug côté client, retry est inutile.
      // Sur 5xx ou network, on retry 2x avec backoff exponentiel par défaut.
      retry: (failureCount, error) => {
        if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
      // Refetch silencieusement quand l'utilisateur revient sur l'onglet —
      // assure des données fraîches sans bloquer l'UI.
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Mutations : pas de retry par défaut. Une création envoyée 2 fois
      // peut produire des doublons (newsletter, contact, bénévole).
      retry: false,
    },
  },
});
