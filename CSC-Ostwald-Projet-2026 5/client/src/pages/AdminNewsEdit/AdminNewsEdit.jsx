// ============================================================
// AdminNewsEdit.jsx — CRÉATION + ÉDITION d'une carte d'actualité.
//
// /admin/news/new      → formulaire vide, useCreateNews
// /admin/news/:id/edit → formulaire pré-rempli depuis useNewsItem(id)
// ============================================================

import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError } from '@api/client';
import {
  useNewsItem,
  useCreateNews,
  useUpdateNews,
  newsSchema,
  NEWS_PLATFORMS,
} from '@features/admin-news';
import PageSEO from '@components/layout/PageSEO';
import UploadField from '@components/ui/UploadField';
import './AdminNewsEdit.scss';

const PLATFORM_LABELS = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  none: 'Aucun (pas de lien social)',
};

const EMPTY_DEFAULTS = {
  title: '',
  excerpt: '',
  image_url: '',
  date_published: new Date().toISOString().slice(0, 10),
  social_platform: 'none',
  social_url: '',
  is_published: true,
};

export default function AdminNewsEdit() {
  const { id: idParam } = useParams();
  const id = idParam ? Number(idParam) : 0;
  const isEdit = Number.isInteger(id) && id > 0;
  const navigate = useNavigate();

  const { data: existing, isLoading: isLoadingExisting } = useNewsItem(id);
  const createMutation = useCreateNews();
  const updateMutation = useUpdateNews();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(newsSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  // useWatch (vs watch()) s'entend bien avec le React Compiler — il ne
  // re-rend que le consommateur de ce hook, pas tout le formulaire à
  // chaque frappe, et ne déclenche pas le lint « incompatible-library ».
  const platform = useWatch({ control, name: 'social_platform' });

  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        excerpt: existing.excerpt,
        image_url: existing.image_url ?? '',
        date_published: existing.date_published?.slice(0, 10) ?? '',
        social_platform: existing.social_platform,
        social_url: existing.social_url ?? '',
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
      navigate('/admin/news', { replace: true });
    } catch {
      // Error rendered inline below.
    }
  };

  const submitMutation = isEdit ? updateMutation : createMutation;
  const submitError = submitMutation.error;

  return (
    <>
      <PageSEO
        title={`${isEdit ? 'Éditer' : 'Nouvelle'} actualité — Admin CSC Ostwald`}
        description="Formulaire d'édition d'une actualité"
        url={isEdit ? `/admin/news/${id}/edit` : '/admin/news/new'}
      />
      <div className="admin-news-edit">
        <header className="admin-news-edit__header">
          <Link to="/admin/news" className="admin-news-edit__back">
            ← Liste des actualités
          </Link>
          <h1 className="admin-news-edit__title">
            {isEdit ? 'Éditer une actualité' : 'Nouvelle actualité'}
          </h1>
        </header>

        {isEdit && isLoadingExisting && (
          <p className="admin-news-edit__state" role="status">
            Chargement…
          </p>
        )}

        {(!isEdit || existing) && (
          <form className="admin-news-edit__form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="admin-news-edit__field admin-news-edit__field--full">
              <label htmlFor="nw-title">
                Titre <span aria-hidden="true">*</span>
              </label>
              <input
                id="nw-title"
                type="text"
                aria-required="true"
                aria-invalid={errors.title ? 'true' : 'false'}
                {...register('title')}
              />
              {errors.title && (
                <span className="admin-news-edit__error" role="alert">
                  {errors.title.message}
                </span>
              )}
            </div>

            <div className="admin-news-edit__field admin-news-edit__field--full">
              <label htmlFor="nw-excerpt">
                Extrait <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="nw-excerpt"
                rows={4}
                placeholder="Description courte affichée sur la carte (10 à 2000 caractères)"
                aria-required="true"
                aria-invalid={errors.excerpt ? 'true' : 'false'}
                {...register('excerpt')}
              />
              {errors.excerpt && (
                <span className="admin-news-edit__error" role="alert">
                  {errors.excerpt.message}
                </span>
              )}
            </div>

            <div className="admin-news-edit__field admin-news-edit__field--full">
              <label htmlFor="nw-image-url">Image</label>
              <Controller
                control={control}
                name="image_url"
                render={({ field }) => (
                  <UploadField
                    id="nw-image"
                    label="Image de l'actualité"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.image_url && (
                <span className="admin-news-edit__error" role="alert">
                  {errors.image_url.message}
                </span>
              )}
            </div>

            <div className="admin-news-edit__field">
              <label htmlFor="nw-date">
                Date de publication <span aria-hidden="true">*</span>
              </label>
              <input
                id="nw-date"
                type="date"
                aria-required="true"
                aria-invalid={errors.date_published ? 'true' : 'false'}
                {...register('date_published')}
              />
              {errors.date_published && (
                <span className="admin-news-edit__error" role="alert">
                  {errors.date_published.message}
                </span>
              )}
            </div>

            <div className="admin-news-edit__field">
              <label htmlFor="nw-platform">
                Plateforme du post <span aria-hidden="true">*</span>
              </label>
              <select
                id="nw-platform"
                aria-required="true"
                aria-invalid={errors.social_platform ? 'true' : 'false'}
                {...register('social_platform')}
              >
                {NEWS_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_LABELS[p]}
                  </option>
                ))}
              </select>
              {errors.social_platform && (
                <span className="admin-news-edit__error" role="alert">
                  {errors.social_platform.message}
                </span>
              )}
            </div>

            {platform !== 'none' && (
              <div className="admin-news-edit__field admin-news-edit__field--full">
                <label htmlFor="nw-social-url">
                  URL du post {PLATFORM_LABELS[platform]} <span aria-hidden="true">*</span>
                </label>
                <input
                  id="nw-social-url"
                  type="url"
                  placeholder={
                    platform === 'instagram'
                      ? 'https://www.instagram.com/p/...'
                      : 'https://www.facebook.com/cscostwald/posts/...'
                  }
                  aria-invalid={errors.social_url ? 'true' : 'false'}
                  {...register('social_url')}
                />
                {errors.social_url && (
                  <span className="admin-news-edit__error" role="alert">
                    {errors.social_url.message}
                  </span>
                )}
              </div>
            )}

            <div className="admin-news-edit__field admin-news-edit__field--full">
              <label className="admin-news-edit__checkbox">
                <input type="checkbox" {...register('is_published')} />
                <span>Publier sur le site public (décocher pour garder en brouillon)</span>
              </label>
            </div>

            {submitError && (
              <p className="admin-news-edit__form-error" role="alert">
                {isApiError(submitError) ? submitError.message : 'Erreur inattendue.'}
              </p>
            )}

            <div className="admin-news-edit__form-actions">
              <Link to="/admin/news" className="admin-news-edit__cancel">
                Annuler
              </Link>
              <button
                type="submit"
                className="admin-news-edit__submit"
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
