// ============================================================
// AdminActivities.jsx — Admin list of all activities.
//
// Type filter (Famille / Jeunesse / Régulière / Toutes), "publié"
// badge, edit + delete actions, "Nouvelle activité" CTA.
// ============================================================
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isApiError } from '@api/client';
import { useActivities, useDeleteActivity, ACTIVITY_TYPES } from '@features/admin-activities';
import PageSEO from '@components/layout/PageSEO';
import SearchInput from '@components/ui/SearchInput';
import { normalize } from '@utils/string';
import './AdminActivities.scss';
const PER_PAGE = 20;
const TYPE_LABELS = {
  famille: 'Famille',
  jeunesse: 'Jeunesse',
  reguliere: 'Régulière',
};
export default function AdminActivities() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const { data, isLoading, isError, error, refetch } = useActivities({
    page,
    perPage: PER_PAGE,
    type: typeFilter === '' ? undefined : typeFilter,
  });
  const deleteMutation = useDeleteActivity();
  const [query, setQuery] = useState('');
  const filteredItems = useMemo(() => {
    if (!data) return [];
    const q = normalize(query.trim());
    if (!q) return data.items;
    return data.items.filter((a) =>
      normalize(`${a.title} ${a.categorie_label ?? ''} ${a.lieu ?? ''}`).includes(q)
    );
  }, [data, query]);
  const handleDelete = (activity) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(`Supprimer définitivement l'activité « ${activity.title} » ?`);
    if (ok) deleteMutation.mutate(activity.id);
  };
  const handleTypeChange = (next) => {
    setTypeFilter(next);
    setPage(1);
  };
  return (
    <>
      <PageSEO
        title="Activités — Admin CSC Ostwald"
        description="Gestion des activités du CSC"
        url="/admin/activities"
      />
      <div className="admin-activities">
        <header className="admin-activities__header">
          <div>
            <Link to="/admin/dashboard" className="admin-activities__back">
              ← Dashboard
            </Link>
            <h1 className="admin-activities__title">
              Activités
              {data && <span className="admin-activities__count">{data.total} au total</span>}
            </h1>
          </div>
          <div className="admin-activities__actions">
            <SearchInput
              id="activities-search"
              value={query}
              onChange={setQuery}
              placeholder="Rechercher (titre, lieu, catégorie)…"
            />
            <Link to="/admin/activities/new" className="admin-activities__cta">
              + Nouvelle activité
            </Link>
            <button
              type="button"
              className="admin-activities__btn"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              Actualiser
            </button>
          </div>
        </header>

        <nav className="admin-activities__filters" aria-label="Filtrer par type">
          <button
            type="button"
            className={`admin-activities__chip ${typeFilter === '' ? 'admin-activities__chip--active' : ''}`}
            onClick={() => handleTypeChange('')}
          >
            Toutes
          </button>
          {ACTIVITY_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`admin-activities__chip admin-activities__chip--${t} ${typeFilter === t ? 'admin-activities__chip--active' : ''}`}
              onClick={() => handleTypeChange(t)}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </nav>

        {isLoading && (
          <p className="admin-activities__state" role="status">
            Chargement…
          </p>
        )}

        {isError && (
          <p className="admin-activities__state admin-activities__state--error" role="alert">
            Erreur : {isApiError(error) ? error.message : 'Réessayez plus tard.'}
          </p>
        )}

        {data && data.items.length === 0 && (
          <p className="admin-activities__state" role="status">
            Aucune activité pour ce filtre.
          </p>
        )}

        {data && data.items.length > 0 && (
          <>
            {query && (
              <p className="admin-activities__state" role="status">
                {filteredItems.length} résultat{filteredItems.length === 1 ? '' : 's'} pour «{' '}
                {query} »
              </p>
            )}
            <ul className="admin-activities__list">
              {filteredItems.map((act) => (
                <li
                  key={act.id}
                  className={`admin-activities__card admin-activities__card--${act.activity_type} ${act.is_published === 0 ? 'admin-activities__card--draft' : ''}`}
                >
                  <div className="admin-activities__card-meta">
                    <span
                      className={`admin-activities__type admin-activities__type--${act.activity_type}`}
                    >
                      {TYPE_LABELS[act.activity_type]}
                    </span>
                    {act.is_published === 0 && (
                      <span className="admin-activities__draft-badge">Brouillon</span>
                    )}
                  </div>

                  <h2 className="admin-activities__name">{act.title}</h2>

                  <dl className="admin-activities__props">
                    {act.lieu && (
                      <>
                        <dt>Lieu</dt>
                        <dd>{act.lieu}</dd>
                      </>
                    )}
                    {(act.jour || act.horaire) && (
                      <>
                        <dt>Quand</dt>
                        <dd>
                          {act.jour}
                          {act.jour && act.horaire ? ' • ' : ''}
                          {act.horaire}
                        </dd>
                      </>
                    )}
                    {act.cout && (
                      <>
                        <dt>Coût</dt>
                        <dd>{act.cout}</dd>
                      </>
                    )}
                    {act.capacite !== null && (
                      <>
                        <dt>Capacité</dt>
                        <dd>{act.capacite}</dd>
                      </>
                    )}
                  </dl>

                  <div className="admin-activities__card-actions">
                    <Link
                      to={`/admin/activities/${act.id}/edit`}
                      className="admin-activities__action admin-activities__action--edit"
                    >
                      Éditer
                    </Link>
                    <button
                      type="button"
                      className="admin-activities__action admin-activities__action--delete"
                      onClick={() => handleDelete(act)}
                      disabled={deleteMutation.isPending && deleteMutation.variables === act.id}
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {data.totalPages > 1 && (
              <nav className="admin-activities__pagination" aria-label="Pagination">
                <button
                  type="button"
                  className="admin-activities__page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                >
                  ← Précédent
                </button>
                <span className="admin-activities__page-label">
                  Page {data.page} sur {data.totalPages}
                </span>
                <button
                  type="button"
                  className="admin-activities__page-btn"
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
