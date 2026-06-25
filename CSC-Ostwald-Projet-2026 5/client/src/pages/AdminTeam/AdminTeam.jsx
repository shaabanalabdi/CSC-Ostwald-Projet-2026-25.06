// ============================================================
// AdminTeam.jsx — Liste admin des membres de l'équipe.
//
// Triés par display_order (même ordre que la page publique), avec un CTA
// « Nouveau membre » et éditer/supprimer sur chaque carte. Vignette
// photo quand photo_url est défini, espace réservé avec initiales sinon.
// ============================================================
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isApiError, resolveStaticUrl } from '@api/client';
import { useTeamMembers, useDeleteTeamMember, useReorderTeamMembers } from '@features/admin-team';
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
import './AdminTeam.scss';
const PER_PAGE = 50;
function initials(member) {
  const p = member.prenom?.[0] ?? '';
  const n = member.nom?.[0] ?? '';
  return `${p}${n}`.toUpperCase() || '?';
}
export default function AdminTeam() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useTeamMembers({
    page,
    perPage: PER_PAGE,
  });
  const deleteMutation = useDeleteTeamMember();
  const reorderMutation = useReorderTeamMembers();
  const [query, setQuery] = useState('');
  const filteredItems = useMemo(() => {
    if (!data) return [];
    const q = normalize(query.trim());
    if (!q) return data.items;
    return data.items.filter((m) =>
      normalize(`${m.prenom} ${m.nom} ${m.role} ${m.email ?? ''}`).includes(q)
    );
  }, [data, query]);
  // La réorganisation est désactivée pendant qu'une recherche est active
  // — glisser sur une vue partielle brouillerait l'ordre des lignes
  // masquées sur le serveur.
  const reorderEnabled = query.trim() === '';
  const sensors = useSensors(
    // 5px activation distance prevents accidental drags on row clicks.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !data) return;
    const ids = data.items.map((m) => m.id);
    const oldIndex = ids.indexOf(Number(active.id));
    const newIndex = ids.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    // L'invalidation de React Query en cas de succès récupérera l'ordre
    // canonique du serveur, donc on lance sans attendre ici. L'UI affiche
    // le nouvel ordre via le transform interne de SortableContext jusqu'à
    // l'arrivée du refetch.
    reorderMutation.mutate(arrayMove(ids, oldIndex, newIndex));
  };
  const handleDelete = (member) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(
      `Supprimer définitivement « ${member.prenom} ${member.nom} » de l'équipe ?`
    );
    if (ok) deleteMutation.mutate(member.id);
  };
  return (
    <>
      <PageSEO
        title="Équipe — Admin CSC Ostwald"
        description="Gestion des membres de l'équipe"
        url="/admin/team"
      />
      <div className="admin-team">
        <header className="admin-team__header">
          <div>
            <Link to="/admin/dashboard" className="admin-team__back">
              ← Dashboard
            </Link>
            <h1 className="admin-team__title">
              Équipe
              {data && <span className="admin-team__count">{data.total} au total</span>}
            </h1>
          </div>
          <div className="admin-team__actions">
            <SearchInput
              id="team-search"
              value={query}
              onChange={setQuery}
              placeholder="Rechercher (nom, rôle)…"
            />
            <Link to="/admin/team/new" className="admin-team__cta">
              + Nouveau membre
            </Link>
            <button
              type="button"
              className="admin-team__btn"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              Actualiser
            </button>
          </div>
        </header>

        {isLoading && (
          <p className="admin-team__state" role="status">
            Chargement…
          </p>
        )}

        {isError && (
          <p className="admin-team__state admin-team__state--error" role="alert">
            Erreur : {isApiError(error) ? error.message : 'Réessayez plus tard.'}
          </p>
        )}

        {data && data.items.length === 0 && (
          <p className="admin-team__state" role="status">
            Aucun membre enregistré pour l&apos;instant.
          </p>
        )}

        {data && data.items.length > 0 && (
          <>
            {query && (
              <p className="admin-team__state" role="status">
                {filteredItems.length} résultat{filteredItems.length === 1 ? '' : 's'} pour «{' '}
                {query} »
              </p>
            )}
            {!reorderEnabled && (
              <p className="admin-team__state" role="status">
                Réorganisation désactivée pendant la recherche.
              </p>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredItems.map((m) => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="admin-team__list">
                  {filteredItems.map((m) => (
                    <SortableItem
                      key={m.id}
                      id={m.id}
                      className="admin-team__card"
                      disabled={!reorderEnabled}
                      handleLabel={`Réordonner ${m.prenom} ${m.nom}`}
                    >
                      <div className="admin-team__avatar" aria-hidden="true">
                        {m.photo_url ? (
                          <img
                            src={resolveStaticUrl(m.photo_url)}
                            alt=""
                            className="admin-team__photo"
                          />
                        ) : (
                          <span className="admin-team__initials">{initials(m)}</span>
                        )}
                      </div>

                      <div className="admin-team__body">
                        <h2 className="admin-team__name">
                          {m.prenom} {m.nom}
                        </h2>
                        <p className="admin-team__role">{m.role}</p>
                        {m.email && (
                          <p className="admin-team__email">
                            <span>Email</span> {m.email}
                          </p>
                        )}
                        {m.phone && (
                          <p className="admin-team__email">
                            <span>Tél</span> {m.phone}
                          </p>
                        )}
                        <p className="admin-team__order">
                          <span>Ordre</span> {m.display_order}
                        </p>
                      </div>

                      <div className="admin-team__card-actions">
                        <Link
                          to={`/admin/team/${m.id}/edit`}
                          className="admin-team__action admin-team__action--edit"
                        >
                          Éditer
                        </Link>
                        <button
                          type="button"
                          className="admin-team__action admin-team__action--delete"
                          onClick={() => handleDelete(m)}
                          disabled={deleteMutation.isPending && deleteMutation.variables === m.id}
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
              <nav className="admin-team__pagination" aria-label="Pagination">
                <button
                  type="button"
                  className="admin-team__page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                >
                  ← Précédent
                </button>
                <span className="admin-team__page-label">
                  Page {data.page} sur {data.totalPages}
                </span>
                <button
                  type="button"
                  className="admin-team__page-btn"
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
