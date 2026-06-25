// ============================================================
// AdminEventEdit.jsx — Page unique pour CRÉATION et ÉDITION
// d'événements.
//
// La route gère les deux modes :
//   /admin/events/new       → formulaire vide, appelle useCreateEvent
//   /admin/events/:id/edit  → formulaire pré-rempli depuis useEvent(id)
//
// `date_event` est collecté via <input type="datetime-local"> qui
// renvoie « YYYY-MM-DDTHH:mm » dans le fuseau local de l'utilisateur. Au
// pré-remplissage d'un événement existant, on tronque la chaîne ISO à
// cette même forme pour que l'input rende la valeur (l'input rejette
// l'ISO complet avec fuseau).
// ============================================================
import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError } from '@api/client';
import { useEvent, useCreateEvent, useUpdateEvent, eventSchema } from '@features/admin-events';
import PageSEO from '@components/layout/PageSEO';
import UploadField from '@components/ui/UploadField';
import './AdminEventEdit.scss';
const EMPTY_DEFAULTS = {
  title: '',
  description: '',
  date_event: '',
  lieu: '',
  cout: '',
  capacite: '',
  category_label: '',
  category_color: '',
  image_url: '',
  show_in_agenda: true,
};
/**
 * Convertit une chaîne ISO (« 2027-09-12T18:30:00.000Z » ou avec
 * décalage) vers la forme « YYYY-MM-DDTHH:mm » qu'accepte
 * <input type="datetime-local">. Renvoie '' quand l'entrée est
 * impossible à parser.
 */
function isoToLocalInput(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}
export default function AdminEventEdit() {
  const { id: idParam } = useParams();
  const id = idParam ? Number(idParam) : 0;
  const isEdit = Number.isInteger(id) && id > 0;
  const navigate = useNavigate();
  const { data: existing, isLoading: isLoadingExisting } = useEvent(id);
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: EMPTY_DEFAULTS,
  });
  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        description: existing.description ?? '',
        date_event: isoToLocalInput(existing.date_event),
        lieu: existing.lieu ?? '',
        cout: existing.cout ?? '',
        capacite: existing.capacite !== null ? String(existing.capacite) : '',
        category_label: existing.category_label ?? '',
        category_color: existing.category_color ?? '',
        image_url: existing.image_url ?? '',
        show_in_agenda: existing.show_in_agenda === 1,
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
      navigate('/admin/events', { replace: true });
    } catch {
      // Error state rendered below.
    }
  };
  const submitMutation = isEdit ? updateMutation : createMutation;
  const submitError = submitMutation.error;
  return (
    <>
      <PageSEO
        title={`${isEdit ? 'Éditer' : 'Nouvel'} événement — Admin CSC Ostwald`}
        description="Formulaire d'édition d'événement"
        url={isEdit ? `/admin/events/${id}/edit` : '/admin/events/new'}
      />
      <div className="admin-event-edit">
        <header className="admin-event-edit__header">
          <Link to="/admin/events" className="admin-event-edit__back">
            ← Liste des événements
          </Link>
          <h1 className="admin-event-edit__title">
            {isEdit ? 'Éditer un événement' : 'Nouvel événement'}
          </h1>
        </header>

        {isEdit && isLoadingExisting && (
          <p className="admin-event-edit__state" role="status">
            Chargement…
          </p>
        )}

        {(!isEdit || existing) && (
          <form className="admin-event-edit__form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="admin-event-edit__field">
              <label htmlFor="ev-title">
                Titre <span aria-hidden="true">*</span>
              </label>
              <input
                id="ev-title"
                type="text"
                aria-required="true"
                aria-invalid={errors.title ? 'true' : 'false'}
                aria-describedby={errors.title ? 'ev-title-err' : undefined}
                {...register('title')}
              />
              {errors.title && (
                <span id="ev-title-err" className="admin-event-edit__error" role="alert">
                  {errors.title.message}
                </span>
              )}
            </div>

            <div className="admin-event-edit__field">
              <label htmlFor="ev-date">
                Date &amp; heure <span aria-hidden="true">*</span>
              </label>
              <input
                id="ev-date"
                type="datetime-local"
                aria-required="true"
                aria-invalid={errors.date_event ? 'true' : 'false'}
                aria-describedby={errors.date_event ? 'ev-date-err' : undefined}
                {...register('date_event')}
              />
              {errors.date_event && (
                <span id="ev-date-err" className="admin-event-edit__error" role="alert">
                  {errors.date_event.message}
                </span>
              )}
            </div>

            <div className="admin-event-edit__field admin-event-edit__field--full">
              <label htmlFor="ev-description">Description</label>
              <textarea
                id="ev-description"
                rows={6}
                aria-invalid={errors.description ? 'true' : 'false'}
                {...register('description')}
              />
              {errors.description && (
                <span className="admin-event-edit__error" role="alert">
                  {errors.description.message}
                </span>
              )}
            </div>

            <div className="admin-event-edit__field">
              <label htmlFor="ev-lieu">Lieu</label>
              <input id="ev-lieu" type="text" {...register('lieu')} />
              {errors.lieu && (
                <span className="admin-event-edit__error" role="alert">
                  {errors.lieu.message}
                </span>
              )}
            </div>

            <div className="admin-event-edit__field">
              <label htmlFor="ev-cout">Coût</label>
              <input id="ev-cout" type="text" placeholder="ex: Gratuit, 5€" {...register('cout')} />
              {errors.cout && (
                <span className="admin-event-edit__error" role="alert">
                  {errors.cout.message}
                </span>
              )}
            </div>

            <div className="admin-event-edit__field">
              <label htmlFor="ev-capacite">Capacité</label>
              <input
                id="ev-capacite"
                type="text"
                inputMode="numeric"
                placeholder="ex: 30"
                {...register('capacite')}
              />
              {errors.capacite && (
                <span className="admin-event-edit__error" role="alert">
                  {errors.capacite.message}
                </span>
              )}
            </div>

            <div className="admin-event-edit__field">
              <label htmlFor="ev-cat-label">Catégorie</label>
              <input
                id="ev-cat-label"
                type="text"
                placeholder="ex: Atelier pour enfants"
                {...register('category_label')}
              />
              {errors.category_label && (
                <span className="admin-event-edit__error" role="alert">
                  {errors.category_label.message}
                </span>
              )}
            </div>

            <div className="admin-event-edit__field">
              <label htmlFor="ev-cat-color">Couleur de la catégorie</label>
              <input
                id="ev-cat-color"
                type="text"
                placeholder="#ee961b (orange CSC)"
                {...register('category_color')}
              />
              {errors.category_color && (
                <span className="admin-event-edit__error" role="alert">
                  {errors.category_color.message}
                </span>
              )}
            </div>

            <div className="admin-event-edit__field admin-event-edit__field--full">
              <label htmlFor="ev-image-url">Image</label>
              <Controller
                control={control}
                name="image_url"
                render={({ field }) => (
                  <UploadField
                    id="ev-image"
                    label="Image de l'événement"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.image_url && (
                <span className="admin-event-edit__error" role="alert">
                  {errors.image_url.message}
                </span>
              )}
            </div>

            <div className="admin-event-edit__field admin-event-edit__field--full">
              <label className="admin-event-edit__checkbox">
                <input type="checkbox" {...register('show_in_agenda')} />
                <span>Afficher dans l&apos;agenda public (décocher pour cacher du site)</span>
              </label>
            </div>

            {submitError && (
              <p className="admin-event-edit__form-error" role="alert">
                {isApiError(submitError) ? submitError.message : 'Erreur inattendue.'}
              </p>
            )}

            <div className="admin-event-edit__form-actions">
              <Link to="/admin/events" className="admin-event-edit__cancel">
                Annuler
              </Link>
              <button
                type="submit"
                className="admin-event-edit__submit"
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
