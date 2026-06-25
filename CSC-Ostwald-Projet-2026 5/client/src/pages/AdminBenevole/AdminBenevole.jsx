// ============================================================
// AdminBenevole.jsx — Admin page for volunteer applications.
//
// Three actions per row:
//   - Change status (dropdown: new / contacted / rejected)
//   - Expand full details (domaines, competences, jours, plages, message)
//   - Delete (confirm() then DELETE)
//
// "new" applications get an orange accent border to surface them.
// ============================================================
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isApiError } from '@api/client';
import {
  useBenevoleApplications,
  useUpdateBenevoleStatus,
  useDeleteBenevoleApplication,
} from '@features/admin-benevole';
import PageSEO from '@components/layout/PageSEO';
import ExportCsvButton from '@components/ui/ExportCsvButton';
import SearchInput from '@components/ui/SearchInput';
import { normalize } from '@utils/string';
import './AdminBenevole.scss';
const PER_PAGE = 20;
const STATUS_LABELS = {
  new: 'Nouveau',
  contacted: 'Contacté',
  rejected: 'Refusé',
};
function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
export default function AdminBenevole() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useBenevoleApplications({
    page,
    perPage: PER_PAGE,
  });
  const updateStatusMutation = useUpdateBenevoleStatus();
  const deleteMutation = useDeleteBenevoleApplication();
  const [query, setQuery] = useState('');
  const filteredItems = useMemo(() => {
    if (!data) return [];
    const q = normalize(query.trim());
    if (!q) return data.items;
    return data.items.filter((app) =>
      normalize(`${app.prenom} ${app.nom} ${app.email}`).includes(q)
    );
  }, [data, query]);
  const handleStatusChange = (id, status) => {
    updateStatusMutation.mutate({ id, status });
  };
  const handleDelete = (app) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(
      `Supprimer définitivement la candidature de ${app.prenom} ${app.nom} ?`
    );
    if (ok) deleteMutation.mutate(app.id);
  };
  return (
    <>
      <PageSEO
        title="Candidatures bénévoles — Admin CSC Ostwald"
        description="Gestion des candidatures bénévoles"
        url="/admin/benevole"
      />
      <div className="admin-benevole">
        <header className="admin-benevole__header">
          <div>
            <Link to="/admin/dashboard" className="admin-benevole__back">
              ← Dashboard
            </Link>
            <h1 className="admin-benevole__title">
              Candidatures bénévoles
              {data && <span className="admin-benevole__count">{data.total} au total</span>}
            </h1>
          </div>
          <div className="admin-benevole__actions-header">
            <SearchInput
              id="benevole-search"
              value={query}
              onChange={setQuery}
              placeholder="Rechercher (nom, email)…"
            />
            <ExportCsvButton
              path="/admin/benevole/export.csv"
              filename="benevoles.csv"
              className="admin-benevole__refresh"
              disabled={isLoading}
            />
            <button
              type="button"
              className="admin-benevole__refresh"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              Actualiser
            </button>
          </div>
        </header>

        {isLoading && (
          <p className="admin-benevole__state" role="status">
            Chargement des candidatures…
          </p>
        )}

        {isError && (
          <p className="admin-benevole__state admin-benevole__state--error" role="alert">
            Erreur de chargement : {isApiError(error) ? error.message : 'Réessayez plus tard.'}
          </p>
        )}

        {data && data.items.length === 0 && (
          <p className="admin-benevole__state" role="status">
            Aucune candidature reçue pour l&apos;instant.
          </p>
        )}

        {data && data.items.length > 0 && (
          <>
            {query && (
              <p className="admin-benevole__state" role="status">
                {filteredItems.length} résultat{filteredItems.length === 1 ? '' : 's'} pour «{' '}
                {query} »
              </p>
            )}
            <ul className="admin-benevole__list">
              {filteredItems.map((app) => (
                <li
                  key={app.id}
                  className={`admin-benevole__card admin-benevole__card--${app.status}`}
                >
                  <div className="admin-benevole__card-meta">
                    <div className="admin-benevole__card-status-wrap">
                      <label htmlFor={`bv-status-${app.id}`} className="admin-benevole__sr">
                        Statut
                      </label>
                      <select
                        id={`bv-status-${app.id}`}
                        className={`admin-benevole__status admin-benevole__status--${app.status}`}
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        disabled={
                          updateStatusMutation.isPending &&
                          updateStatusMutation.variables?.id === app.id
                        }
                      >
                        {Object.keys(STATUS_LABELS).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <time className="admin-benevole__date" dateTime={app.created_at}>
                      {formatDate(app.created_at)}
                    </time>
                  </div>

                  <h2 className="admin-benevole__from">
                    {app.prenom} {app.nom}
                  </h2>
                  <p className="admin-benevole__contact">
                    <a href={`mailto:${app.email}`}>{app.email}</a>
                    {app.telephone && (
                      <>
                        {' '}
                        • <a href={`tel:${app.telephone}`}>{app.telephone}</a>
                      </>
                    )}
                  </p>

                  <dl className="admin-benevole__tags">
                    {app.domaines.length > 0 && (
                      <>
                        <dt>Domaines</dt>
                        <dd>
                          {app.domaines.map((d) => (
                            <span key={d} className="admin-benevole__tag">
                              {d}
                            </span>
                          ))}
                        </dd>
                      </>
                    )}
                    {app.competences.length > 0 && (
                      <>
                        <dt>Compétences</dt>
                        <dd>
                          {app.competences.map((c) => (
                            <span key={c} className="admin-benevole__tag">
                              {c}
                            </span>
                          ))}
                        </dd>
                      </>
                    )}
                    {app.jours.length > 0 && (
                      <>
                        <dt>Jours</dt>
                        <dd>
                          {app.jours.map((j) => (
                            <span key={j} className="admin-benevole__tag">
                              {j}
                            </span>
                          ))}
                        </dd>
                      </>
                    )}
                    {app.plages.length > 0 && (
                      <>
                        <dt>Plages</dt>
                        <dd>
                          {app.plages.map((p) => (
                            <span key={p} className="admin-benevole__tag">
                              {p}
                            </span>
                          ))}
                        </dd>
                      </>
                    )}
                  </dl>

                  {app.message && (
                    <details className="admin-benevole__full">
                      <summary>Message du candidat</summary>
                      <p className="admin-benevole__full-body">{app.message}</p>
                    </details>
                  )}

                  <div className="admin-benevole__actions">
                    <button
                      type="button"
                      className="admin-benevole__action admin-benevole__action--delete"
                      onClick={() => handleDelete(app)}
                      disabled={deleteMutation.isPending && deleteMutation.variables === app.id}
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {data.totalPages > 1 && (
              <nav className="admin-benevole__pagination" aria-label="Pagination">
                <button
                  type="button"
                  className="admin-benevole__page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                >
                  ← Précédent
                </button>
                <span className="admin-benevole__page-label">
                  Page {data.page} sur {data.totalPages}
                </span>
                <button
                  type="button"
                  className="admin-benevole__page-btn"
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
