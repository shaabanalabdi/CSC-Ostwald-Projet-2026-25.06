// ============================================================
// AdminProjetSocial.jsx — Liste admin des documents téléchargeables
// affichés sur la page publique « Projet Social ». CRUD + réorganisation
// par glisser-déposer (uniquement quand aucune recherche n'est active —
// voir la prop disabled de SortableItem).
// ============================================================
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isApiError } from '@api/client';
import {
  useProjetSocialDocuments,
  useDeleteProjetSocialDocument,
  useReorderProjetSocialDocuments,
} from '@features/admin-projet-social';
import PageSEO from '@components/layout/PageSEO';
import SearchInput from '@components/ui/SearchInput';
import SortableItem from '@components/ui/SortableItem';
import { normalize } from '@utils/string';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import './AdminProjetSocial.scss';
const PER_PAGE = 50;
export default function AdminProjetSocial() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useProjetSocialDocuments({
    page,
    perPage: PER_PAGE,
  });
  const deleteMutation = useDeleteProjetSocialDocument();
  const reorderMutation = useReorderProjetSocialDocuments();
  const [query, setQuery] = useState('');
  const filteredItems = useMemo(() => {
    if (!data) return [];
    const q = normalize(query.trim());
    if (!q) return data.items;
    return data.items.filter((d) =>
      normalize(`${d.title} ${d.description ?? ''} ${d.badge_label}`).includes(q)
    );
  }, [data, query]);
  const reorderEnabled = query.trim() === '';
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const handleDelete = (doc) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(`Supprimer définitivement le document « ${doc.title} » ?`);
    if (ok) deleteMutation.mutate(doc.id);
  };
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !data) return;
    const ids = data.items.map((d) => d.id);
    const oldIndex = ids.indexOf(Number(active.id));
    const newIndex = ids.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    reorderMutation.mutate(arrayMove(ids, oldIndex, newIndex));
  };
  return (
    <>
      <PageSEO
        title="Documents Projet Social — Admin CSC Ostwald"
        description="Gestion des documents téléchargeables sur la page Projet Social"
        url="/admin/projet-social"
      />
      <div className="admin-projet-social">
        <header className="admin-projet-social__header">
          <div>
            <Link to="/admin/dashboard" className="admin-projet-social__back">
              ← Dashboard
            </Link>
            <h1 className="admin-projet-social__title">
              Documents Projet Social
              {data && <span className="admin-projet-social__count">{data.total} au total</span>}
            </h1>
          </div>
          <div className="admin-projet-social__actions">
            <SearchInput
              id="projet-social-search"
              value={query}
              onChange={setQuery}
              placeholder="Rechercher (titre, description)…"
            />
            <Link to="/admin/projet-social/new" className="admin-projet-social__cta">
              + Nouveau document
            </Link>
            <button
              type="button"
              className="admin-projet-social__btn"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              Actualiser
            </button>
          </div>
        </header>

        {isLoading && (
          <p className="admin-projet-social__state" role="status">
            Chargement…
          </p>
        )}

        {isError && (
          <p className="admin-projet-social__state admin-projet-social__state--error" role="alert">
            Erreur : {isApiError(error) ? error.message : 'Réessayez plus tard.'}
          </p>
        )}

        {data && data.items.length === 0 && (
          <p className="admin-projet-social__state" role="status">
            Aucun document enregistré pour l&apos;instant.
          </p>
        )}

        {data && data.items.length > 0 && (
          <>
            {query && (
              <p className="admin-projet-social__state" role="status">
                {filteredItems.length} résultat
                {filteredItems.length === 1 ? '' : 's'} pour « {query} »
              </p>
            )}
            {!reorderEnabled && (
              <p className="admin-projet-social__state" role="status">
                Réorganisation désactivée pendant la recherche.
              </p>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredItems.map((d) => d.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="admin-projet-social__list">
                  {filteredItems.map((d) => (
                    <SortableItem
                      key={d.id}
                      id={d.id}
                      className={`admin-projet-social__card admin-projet-social__card--${d.color} ${d.is_published === 0 ? 'admin-projet-social__card--draft' : ''}`}
                      disabled={!reorderEnabled}
                      handleLabel={`Réordonner ${d.title}`}
                    >
                      <div className="admin-projet-social__card-meta">
                        <span
                          className={`admin-projet-social__badge admin-projet-social__badge--${d.color}`}
                        >
                          {d.badge_label}
                        </span>
                        {d.is_published === 0 && (
                          <span className="admin-projet-social__draft">Brouillon</span>
                        )}
                      </div>

                      <h2 className="admin-projet-social__name">{d.title}</h2>

                      {d.description && (
                        <p className="admin-projet-social__desc">
                          {d.description.length > 200
                            ? `${d.description.slice(0, 200)}…`
                            : d.description}
                        </p>
                      )}

                      <p className="admin-projet-social__file">
                        <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                          {d.file_url}
                        </a>
                      </p>

                      <div className="admin-projet-social__card-actions">
                        <Link
                          to={`/admin/projet-social/${d.id}/edit`}
                          className="admin-projet-social__action admin-projet-social__action--edit"
                        >
                          Éditer
                        </Link>
                        <button
                          type="button"
                          className="admin-projet-social__action admin-projet-social__action--delete"
                          onClick={() => handleDelete(d)}
                          disabled={deleteMutation.isPending && deleteMutation.variables === d.id}
                        >
                          Supprimer
                        </button>
                      </div>
                    </SortableItem>
                  ))}
                </ul>
              </SortableContext>
            </DndContext>

            {data.totalPages > 1 && (
              <nav className="admin-projet-social__pagination" aria-label="Pagination">
                <button
                  type="button"
                  className="admin-projet-social__page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                >
                  ← Précédent
                </button>
                <span className="admin-projet-social__page-label">
                  Page {data.page} sur {data.totalPages}
                </span>
                <button
                  type="button"
                  className="admin-projet-social__page-btn"
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
