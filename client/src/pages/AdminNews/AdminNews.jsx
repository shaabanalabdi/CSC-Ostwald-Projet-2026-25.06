// ============================================================
// AdminNews.jsx — Liste admin des cartes « Nos actualités » affichées
// sur la page d'accueil publique. CRUD sans glisser-déposer (les
// actualités sont triées naturellement par date_published DESC — aucune
// réorganisation manuelle nécessaire).
// ============================================================

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isApiError, resolveStaticUrl } from '@api/client';
import { useAdminNews, useDeleteNews } from '@features/admin-news';
import PageSEO from '@components/layout/PageSEO';
import SearchInput from '@components/ui/SearchInput';
import { normalize } from '@utils/string';
import './AdminNews.scss';

const PER_PAGE = 50;

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

const PLATFORM_LABEL = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  none: 'Aucun',
};

export default function AdminNews() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useAdminNews({
    page,
    perPage: PER_PAGE,
  });
  const deleteMutation = useDeleteNews();
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!data) return [];
    const q = normalize(query.trim());
    if (!q) return data.items;
    return data.items.filter((n) =>
      normalize(`${n.title} ${n.excerpt} ${n.social_platform}`).includes(q)
    );
  }, [data, query]);

  const handleDelete = (item) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(`Supprimer définitivement l'actualité « ${item.title} » ?`);
    if (ok) deleteMutation.mutate(item.id);
  };

  return (
    <>
      <PageSEO
        title="Actualités — Admin CSC Ostwald"
        description="Gestion des actualités affichées sur la page d'accueil"
        url="/admin/news"
      />
      <div className="admin-news">
        <header className="admin-news__header">
          <div>
            <Link to="/admin/dashboard" className="admin-news__back">
              ← Dashboard
            </Link>
            <h1 className="admin-news__title">
              Nos actualités
              {data && <span className="admin-news__count">{data.total} au total</span>}
            </h1>
          </div>
          <div className="admin-news__actions">
            <SearchInput
              id="news-search"
              value={query}
              onChange={setQuery}
              placeholder="Rechercher (titre, extrait)…"
            />
            <Link to="/admin/news/new" className="admin-news__cta">
              + Nouvelle actualité
            </Link>
            <button
              type="button"
              className="admin-news__btn"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              Actualiser
            </button>
          </div>
        </header>

        {isLoading && (
          <p className="admin-news__state" role="status">
            Chargement…
          </p>
        )}

        {isError && (
          <p className="admin-news__state admin-news__state--error" role="alert">
            Erreur : {isApiError(error) ? error.message : 'Réessayez plus tard.'}
          </p>
        )}

        {data && data.items.length === 0 && (
          <p className="admin-news__state" role="status">
            Aucune actualité enregistrée pour l&apos;instant.
          </p>
        )}

        {data && data.items.length > 0 && (
          <>
            {query && (
              <p className="admin-news__state" role="status">
                {filteredItems.length} résultat{filteredItems.length === 1 ? '' : 's'} pour «{' '}
                {query} »
              </p>
            )}
            <ul className="admin-news__list">
              {filteredItems.map((n) => (
                <li
                  key={n.id}
                  className={`admin-news__card ${
                    n.is_published === 0 ? 'admin-news__card--draft' : ''
                  }`}
                >
                  {n.image_url ? (
                    <img
                      src={resolveStaticUrl(n.image_url)}
                      alt=""
                      className="admin-news__thumb"
                      loading="lazy"
                    />
                  ) : (
                    <div className="admin-news__thumb admin-news__thumb--empty" aria-hidden="true">
                      📰
                    </div>
                  )}

                  <div className="admin-news__body">
                    <div className="admin-news__card-meta">
                      <time className="admin-news__date" dateTime={n.date_published}>
                        {formatDate(n.date_published)}
                      </time>
                      <span
                        className={`admin-news__platform admin-news__platform--${n.social_platform}`}
                      >
                        {PLATFORM_LABEL[n.social_platform]}
                      </span>
                      {n.is_published === 0 && <span className="admin-news__draft">Brouillon</span>}
                    </div>

                    <h2 className="admin-news__name">{n.title}</h2>
                    <p className="admin-news__excerpt">
                      {n.excerpt.length > 200 ? `${n.excerpt.slice(0, 200)}…` : n.excerpt}
                    </p>

                    {n.social_url && (
                      <p className="admin-news__link">
                        <a href={n.social_url} target="_blank" rel="noopener noreferrer">
                          {n.social_url}
                        </a>
                      </p>
                    )}

                    <div className="admin-news__card-actions">
                      <Link
                        to={`/admin/news/${n.id}/edit`}
                        className="admin-news__action admin-news__action--edit"
                      >
                        Éditer
                      </Link>
                      <button
                        type="button"
                        className="admin-news__action admin-news__action--delete"
                        onClick={() => handleDelete(n)}
                        disabled={deleteMutation.isPending && deleteMutation.variables === n.id}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {data.totalPages > 1 && (
              <nav className="admin-news__pagination" aria-label="Pagination">
                <button
                  type="button"
                  className="admin-news__page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                >
                  ← Précédent
                </button>
                <span className="admin-news__page-label">
                  Page {data.page} sur {data.totalPages}
                </span>
                <button
                  type="button"
                  className="admin-news__page-btn"
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
