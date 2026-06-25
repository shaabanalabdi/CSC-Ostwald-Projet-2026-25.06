// ============================================================
// AdminProjetSocialEdit.jsx — CRÉATION + ÉDITION d'un document
// téléchargeable.
//
// /admin/projet-social/new       → formulaire vide, useCreateProjetSocialDocument
// /admin/projet-social/:id/edit  → formulaire pré-rempli depuis useProjetSocialDocument(id)
//
// Le chemin du fichier est du texte libre (l'admin tape
// `/documents/<nom>.pdf` ou une URL https) — le backend valide la forme.
// Le PDF réel doit être téléversé séparément dans
// client/public/documents/.
// ============================================================
import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError } from '@api/client';
import {
  useProjetSocialDocument,
  useCreateProjetSocialDocument,
  useUpdateProjetSocialDocument,
  projetSocialDocumentSchema,
  PROJET_SOCIAL_COLORS,
} from '@features/admin-projet-social';
import PageSEO from '@components/layout/PageSEO';
import './AdminProjetSocialEdit.scss';
const COLOR_LABELS = {
  orange: 'Orange',
  blue: 'Bleu',
  green: 'Vert',
};
const EMPTY_DEFAULTS = {
  title: '',
  description: '',
  file_url: '',
  badge_label: 'PDF',
  color: 'blue',
  display_order: '',
  is_published: true,
};
export default function AdminProjetSocialEdit() {
  const { id: idParam } = useParams();
  const id = idParam ? Number(idParam) : 0;
  const isEdit = Number.isInteger(id) && id > 0;
  const navigate = useNavigate();
  const { data: existing, isLoading: isLoadingExisting } = useProjetSocialDocument(id);
  const createMutation = useCreateProjetSocialDocument();
  const updateMutation = useUpdateProjetSocialDocument();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(projetSocialDocumentSchema),
    defaultValues: EMPTY_DEFAULTS,
  });
  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        description: existing.description ?? '',
        file_url: existing.file_url,
        badge_label: existing.badge_label,
        color: existing.color,
        display_order: String(existing.display_order),
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
      navigate('/admin/projet-social', { replace: true });
    } catch {
      // Error rendered inline below.
    }
  };
  const submitMutation = isEdit ? updateMutation : createMutation;
  const submitError = submitMutation.error;
  return (
    <>
      <PageSEO
        title={`${isEdit ? 'Éditer' : 'Nouveau'} document Projet Social — Admin CSC Ostwald`}
        description="Formulaire d'édition d'un document Projet Social"
        url={isEdit ? `/admin/projet-social/${id}/edit` : '/admin/projet-social/new'}
      />
      <div className="admin-projet-social-edit">
        <header className="admin-projet-social-edit__header">
          <Link to="/admin/projet-social" className="admin-projet-social-edit__back">
            ← Liste des documents
          </Link>
          <h1 className="admin-projet-social-edit__title">
            {isEdit ? 'Éditer un document' : 'Nouveau document'}
          </h1>
        </header>

        {isEdit && isLoadingExisting && (
          <p className="admin-projet-social-edit__state" role="status">
            Chargement…
          </p>
        )}

        {(!isEdit || existing) && (
          <form
            className="admin-projet-social-edit__form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div className="admin-projet-social-edit__field admin-projet-social-edit__field--full">
              <label htmlFor="ps-title">
                Titre <span aria-hidden="true">*</span>
              </label>
              <input
                id="ps-title"
                type="text"
                aria-required="true"
                aria-invalid={errors.title ? 'true' : 'false'}
                {...register('title')}
              />
              {errors.title && (
                <span className="admin-projet-social-edit__error" role="alert">
                  {errors.title.message}
                </span>
              )}
            </div>

            <div className="admin-projet-social-edit__field admin-projet-social-edit__field--full">
              <label htmlFor="ps-description">Description</label>
              <textarea
                id="ps-description"
                rows={3}
                placeholder="Description courte affichée sur la carte"
                aria-invalid={errors.description ? 'true' : 'false'}
                {...register('description')}
              />
              {errors.description && (
                <span className="admin-projet-social-edit__error" role="alert">
                  {errors.description.message}
                </span>
              )}
            </div>

            <div className="admin-projet-social-edit__field admin-projet-social-edit__field--full">
              <label htmlFor="ps-file-url">
                Chemin du fichier <span aria-hidden="true">*</span>
              </label>
              <input
                id="ps-file-url"
                type="text"
                placeholder="/documents/mon-fichier.pdf ou https://..."
                aria-required="true"
                aria-invalid={errors.file_url ? 'true' : 'false'}
                {...register('file_url')}
              />
              <span className="admin-projet-social-edit__hint">
                Déposez le PDF dans <code>client/public/documents/</code> puis collez
                <code>/documents/&lt;nom&gt;.pdf</code>. Ou utilisez une URL https complète.
              </span>
              {errors.file_url && (
                <span className="admin-projet-social-edit__error" role="alert">
                  {errors.file_url.message}
                </span>
              )}
            </div>

            <div className="admin-projet-social-edit__field">
              <label htmlFor="ps-badge">
                Étiquette <span aria-hidden="true">*</span>
              </label>
              <input
                id="ps-badge"
                type="text"
                placeholder="PDF, CERFA, RAPPORT…"
                aria-required="true"
                aria-invalid={errors.badge_label ? 'true' : 'false'}
                {...register('badge_label')}
              />
              {errors.badge_label && (
                <span className="admin-projet-social-edit__error" role="alert">
                  {errors.badge_label.message}
                </span>
              )}
            </div>

            <div className="admin-projet-social-edit__field">
              <label htmlFor="ps-color">
                Couleur <span aria-hidden="true">*</span>
              </label>
              <select
                id="ps-color"
                aria-required="true"
                aria-invalid={errors.color ? 'true' : 'false'}
                {...register('color')}
              >
                {PROJET_SOCIAL_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {COLOR_LABELS[c]}
                  </option>
                ))}
              </select>
              {errors.color && (
                <span className="admin-projet-social-edit__error" role="alert">
                  {errors.color.message}
                </span>
              )}
            </div>

            <div className="admin-projet-social-edit__field">
              <label htmlFor="ps-order">Ordre d&apos;affichage</label>
              <input
                id="ps-order"
                type="text"
                inputMode="numeric"
                placeholder="0 (par défaut)"
                aria-invalid={errors.display_order ? 'true' : 'false'}
                {...register('display_order')}
              />
              {errors.display_order && (
                <span className="admin-projet-social-edit__error" role="alert">
                  {errors.display_order.message}
                </span>
              )}
            </div>

            <div className="admin-projet-social-edit__field admin-projet-social-edit__field--full">
              <label className="admin-projet-social-edit__checkbox">
                <input type="checkbox" {...register('is_published')} />
                <span>Publier sur le site public (décocher pour garder en brouillon)</span>
              </label>
            </div>

            {submitError && (
              <p className="admin-projet-social-edit__form-error" role="alert">
                {isApiError(submitError) ? submitError.message : 'Erreur inattendue.'}
              </p>
            )}

            <div className="admin-projet-social-edit__form-actions">
              <Link to="/admin/projet-social" className="admin-projet-social-edit__cancel">
                Annuler
              </Link>
              <button
                type="submit"
                className="admin-projet-social-edit__submit"
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
