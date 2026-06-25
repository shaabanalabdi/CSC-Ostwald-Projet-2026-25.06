// ============================================================
// renderWithProviders.jsx — Helper de rendu pour les tests composants
//
// Wrap le composant testé dans la même pile de providers que prod :
//   - QueryClientProvider (pour useMutation / useQuery)
//   - BrowserRouter (pour <Link> et useLocation)
//
// i18n est initialisé en module-level via l'import de `@/i18n`, ce qui
// suffit à react-i18next pour exposer t() sans I18nextProvider explicite.
//
// Chaque test reçoit un QueryClient frais (mutations isolées entre tests).
// ============================================================
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
// Initialise i18next (effet de bord à l'import). Une seule fois par run de test.
import '@/i18n';
/** Construit un QueryClient frais : retry désactivé pour des erreurs instantanées. */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      // Pas de retry en tests — on veut voir l'erreur tout de suite,
      // pas attendre 2 retries × backoff exponentiel.
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
/**
 * Wrappe un élément React dans QueryClientProvider + BrowserRouter et le rend
 * via @testing-library/react. Retourne tout ce que `render()` retourne, plus
 * le `queryClient` créé (utile pour le seed manuel ou les assertions de cache).
 */
export function renderWithProviders(ui, options) {
  const queryClient = createTestQueryClient();
  const result = render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    ),
    ...options,
  });
  return { ...result, queryClient };
}
