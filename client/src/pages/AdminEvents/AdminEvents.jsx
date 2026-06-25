// ============================================================
// AdminEvents.jsx — Liste admin des événements de l'agenda.
//
// Triés DESC par date (les plus récents / à venir d'abord via le défaut
// de l'API — Repository.findPaginated trie par id DESC ce qui reflète
// l'ordre de création ; un tri par date_event nécessiterait une méthode
// de repo personnalisée, gardée pour un suivi si l'équipe trouve l'ordre
// actuel déroutant).
//
// Badge « Brouillon » pour les événements avec show_in_agenda=0 — ils
// existent dans la DB mais n'apparaissent pas sur l'agenda public.
// ============================================================
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isApiError } from '@api/client';
import { useEvents, useDeleteEvent } from '@features/admin-events';
import PageSEO from '@components/layout/PageSEO';
import SearchInput from '@components/ui/SearchInput';
import { normalize } from '@utils/string';
import './AdminEvents.scss';
const PER_PAGE = 20;
function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
export default function AdminEvents() {
  const [page, setPage] = useState(1);
  // Capturé une fois au montage — l'initialiseur de useState est
  // compatible-pureté (contrairement à appeler Date.now() directement
  // dans le render, ce que la règle de pureté du React Compiler rejette).
  // Les badges « Passé » ne se décalent donc pas pendant que
  // l'utilisateur reste sur la page ; un refetch est nécessaire pour les
  // rafraîchir, ce qui est la même UX que tout autre état dérivé du
  // serveur ici.
  const [nowMs] = useState(() => Date.now());
  const { data, isLoading, isError, error, refetch } = useEvents({ page, perPage: PER_PAGE });
  const deleteMutation = useDeleteEvent();
  const [query, setQuery] = useState('');
  const filteredItems = useMemo(() => {
    if (!data) return [];
    const q = normalize(query.trim());
    if (!q) return data.items;
    return data.items.filter((e) =>
      normalize(`${e.title} ${e.description ?? ''} ${e.lieu ?? ''}`).includes(q)
    );
  }, [data, query]);
  const handleDelete = (event) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(`Supprimer définitivement l'événement « ${event.title} » ?`);
    if (ok) deleteMutation.mutate(event.id);
  };
  return (
    <>
      <PageSEO
        title="Événements — Admin CSC Ostwald"
        description="Gestion des événements de l'agenda"
        url="/admin/events"
      />
      <div className="admin-events">
        <header className="admin-events__header">
          <div>
            <Link to="/admin/dashboard" className="admin-events__back">
              ← Dashboard
            </Link>
            <h1 className="admin-events__title">
              Événements
              {data && <span className="admin-events__count">{data.total} au total</span>}
            </h1>
          </div>
          <div className="admin-events__actions">
            <SearchInput
              id="events-search"
              value={query}
              onChange={setQuery}
              placeholder="Rechercher (titre, lieu, description)…"
            />
            <Link to="/admin/events/new" className="admin-events__cta">
              + Nouvel événement
            </Link>
            <button
              type="button"
              className="admin-events__btn"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              Actualiser
            </button>
          </div>
        </header>

        {isLoading && (
          <p className="admin-events__state" role="status">
            Chargement…
          </p>
        )}

        {isError && (
          <p className="admin-events__state admin-events__state--error" role="alert">
            Erreur : {isApiError(error) ? error.message : 'Réessayez plus tard.'}
          </p>
        )}

        {data && data.items.length === 0 && (
          <p className="admin-events__state" role="status">
            Aucun événement enregistré pour l&apos;instant.
          </p>
        )}

        {data && data.items.length > 0 && (
          <>
            {query && (
              <p className="admin-events__state" role="status">
                {filteredItems.length} résultat{filteredItems.length === 1 ? '' : 's'} pour «{' '}
                {query} »
              </p>
            )}
            <ul className="admin-events__list">
              {filteredItems.map((ev) => {
                const isPast = new Date(ev.date_event).getTime() < nowMs;
                return (
                  <li
                    key={ev.id}
                    className={`admin-events__card ${ev.show_in_agenda === 0 ? 'admin-events__card--hidden' : ''} ${isPast ? 'admin-events__card--past' : ''}`}
                  >
                    <div className="admin-events__card-meta">
                      <span className="admin-events__date">{formatDate(ev.date_event)}</span>
                      {ev.show_in_agenda === 0 && (
                        <span className="admin-events__badge">Brouillon</span>
                      )}
                      {isPast && <span className="admin-events__badge">Passé</span>}
                    </div>

                    <h2 className="admin-events__name">{ev.title}</h2>

                    {ev.description && (
                      <p className="admin-events__desc">
                        {ev.description.length > 160
                          ? `${ev.description.slice(0, 160)}…`
                          : ev.description}
                      </p>
                    )}

                    {ev.lieu && (
                      <p className="admin-events__lieu">
                        <span>Lieu</span> {ev.lieu}
                      </p>
                    )}

                    <div className="admin-events__card-actions">
                      <Link
                        to={`/admin/events/${ev.id}/edit`}
                        className="admin-events__action admin-events__action--edit"
                      >
                        Éditer
                      </Link>
                      <button
                        type="button"
                        className="admin-events__action admin-events__action--delete"
                        onClick={() => handleDelete(ev)}
                        disabled={deleteMutation.isPending && deleteMutation.variables === ev.id}
                      >
                        Supprimer
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {data.totalPages > 1 && (
              <nav className="admin-events__pagination" aria-label="Pagination">
                <button
                  type="button"
                  className="admin-events__page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                >
                  ← Précédent
                </button>
                <span className="admin-events__page-label">
                  Page {data.page} sur {data.totalPages}
                </span>
                <button
                  type="button"
                  className="admin-events__page-btn"
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
