// ============================================================
// AdminHero.jsx — Liste admin des slides du carrousel Hero affiché en
// haut de la page d'accueil.
//
// Glisser-déposer pour réordonner le carrousel (display_order). Pas de
// recherche ni de pagination : le Hero ne contient qu'une poignée de
// slides, ces contrôles seraient du bruit. Une slide en brouillon
// (is_published = 0) n'apparaît pas sur le site public.
// ============================================================

import { Link } from 'react-router-dom';
import { isApiError } from '@api/client';
import { useAdminHero, useDeleteHeroSlide, useReorderHeroSlides } from '@features/admin-hero';
import PageSEO from '@components/layout/PageSEO';
import SortableItem from '@components/ui/SortableItem';
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
import './AdminHero.scss';

export default function AdminHero() {
  const { data, isLoading, isError, error, refetch } = useAdminHero();
  const deleteMutation = useDeleteHeroSlide();
  const reorderMutation = useReorderHeroSlides();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const slides = data ?? [];

  const handleDelete = (slide) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(`Supprimer définitivement la slide « ${slide.title} » ?`);
    if (ok) deleteMutation.mutate(slide.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = slides.map((s) => s.id);
    const oldIndex = ids.indexOf(Number(active.id));
    const newIndex = ids.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    reorderMutation.mutate(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <>
      <PageSEO
        title="Bannière d'accueil — Admin CSC Ostwald"
        description="Gestion des slides du carrousel Hero"
        url="/admin/hero"
      />
      <div className="admin-hero">
        <header className="admin-hero__header">
          <div>
            <Link to="/admin/dashboard" className="admin-hero__back">
              ← Dashboard
            </Link>
            <h1 className="admin-hero__title">
              Bannière d&apos;accueil
              {data && (
                <span className="admin-hero__count">
                  {slides.length} slide{slides.length === 1 ? '' : 's'}
                </span>
              )}
            </h1>
          </div>
          <div className="admin-hero__actions">
            <Link to="/admin/hero/new" className="admin-hero__cta">
              + Nouvelle slide
            </Link>
            <button
              type="button"
              className="admin-hero__btn"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              Actualiser
            </button>
          </div>
        </header>

        <p className="admin-hero__hint">
          Glissez-déposez les slides pour changer leur ordre dans le carrousel. Une slide en
          brouillon n&apos;apparaît pas sur le site public.
        </p>

        {isLoading && (
          <p className="admin-hero__state" role="status">
            Chargement…
          </p>
        )}

        {isError && (
          <p className="admin-hero__state admin-hero__state--error" role="alert">
            Erreur : {isApiError(error) ? error.message : 'Réessayez plus tard.'}
          </p>
        )}

        {data && slides.length === 0 && (
          <p className="admin-hero__state" role="status">
            Aucune slide pour l&apos;instant. Le carrousel affiche un contenu par défaut tant
            qu&apos;aucune slide n&apos;est publiée.
          </p>
        )}

        {data && slides.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <ul className="admin-hero__list">
                {slides.map((s, index) => (
                  <SortableItem
                    key={s.id}
                    id={s.id}
                    className={`admin-hero__card ${
                      s.is_published === 0 ? 'admin-hero__card--draft' : ''
                    }`}
                    handleLabel={`Réordonner ${s.title}`}
                  >
                    <div className="admin-hero__body">
                      <div className="admin-hero__card-meta">
                        <span className="admin-hero__position">Slide {index + 1}</span>
                        {s.media_type && s.media_type !== 'none' && (
                          <span
                            className={`admin-hero__media-tag admin-hero__media-tag--${s.media_type}`}
                          >
                            {s.media_type === 'video' ? 'Vidéo' : 'Image'}
                          </span>
                        )}
                        {s.is_published === 0 && (
                          <span className="admin-hero__draft">Brouillon</span>
                        )}
                      </div>
                      <h2 className="admin-hero__name">{s.title}</h2>
                      <p className="admin-hero__subtitle">{s.subtitle}</p>
                    </div>

                    <div className="admin-hero__card-actions">
                      <Link
                        to={`/admin/hero/${s.id}/edit`}
                        className="admin-hero__action admin-hero__action--edit"
                      >
                        Éditer
                      </Link>
                      <button
                        type="button"
                        className="admin-hero__action admin-hero__action--delete"
                        onClick={() => handleDelete(s)}
                        disabled={deleteMutation.isPending && deleteMutation.variables === s.id}
                      >
                        Supprimer
                      </button>
                    </div>
                  </SortableItem>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </>
  );
}
