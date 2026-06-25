// ============================================================
// AdminHeroEdit.jsx — CRÉATION + ÉDITION d'une slide du carrousel Hero.
//
// /admin/hero/new      → formulaire vide, useCreateHeroSlide
// /admin/hero/:id/edit → formulaire pré-rempli depuis useHeroSlide(id)
//
// L'ordre dans le carrousel ne se règle PAS ici : il se fait par
// glisser-déposer sur la liste /admin/hero.
//
// Fond de la slide : « Aucun » (dégradé orange) / « Image » / « Vidéo ».
// L'image et la vidéo se téléversent via UploadField (qui pointe vers le
// bon endpoint selon `kind`).
// ============================================================

import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError } from '@api/client';
import {
  useHeroSlide,
  useCreateHeroSlide,
  useUpdateHeroSlide,
  heroSlideSchema,
  HERO_MEDIA_TYPES,
} from '@features/admin-hero';
import PageSEO from '@components/layout/PageSEO';
import UploadField from '@components/ui/UploadField';
import './AdminHeroEdit.scss';

const MEDIA_TYPE_LABELS = {
  none: 'Aucun (dégradé orange)',
  image: 'Image',
  video: 'Vidéo',
};

const EMPTY_DEFAULTS = {
  title: '',
  subtitle: '',
  media_type: 'none',
  media_url: '',
  is_published: true,
};

export default function AdminHeroEdit() {
  const { id: idParam } = useParams();
  const id = idParam ? Number(idParam) : 0;
  const isEdit = Number.isInteger(id) && id > 0;
  const navigate = useNavigate();

  const { data: existing, isLoading: isLoadingExisting } = useHeroSlide(id);
  const createMutation = useCreateHeroSlide();
  const updateMutation = useUpdateHeroSlide();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(heroSlideSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  // useWatch (vs watch()) ne re-rend que ce bloc, pas tout le formulaire.
  const mediaType = useWatch({ control, name: 'media_type' });

  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        subtitle: existing.subtitle,
        media_type: existing.media_type ?? 'none',
        media_url: existing.media_url ?? '',
        is_published: existing.is_published === 1,
      });
    }
  }, [existing, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id, payload: data });
      } else {
        await createMutation.mutateAsync(data);
      }
      navigate('/admin/hero', { replace: true });
    } catch {
      // Erreur affichée en ligne ci-dessous.
    }
  };

  const submitMutation = isEdit ? updateMutation : createMutation;
  const submitError = submitMutation.error;

  return (
    <>
      <PageSEO
        title={`${isEdit ? 'Éditer' : 'Nouvelle'} slide — Admin CSC Ostwald`}
        description="Formulaire d'édition d'une slide du Hero"
        url={isEdit ? `/admin/hero/${id}/edit` : '/admin/hero/new'}
      />
      <div className="admin-hero-edit">
        <header className="admin-hero-edit__header">
          <Link to="/admin/hero" className="admin-hero-edit__back">
            ← Bannière d&apos;accueil
          </Link>
          <h1 className="admin-hero-edit__title">
            {isEdit ? 'Éditer une slide' : 'Nouvelle slide'}
          </h1>
        </header>

        {isEdit && isLoadingExisting && (
          <p className="admin-hero-edit__state" role="status">
            Chargement…
          </p>
        )}

        {(!isEdit || existing) && (
          <form className="admin-hero-edit__form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="admin-hero-edit__field">
              <label htmlFor="hero-title">
                Titre <span aria-hidden="true">*</span>
              </label>
              <input
                id="hero-title"
                type="text"
                placeholder="Grand titre affiché dans la bulle orange"
                aria-required="true"
                aria-invalid={errors.title ? 'true' : 'false'}
                {...register('title')}
              />
              {errors.title && (
                <span className="admin-hero-edit__error" role="alert">
                  {errors.title.message}
                </span>
              )}
            </div>

            <div className="admin-hero-edit__field">
              <label htmlFor="hero-subtitle">
                Sous-titre <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="hero-subtitle"
                rows={2}
                placeholder="Phrase d'accroche affichée dans la bulle bleue (2 à 300 caractères)"
                aria-required="true"
                aria-invalid={errors.subtitle ? 'true' : 'false'}
                {...register('subtitle')}
              />
              {errors.subtitle && (
                <span className="admin-hero-edit__error" role="alert">
                  {errors.subtitle.message}
                </span>
              )}
            </div>

            <div className="admin-hero-edit__field">
              <label htmlFor="hero-media-type">Fond de la slide</label>
              <select
                id="hero-media-type"
                {...register('media_type', {
                  // Changer de type vide l'URL : un fichier image n'a aucun
                  // sens si l'on bascule sur « Vidéo », et inversement.
                  onChange: () => setValue('media_url', ''),
                })}
              >
                {HERO_MEDIA_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {MEDIA_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            {mediaType !== 'none' && (
              <div className="admin-hero-edit__field">
                <label>{mediaType === 'video' ? 'Vidéo de fond' : 'Image de fond'}</label>
                <Controller
                  control={control}
                  name="media_url"
                  render={({ field }) => (
                    <UploadField
                      key={mediaType}
                      id="hero-media"
                      kind={mediaType === 'video' ? 'video' : 'image'}
                      label={mediaType === 'video' ? 'Vidéo de fond' : 'Image de fond'}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.media_url && (
                  <span className="admin-hero-edit__error" role="alert">
                    {errors.media_url.message}
                  </span>
                )}
              </div>
            )}

            <div className="admin-hero-edit__field">
              <label className="admin-hero-edit__checkbox">
                <input type="checkbox" {...register('is_published')} />
                <span>Publier dans le carrousel (décocher pour garder en brouillon)</span>
              </label>
            </div>

            {submitError && (
              <p className="admin-hero-edit__form-error" role="alert">
                {isApiError(submitError) ? submitError.message : 'Erreur inattendue.'}
              </p>
            )}

            <div className="admin-hero-edit__form-actions">
              <Link to="/admin/hero" className="admin-hero-edit__cancel">
                Annuler
              </Link>
              <button
                type="submit"
                className="admin-hero-edit__submit"
                disabled={isSubmitting || submitMutation.isPending}
              >
                {submitMutation.isPending ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
