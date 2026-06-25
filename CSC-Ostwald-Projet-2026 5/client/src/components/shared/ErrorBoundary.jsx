// ============================================================
// ErrorBoundary.jsx — Capture les erreurs runtime des composants enfants
//
// Class component (React n'a pas d'équivalent fonctionnel pour les error
// boundaries, c'est une limitation officielle). Affiche un fallback UI
// avec 2 actions de récupération (recharger / retour accueil).
//
// Monté UNE fois autour de <AnimatedRoutes> dans App.jsx pour intercepter
// les erreurs de toutes les pages. Pour un fallback par route, créer des
// instances supplémentaires plus bas dans l'arbre.
// ============================================================
import { Component } from 'react';
import './ErrorBoundary.scss';
const INITIAL_STATE = {
  hasError: false,
  error: null,
  componentStack: null,
  copyState: 'idle',
};
export default class ErrorBoundary extends Component {
  state = INITIAL_STATE;
  /** React appelle ceci sur tout throw d'un descendant — renvoie l'état suivant. */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  /**
   * Hook de journalisation — appelé APRÈS la mise à jour de l'état.
   * Dev : console.error verbeux pour que la trace s'affiche dans les
   *       DevTools.
   * Prod : transmet à l'adaptateur léger `reportFrontendError`
   *        (actuellement console.warn + forme adaptée à la télémétrie ;
   *         à remplacer par Sentry / Glitchtip / un endpoint
   *         /api/client-errors personnalisé une fois provisionné).
   *         Échouer silencieusement en production était le comportement
   *         précédent — cela signifiait que les vraies erreurs
   *         utilisateur n'atteignaient jamais l'équipe.
   */
  componentDidCatch(error, info) {
    this.setState({ componentStack: info.componentStack ?? null });
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack);
      return;
    }
    try {
      const payload = {
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: new Date().toISOString(),
        message: error?.message ?? String(error),
        stack: error?.stack ?? null,
        componentStack: info.componentStack ?? null,
      };
      // Visible dans la console DevTools du navigateur pour les tickets
      // de support utilisateur, et apparaît dans le log edge de
      // Vercel/Render si jamais il y arrive. Remplacer ce corps par
      // Sentry.captureException(error, { extra: payload }) le jour où un
      // vrai fournisseur est branché.
      console.warn('[ErrorBoundary:prod]', payload);
    } catch {
      // Les échecs du logger ne doivent jamais casser l'UI de repli.
    }
  }
  /** Copie « <message d'erreur>\n\n<stack> » dans le presse-papiers pour les tickets de support. */
  handleCopyError = async () => {
    const { error, componentStack } = this.state;
    if (!error) return;
    const payload = [
      `URL: ${window.location.href}`,
      `Date: ${new Date().toISOString()}`,
      `Message: ${error.message}`,
      error.stack ? `\nStack:\n${error.stack}` : '',
      componentStack ? `\nComponent stack:\n${componentStack}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    try {
      await navigator.clipboard.writeText(payload);
      this.setState({ copyState: 'ok' });
    } catch {
      this.setState({ copyState: 'fail' });
    }
    window.setTimeout(() => this.setState({ copyState: 'idle' }), 2000);
  };
  render() {
    if (!this.state.hasError) return this.props.children;
    const { error, copyState } = this.state;
    return (
      <div className="error-boundary" role="alert">
        <h2 className="error-boundary__title">Une erreur inattendue est survenue.</h2>
        <p className="error-boundary__text">
          Veuillez recharger la page ou revenir à l&apos;accueil. Si le problème persiste, copiez
          les détails techniques ci-dessous et envoyez-les à{' '}
          <a href="mailto:contact@csc-ostwald.fr">contact@csc-ostwald.fr</a>.
        </p>

        <div className="error-boundary__actions">
          <button
            type="button"
            className="error-boundary__btn error-boundary__btn--primary"
            onClick={() => window.location.reload()}
          >
            Recharger
          </button>
          {/* Hard redirect — réinitialise l'app complètement,
                évite une boucle infinie si l'erreur vient de la page d'accueil */}
          <button
            type="button"
            className="error-boundary__btn error-boundary__btn--outline"
            onClick={() => {
              window.location.href = '/';
            }}
          >
            Retour à l&apos;accueil
          </button>
        </div>

        {error && (
          <details className="error-boundary__details">
            <summary>Détails techniques</summary>
            <pre className="error-boundary__trace">{error.message}</pre>
            <button
              type="button"
              className="error-boundary__btn error-boundary__btn--ghost"
              onClick={() => void this.handleCopyError()}
            >
              {copyState === 'ok' && 'Copié ✓'}
              {copyState === 'fail' && 'Échec de la copie'}
              {copyState === 'idle' && 'Copier le détail de l’erreur'}
            </button>
          </details>
        )}
      </div>
    );
  }
}
