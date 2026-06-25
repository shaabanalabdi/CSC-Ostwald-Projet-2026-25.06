// ============================================================
// Footer.test.jsx — Tests E2E-ish du formulaire newsletter
//
// Valide le wiring complet : RHF + Zod + React Query + MSW.
// Pas de mocks de modules — on rend le vrai Footer et on interagit
// comme un utilisateur via @testing-library/user-event.
// ============================================================
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import Footer from '../Footer';
describe('Footer — formulaire newsletter', () => {
  it('affiche le champ email et la case RGPD au rendu initial', () => {
    renderWithProviders(<Footer />);
    // Le label sr-only matche via accessible name
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /inscrire/i })).toBeInTheDocument();
  });
  it("affiche l'erreur Zod quand l'email est invalide", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Footer />);
    // Tape un email mal formé, coche RGPD, submit
    await user.type(screen.getByLabelText(/email/i), 'pas-un-email');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /inscrire/i }));
    // Le message d'erreur Zod apparaît (clé i18n footer.emailInvalide → traduite)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
  it("affiche l'erreur RGPD quand l'email est valide mais la case décochée", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Footer />);
    await user.type(screen.getByLabelText(/email/i), 'user@csc-ostwald.fr');
    // PAS de clic sur la case RGPD
    await user.click(screen.getByRole('button', { name: /inscrire/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
  it('envoie la mutation et affiche la confirmation après un submit valide', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Footer />);
    await user.type(screen.getByLabelText(/email/i), 'newsubscriber@csc-ostwald.fr');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /inscrire/i }));
    // MSW (handlers.js) intercepte avec un délai 300ms puis répond 201.
    // Le message de remerciement apparaît via role="status" (aria-live).
    await waitFor(
      () => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
  it("affiche l'erreur backend quand l'email contient « fail » (MSW renvoie 400)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Footer />);
    // Le handler MSW renvoie 400 dès que l'email contient "fail"
    await user.type(screen.getByLabelText(/email/i), 'will-fail@csc-ostwald.fr');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /inscrire/i }));
    await waitFor(
      () => {
        // Le composant affiche un <p role="alert"> avec le message du backend.
        const alerts = screen.getAllByRole('alert');
        const hasBackendMsg = alerts.some((el) => /mock/i.test(el.textContent ?? ''));
        expect(hasBackendMsg).toBe(true);
      },
      { timeout: 2000 }
    );
  });
});
