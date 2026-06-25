// ============================================================
// AdminActivityEdit.jsx — Page unique pour CRÉATION et ÉDITION.
//
// La route gère les deux modes :
//   /admin/activities/new      → formulaire vide, appelle useCreateActivity
//   /admin/activities/:id/edit → formulaire pré-rempli depuis useActivity(id)
//
// Distingués par l'`id` du paramètre de route. À la soumission, le
// schéma est le même ; seul le hook de mutation diffère.
// ============================================================
import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError } from '@api/client';
import {
  useActivity,
  useCreateActivity,
  useUpdateActivity,
  activitySchema,
  ACTIVITY_TYPES,
  ACTIVITY_FREQUENCES,
} from '@features/admin-activities';
import PageSEO from '@components/layout/PageSEO';
import UploadField from '@components/ui/UploadField';
import './AdminActivityEdit.scss';
const TYPE_LABELS = {
  famille: 'Famille',
  jeunesse: 'Jeunesse',
  reguliere: 'Régulière',
};
const EMPTY_DEFAULTS = {
  title: '',
  description: '',
  activity_type: 'famille',
  lieu: '',
  jour: '',
  horaire: '',
  cout: '',
  capacite: '',
  frequence: '',
  categorie_label: '',
  tag: '',
  image_url: '',
  is_published: true,
};
export default function AdminActivityEdit() {
  const { id: idParam } = useParams();
  const id = idParam ? Number(idParam) : 0;
  const isEdit = Number.isInteger(id) && id > 0;
  const navigate = useNavigate();
  const { data: existing, isLoading: isLoadingExisting } = useActivity(id);
  const createMutation = useCreateActivity();
  const updateMutation = useUpdateActivity();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(activitySchema),
    defaultValues: EMPTY_DEFAULTS,
  });
  // Quand l'activité existante charge (mode édition), pré-remplit le formulaire.
  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        description: existing.description,
        activity_type: existing.activity_type,
        lieu: existing.lieu ?? '',
        jour: existing.jour ?? '',
        horaire: existing.horaire ?? '',
        cout: existing.cout ?? '',
        capacite: existing.capacite !== null ? String(existing.capacite) : '',
        frequence: existing.frequence ?? '',
        categorie_label: existing.categorie_label ?? '',
        tag: existing.tag ?? '',
        image_url: existing.image_url ?? '',
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
      navigate('/admin/activities', { replace: true });
    } catch {
      // L'état d'erreur est rendu plus bas ; rien à faire ici.
    }
  };
  const submitMutation = isEdit ? updateMutation : createMutation;
  const submitError = submitMutation.error;
  return (
    <>
      <PageSEO
        title={`${isEdit ? 'Éditer' : 'Nouvelle'} activité — Admin CSC Ostwald`}
        description="Formulaire d'édition d'activité"
        url={isEdit ? `/admin/activities/${id}/edit` : '/admin/activities/new'}
      />
      <div className="admin-activity-edit">
        <header className="admin-activity-edit__header">
          <Link to="/admin/activities" className="admin-activity-edit__back">
            ← Liste des activités
          </Link>
          <h1 className="admin-activity-edit__title">
            {isEdit ? 'Éditer une activité' : 'Nouvelle activité'}
          </h1>
        </header>

        {isEdit && isLoadingExisting && (
          <p className="admin-activity-edit__state" role="status">
            Chargement…
          </p>
        )}

        {(!isEdit || existing) && (
          <form className="admin-activity-edit__form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="admin-activity-edit__field">
              <label htmlFor="act-title">
                Titre <span aria-hidden="true">*</span>
              </label>
              <input
                id="act-title"
                type="text"
                aria-required="true"
                aria-invalid={errors.title ? 'true' : 'false'}
                aria-describedby={errors.title ? 'act-title-err' : undefined}
                {...register('title')}
              />
              {errors.title && (
                <span id="act-title-err" className="admin-activity-edit__error" role="alert">
                  {errors.title.message}
                </span>
              )}
            </div>

            <div className="admin-activity-edit__field">
              <label htmlFor="act-type">
                Type <span aria-hidden="true">*</span>
              </label>
              <select
                id="act-type"
                aria-required="true"
                aria-invalid={errors.activity_type ? 'true' : 'false'}
                {...register('activity_type')}
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              {errors.activity_type && (
                <span className="admin-activity-edit__error" role="alert">
                  {errors.activity_type.message}
                </span>
              )}
            </div>

            <div className="admin-activity-edit__field admin-activity-edit__field--full">
              <label htmlFor="act-description">
                Description <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="act-description"
                rows={6}
                aria-required="true"
                aria-invalid={errors.description ? 'true' : 'false'}
                aria-describedby={errors.description ? 'act-desc-err' : undefined}
                {...register('description')}
              />
              {errors.description && (
                <span id="act-desc-err" className="admin-activity-edit__error" role="alert">
                  {errors.description.message}
                </span>
              )}
            </div>

            <div className="admin-activity-edit__field">
              <label htmlFor="act-lieu">Lieu</label>
              <input id="act-lieu" type="text" {...register('lieu')} />
              {errors.lieu && (
                <span className="admin-activity-edit__error" role="alert">
                  {errors.lieu.message}
                </span>
              )}
            </div>

            <div className="admin-activity-edit__field">
              <label htmlFor="act-jour">Jour</label>
              <input
                id="act-jour"
                type="text"
                placeholder="ex: Mercredi, Chaque semaine"
                {...register('jour')}
              />
              {errors.jour && (
                <span className="admin-activity-edit__error" role="alert">
                  {errors.jour.message}
                </span>
              )}
            </div>

            <div className="admin-activity-edit__field">
              <label htmlFor="act-horaire">Horaire</label>
              <input
                id="act-horaire"
                type="text"
                placeholder="ex: 14h-17h"
                {...register('horaire')}
              />
              {errors.horaire && (
                <span className="admin-activity-edit__error" role="alert">
                  {errors.horaire.message}
                </span>
              )}
            </div>

            <div className="admin-activity-edit__field">
              <label htmlFor="act-cout">Coût</label>
              <input
                id="act-cout"
                type="text"
                placeholder="ex: Gratuit, 5€"
                {...register('cout')}
              />
              {errors.cout && (
                <span className="admin-activity-edit__error" role="alert">
                  {errors.cout.message}
                </span>
              )}
            </div>

            <div className="admin-activity-edit__field">
              <label htmlFor="act-capacite">Capacité</label>
              <input
                id="act-capacite"
                type="number"
                min={1}
                placeholder="ex: 12"
                {...register('capacite')}
              />
              {errors.capacite && (
                <span className="admin-activity-edit__error" role="alert">
                  {errors.capacite.message}
                </span>
              )}
            </div>

            <div className="admin-activity-edit__field">
              <label htmlFor="act-frequence">Fréquence</label>
              <select id="act-frequence" {...register('frequence')}>
                <option value="">— Aucune —</option>
                {ACTIVITY_FREQUENCES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              {errors.frequence && (
                <span className="admin-activity-edit__error" role="alert">
                  {errors.frequence.message}
                </span>
              )}
            </div>

            <div className="admin-activity-edit__field">
              <label htmlFor="act-categorie-label">Catégorie (libellé carte)</label>
              <input
                id="act-categorie-label"
                type="text"
                placeholder="ex: SORTIE EN TRIBU"
                {...register('categorie_label')}
              />
              {errors.categorie_label && (
                <span className="admin-activity-edit__error" role="alert">
                  {errors.categorie_label.message}
                </span>
              )}
            </div>

            <div className="admin-activity-edit__field">
              <label htmlFor="act-tag">Tag</label>
              <input
                id="act-tag"
                type="text"
                placeholder="ex: famille, séance, jeune"
                {...register('tag')}
              />
              {errors.tag && (
                <span className="admin-activity-edit__error" role="alert">
                  {errors.tag.message}
                </span>
              )}
            </div>

            <div className="admin-activity-edit__field admin-activity-edit__field--full">
              <label htmlFor="act-image-url">Image</label>
              <Controller
                control={control}
                name="image_url"
                render={({ field }) => (
                  <UploadField
                    id="act-image"
                    label="Image de l'activité"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.image_url && (
                <span className="admin-activity-edit__error" role="alert">
                  {errors.image_url.message}
                </span>
              )}
            </div>

            <div className="admin-activity-edit__field admin-activity-edit__field--full">
              <label className="admin-activity-edit__checkbox">
                <input type="checkbox" {...register('is_published')} />
                <span>Publier sur le site public (décocher pour garder en brouillon)</span>
              </label>
            </div>

            {submitError && (
              <p className="admin-activity-edit__form-error" role="alert">
                {isApiError(submitError) ? submitError.message : 'Erreur inattendue.'}
              </p>
            )}

            <div className="admin-activity-edit__form-actions">
              <Link to="/admin/activities" className="admin-activity-edit__cancel">
                Annuler
              </Link>
              <button
                type="submit"
                className="admin-activity-edit__submit"
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
