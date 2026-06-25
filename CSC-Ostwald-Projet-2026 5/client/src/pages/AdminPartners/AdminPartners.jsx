// ============================================================
// AdminPartners.jsx — Liste admin des partenaires institutionnels /
// associatifs.
//
// Triés par display_order (même ordre que la page publique). Filtre de
// catégorie optionnel (institutionnel / associatif / toutes), vignette
// du logo, actions éditer + supprimer.
// ============================================================
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isApiError, resolveStaticUrl } from '@api/client';
import {
  usePartners,
  useDeletePartner,
  useReorderPartners,
  PARTNER_CATEGORIES,
} from '@features/admin-partners';
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
import './AdminPartners.scss';
const PER_PAGE = 50;
const CATEGORY_LABELS = {
  institutionnel: 'Institutionnel',
  associatif: 'Associatif',
};
export default function AdminPartners() {
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const { data, isLoading, isError, error, refetch } = usePartners({
    page,
    perPage: PER_PAGE,
  });
  const deleteMutation = useDeletePartner();
  const reorderMutation = useReorderPartners();
  // La réorganisation est désactivée pendant le filtrage — glisser sur
  // une vue partielle brouillerait l'ordre des lignes masquées sur le
  // serveur.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const handleDelete = (partner) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(`Supprimer définitivement le partenaire « ${partner.name} » ?`);
    if (ok) deleteMutation.mutate(partner.id);
  };
  const handleCategoryChange = (next) => {
    setCategoryFilter(next);
    setPage(1);
  };
  const [query, setQuery] = useState('');
  // La réorganisation n'est sûre que quand la liste complète non filtrée
  // est à l'écran. Une vue partielle (recherche OU filtre de catégorie)
  // persisterait un ordre partiel, brouillant les lignes non affichées.
  const reorderEnabled = query.trim() === '' && categoryFilter === '';
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !data) return;
    const ids = data.items.map((p) => p.id);
    const oldIndex = ids.indexOf(Number(active.id));
    const newIndex = ids.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    reorderMutation.mutate(arrayMove(ids, oldIndex, newIndex));
  };
  // Le backend ne supporte pas encore le filtre de catégorie / la
  // recherche ; les deux sont appliqués en mémoire. Acceptable tant que
  // le jeu de données est petit (le CSC a ~5-20 partenaires).
  const items = useMemo(() => {
    if (!data) return [];
    let arr = data.items;
    if (categoryFilter) arr = arr.filter((p) => p.category === categoryFilter);
    const q = normalize(query.trim());
    if (q) {
      arr = arr.filter((p) => normalize(`${p.name} ${p.website_url ?? ''}`).includes(q));
    }
    return arr;
  }, [data, categoryFilter, query]);
  return (
    <>
      <PageSEO
        title="Partenaires — Admin CSC Ostwald"
        description="Gestion des partenaires"
        url="/admin/partners"
      />
      <div className="admin-partners">
        <header className="admin-partners__header">
          <div>
            <Link to="/admin/dashboard" className="admin-partners__back">
              ← Dashboard
            </Link>
            <h1 className="admin-partners__title">
              Partenaires
              {data && <span className="admin-partners__count">{data.total} au total</span>}
            </h1>
          </div>
          <div className="admin-partners__actions">
            <SearchInput
              id="partners-search"
              value={query}
              onChange={setQuery}
              placeholder="Rechercher (nom, site)…"
            />
            <Link to="/admin/partners/new" className="admin-partners__cta">
              + Nouveau partenaire
            </Link>
            <button
              type="button"
              className="admin-partners__btn"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              Actualiser
            </button>
          </div>
        </header>

        <nav className="admin-partners__filters" aria-label="Filtrer par catégorie">
          <button
            type="button"
            className={`admin-partners__chip ${categoryFilter === '' ? 'admin-partners__chip--active' : ''}`}
            onClick={() => handleCategoryChange('')}
          >
            Toutes
          </button>
          {PARTNER_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`admin-partners__chip admin-partners__chip--${c} ${categoryFilter === c ? 'admin-partners__chip--active' : ''}`}
              onClick={() => handleCategoryChange(c)}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </nav>

        {isLoading && (
          <p className="admin-partners__state" role="status">
            Chargement…
          </p>
        )}

        {isError && (
          <p className="admin-partners__state admin-partners__state--error" role="alert">
            Erreur : {isApiError(error) ? error.message : 'Réessayez plus tard.'}
          </p>
        )}

        {data && items.length === 0 && (
          <p className="admin-partners__state" role="status">
            Aucun partenaire pour ce filtre.
          </p>
        )}

        {data && items.length > 0 && (
          <>
            {!reorderEnabled && (
              <p className="admin-partners__state" role="status">
                Réorganisation désactivée pendant la recherche ou un filtre catégorie.
              </p>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="admin-partners__list">
                  {items.map((p) => (
                    <SortableItem
                      key={p.id}
                      id={p.id}
                      className={`admin-partners__card admin-partners__card--${p.category}`}
                      disabled={!reorderEnabled}
                      handleLabel={`Réordonner ${p.name}`}
                    >
                      <div className="admin-partners__logo">
                        <img
                          src={resolveStaticUrl(p.logo_url)}
                          alt={`Logo ${p.name}`}
                          loading="lazy"
                        />
                      </div>

                      <div className="admin-partners__body">
                        <span
                          className={`admin-partners__category admin-partners__category--${p.category}`}
                        >
                          {CATEGORY_LABELS[p.category]}
                        </span>
                        <h2 className="admin-partners__name">{p.name}</h2>
                        {p.website_url && (
                          <p className="admin-partners__website">
                            <a href={p.website_url} target="_blank" rel="noopener noreferrer">
                              {p.website_url}
                            </a>
                          </p>
                        )}
                        <p className="admin-partners__order">
                          <span>Ordre</span> {p.display_order}
                        </p>
                      </div>

                      <div className="admin-partners__card-actions">
                        <Link
                          to={`/admin/partners/${p.id}/edit`}
                          className="admin-partners__action admin-partners__action--edit"
                        >
                          Éditer
                        </Link>
                        <button
                          type="button"
                          className="admin-partners__action admin-partners__action--delete"
                          onClick={() => handleDelete(p)}
                          disabled={deleteMutation.isPending && deleteMutation.variables === p.id}
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
              <nav className="admin-partners__pagination" aria-label="Pagination">
                <button
                  type="button"
                  className="admin-partners__page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                >
                  ← Précédent
                </button>
                <span className="admin-partners__page-label">
                  Page {data.page} sur {data.totalPages}
                </span>
                <button
                  type="button"
                  className="admin-partners__page-btn"
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
