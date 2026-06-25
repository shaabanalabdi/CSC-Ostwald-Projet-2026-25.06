// ============================================================
// AdminNewsletter.jsx — Page admin des abonnés à la newsletter.
//
// Surface plus réduite que messages/benevole : juste liste + suppression
// (droit à l'oubli RGPD). La confirmation se fait par double opt-in via
// lien e-mail, donc l'admin ne bascule pas manuellement is_confirmed.
//
// Deux raccourcis d'export :
//   - « Copier les emails confirmés » → presse-papiers, prêt à coller
//     dans un outil d'emailing.
//   - « Exporter CSV » → export complet (statut, dates, etc.) pour Excel.
// ============================================================
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isApiError } from '@api/client';
import { useSubscribers, useDeleteSubscriber } from '@features/admin-newsletter';
import PageSEO from '@components/layout/PageSEO';
import ExportCsvButton from '@components/ui/ExportCsvButton';
import SearchInput from '@components/ui/SearchInput';
import { normalize } from '@utils/string';
import './AdminNewsletter.scss';
const PER_PAGE = 50;
function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
export default function AdminNewsletter() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useSubscribers({
    page,
    perPage: PER_PAGE,
  });
  const deleteMutation = useDeleteSubscriber();
  const [copyState, setCopyState] = useState('idle');
  const [query, setQuery] = useState('');
  // Filtre côté client — seule la page courante est filtrée (le serveur
  // renvoie PER_PAGE éléments à la fois). Avec ~50/page cela couvre la
  // plupart des besoins ; passer à un `?q=` côté serveur si la table
  // dépasse quelques centaines de lignes.
  const filteredItems = useMemo(() => {
    if (!data) return [];
    const q = normalize(query.trim());
    if (!q) return data.items;
    return data.items.filter((s) => normalize(s.email).includes(q));
  }, [data, query]);
  const handleDelete = (sub) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(
      `Supprimer définitivement l'abonné « ${sub.email} » ? Action irréversible.`
    );
    if (ok) deleteMutation.mutate(sub.id);
  };
  const handleCopyEmails = async () => {
    if (!data || data.items.length === 0) return;
    const confirmedOnly = data.items.filter((s) => s.is_confirmed === 1);
    const text = confirmedOnly.map((s) => s.email).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('ok');
    } catch {
      setCopyState('fail');
    }
    window.setTimeout(() => setCopyState('idle'), 2500);
  };
  return (
    <>
      <PageSEO
        title="Abonnés newsletter — Admin CSC Ostwald"
        description="Liste des abonnés newsletter"
        url="/admin/newsletter"
      />
      <div className="admin-newsletter">
        <header className="admin-newsletter__header">
          <div>
            <Link to="/admin/dashboard" className="admin-newsletter__back">
              ← Dashboard
            </Link>
            <h1 className="admin-newsletter__title">
              Abonnés newsletter
              {data && <span className="admin-newsletter__count">{data.total} au total</span>}
            </h1>
          </div>
          <div className="admin-newsletter__actions">
            <SearchInput
              id="newsletter-search"
              value={query}
              onChange={setQuery}
              placeholder="Filtrer par email…"
            />
            <button
              type="button"
              className="admin-newsletter__btn"
              onClick={() => void handleCopyEmails()}
              disabled={isLoading || !data || data.items.length === 0}
            >
              {copyState === 'ok' && 'Copié ✓'}
              {copyState === 'fail' && 'Échec copie'}
              {copyState === 'idle' && 'Copier les emails confirmés'}
            </button>
            <ExportCsvButton
              path="/admin/newsletter/export.csv"
              filename="newsletter.csv"
              className="admin-newsletter__btn"
              disabled={isLoading}
            />
            <button
              type="button"
              className="admin-newsletter__btn"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              Actualiser
            </button>
          </div>
        </header>

        {isLoading && (
          <p className="admin-newsletter__state" role="status">
            Chargement…
          </p>
        )}

        {isError && (
          <p className="admin-newsletter__state admin-newsletter__state--error" role="alert">
            Erreur : {isApiError(error) ? error.message : 'Réessayez plus tard.'}
          </p>
        )}

        {data && data.items.length === 0 && (
          <p className="admin-newsletter__state" role="status">
            Aucun abonné pour l&apos;instant.
          </p>
        )}

        {data && data.items.length > 0 && (
          <>
            {query && (
              <p className="admin-newsletter__state" role="status">
                {filteredItems.length} résultat{filteredItems.length === 1 ? '' : 's'} sur cette
                page pour « {query} »
              </p>
            )}
            <div className="admin-newsletter__table-wrap">
              <table className="admin-newsletter__table">
                <thead>
                  <tr>
                    <th scope="col">Email</th>
                    <th scope="col">Statut</th>
                    <th scope="col">Inscrit le</th>
                    <th scope="col">Confirmé le</th>
                    <th scope="col" className="admin-newsletter__th-actions">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((sub) => (
                    <tr
                      key={sub.id}
                      className={sub.is_confirmed === 0 ? 'admin-newsletter__row--pending' : ''}
                    >
                      <td>
                        <a href={`mailto:${sub.email}`}>{sub.email}</a>
                      </td>
                      <td>
                        <span
                          className={`admin-newsletter__badge admin-newsletter__badge--${sub.is_confirmed === 1 ? 'confirmed' : 'pending'}`}
                        >
                          {sub.is_confirmed === 1 ? 'Confirmé' : 'En attente'}
                        </span>
                      </td>
                      <td>{formatDate(sub.subscribed_at)}</td>
                      <td>{formatDate(sub.confirmed_at)}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-newsletter__delete"
                          onClick={() => handleDelete(sub)}
                          disabled={deleteMutation.isPending && deleteMutation.variables === sub.id}
                          aria-label={`Supprimer ${sub.email}`}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.totalPages > 1 && (
              <nav className="admin-newsletter__pagination" aria-label="Pagination">
                <button
                  type="button"
                  className="admin-newsletter__page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                >
                  ← Précédent
                </button>
                <span className="admin-newsletter__page-label">
                  Page {data.page} sur {data.totalPages}
                </span>
                <button
                  type="button"
                  className="admin-newsletter__page-btn"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages || isLoading}
                >
                  Suivant →
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </>
  );
}
