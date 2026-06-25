// ============================================================
// AdminMessages.jsx — Page admin listant les soumissions du formulaire
// de contact.
//
// Fonctionnalités :
//   - Liste paginée (état de page dans le composant, pas encore de
//     persistance dans l'URL).
//   - Bouton marquer-comme-lu par ligne non lue.
//   - Bouton de suppression avec confirm() natif — petite équipe admin,
//     le simple suffit.
//   - Lignes non lues distinguées visuellement par une bordure d'accent
//     orange.
//
// Futur : filtres (non lus seulement / par sujet), pagination adossée à
// l'URL, mises à jour optimistes, actions groupées. Hors périmètre MVP.
// ============================================================
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isApiError } from '@api/client';
import { useMessages, useMarkMessageAsRead, useDeleteMessage } from '@features/admin-messages';
import PageSEO from '@components/layout/PageSEO';
import ExportCsvButton from '@components/ui/ExportCsvButton';
import SearchInput from '@components/ui/SearchInput';
import { normalize } from '@utils/string';
import './AdminMessages.scss';
const PER_PAGE = 20;
/** Date FR + heure courte — affichage admin lisible. */
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
/** Excerpt — premiers ~120 caractères, sans couper un mot. */
function excerpt(text, maxLen = 120) {
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 60 ? lastSpace : maxLen).trimEnd()}…`;
}
export default function AdminMessages() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useMessages({ page, perPage: PER_PAGE });
  const markAsReadMutation = useMarkMessageAsRead();
  const deleteMutation = useDeleteMessage();
  const [query, setQuery] = useState('');
  const filteredItems = useMemo(() => {
    if (!data) return [];
    const q = normalize(query.trim());
    if (!q) return data.items;
    return data.items.filter((m) => {
      const haystack = normalize(`${m.prenom} ${m.nom} ${m.email} ${m.sujet} ${m.message}`);
      return haystack.includes(q);
    });
  }, [data, query]);
  const handleMarkAsRead = (id) => {
    markAsReadMutation.mutate(id);
  };
  const handleDelete = (msg) => {
    // confirm() natif — petite équipe admin, le léger est préféré à un
    // composant modal personnalisé. Un vrai Dialog pourra le remplacer
    // quand l'accessibilité / la cohérence de marque deviendront un enjeu.
    // eslint-disable-next-line no-alert
    const ok = window.confirm(`Supprimer définitivement le message de ${msg.prenom} ${msg.nom} ?`);
    if (ok) deleteMutation.mutate(msg.id);
  };
  return (
    <>
      <PageSEO
        title="Messages reçus — Admin CSC Ostwald"
        description="Liste des messages reçus via le formulaire de contact"
        url="/admin/messages"
      />
      <div className="admin-messages">
        <header className="admin-messages__header">
          <div>
            <Link to="/admin/dashboard" className="admin-messages__back">
              ← Dashboard
            </Link>
            <h1 className="admin-messages__title">
              Messages reçus
              {data && <span className="admin-messages__count">{data.total} au total</span>}
            </h1>
          </div>
          <div className="admin-messages__actions-header">
            <SearchInput
              id="messages-search"
              value={query}
              onChange={setQuery}
              placeholder="Rechercher (nom, email, sujet, contenu)…"
            />
            <ExportCsvButton
              path="/admin/messages/export.csv"
              filename="messages.csv"
              className="admin-messages__refresh"
              disabled={isLoading}
            />
            <button
              type="button"
              className="admin-messages__refresh"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              Actualiser
            </button>
          </div>
        </header>

        {isLoading && (
          <p className="admin-messages__state" role="status">
            Chargement des messages…
          </p>
        )}

        {isError && (
          <p className="admin-messages__state admin-messages__state--error" role="alert">
            Erreur de chargement : {isApiError(error) ? error.message : 'Réessayez plus tard.'}
          </p>
        )}

        {data && data.items.length === 0 && (
          <p className="admin-messages__state" role="status">
            Aucun message reçu pour l&apos;instant.
          </p>
        )}

        {data && data.items.length > 0 && (
          <>
            {query && (
              <p className="admin-messages__state" role="status">
                {filteredItems.length} résultat{filteredItems.length === 1 ? '' : 's'} pour «{' '}
                {query} »
              </p>
            )}
            <ul className="admin-messages__list">
              {filteredItems.map((msg) => (
                <li
                  key={msg.id}
                  className={`admin-messages__card ${msg.is_read === 0 ? 'admin-messages__card--unread' : ''}`}
                >
                  <div className="admin-messages__card-meta">
                    <span className={`admin-messages__sujet admin-messages__sujet--${msg.sujet}`}>
                      {msg.sujet}
                    </span>
                    <time className="admin-messages__date" dateTime={msg.created_at}>
                      {formatDate(msg.created_at)}
                    </time>
                  </div>

                  <h2 className="admin-messages__from">
                    {msg.prenom} {msg.nom}
                  </h2>
                  <p className="admin-messages__contact">
                    <a href={`mailto:${msg.email}`}>{msg.email}</a>
                    {msg.telephone && (
                      <>
                        {' '}
                        • <a href={`tel:${msg.telephone}`}>{msg.telephone}</a>
                      </>
                    )}
                  </p>

                  <p className="admin-messages__excerpt">{excerpt(msg.message)}</p>

                  <details className="admin-messages__full">
                    <summary>Lire le message complet</summary>
                    <p className="admin-messages__full-body">{msg.message}</p>
                  </details>

                  <div className="admin-messages__actions">
                    {msg.is_read === 0 && (
                      <button
                        type="button"
                        className="admin-messages__action admin-messages__action--mark"
                        onClick={() => handleMarkAsRead(msg.id)}
                        disabled={
                          markAsReadMutation.isPending && markAsReadMutation.variables === msg.id
                        }
                      >
                        Marquer comme lu
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-messages__action admin-messages__action--delete"
                      onClick={() => handleDelete(msg)}
                      disabled={deleteMutation.isPending && deleteMutation.variables === msg.id}
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {data.totalPages > 1 && (
              <nav className="admin-messages__pagination" aria-label="Pagination">
                <button
                  type="button"
                  className="admin-messages__page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                >
                  ← Précédent
                </button>
                <span className="admin-messages__page-label">
                  Page {data.page} sur {data.totalPages}
                </span>
                <button
                  type="button"
                  className="admin-messages__page-btn"
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
