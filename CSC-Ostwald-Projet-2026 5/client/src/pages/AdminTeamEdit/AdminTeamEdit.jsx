// ============================================================
// AdminTeamEdit.jsx — Single page for both CREATE and EDIT team members.
//
// /admin/team/new       → empty form, calls useCreateTeamMember
// /admin/team/:id/edit  → form pre-filled from useTeamMember(id)
// ============================================================
import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError } from '@api/client';
import {
  useTeamMember,
  useCreateTeamMember,
  useUpdateTeamMember,
  teamMemberSchema,
} from '@features/admin-team';
import PageSEO from '@components/layout/PageSEO';
import UploadField from '@components/ui/UploadField';
import './AdminTeamEdit.scss';
const EMPTY_DEFAULTS = {
  nom: '',
  prenom: '',
  role: '',
  email: '',
  phone: '',
  photo_url: '',
  display_order: '',
};
export default function AdminTeamEdit() {
  const { id: idParam } = useParams();
  const id = idParam ? Number(idParam) : 0;
  const isEdit = Number.isInteger(id) && id > 0;
  const navigate = useNavigate();
  const { data: existing, isLoading: isLoadingExisting } = useTeamMember(id);
  const createMutation = useCreateTeamMember();
  const updateMutation = useUpdateTeamMember();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: EMPTY_DEFAULTS,
  });
  useEffect(() => {
    if (existing) {
      reset({
        nom: existing.nom,
        prenom: existing.prenom,
        role: existing.role,
        email: existing.email ?? '',
        phone: existing.phone ?? '',
        photo_url: existing.photo_url ?? '',
        display_order: String(existing.display_order),
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
      navigate('/admin/team', { replace: true });
    } catch {
      // Error rendered inline below.
    }
  };
  const submitMutation = isEdit ? updateMutation : createMutation;
  const submitError = submitMutation.error;
  return (
    <>
      <PageSEO
        title={`${isEdit ? 'Éditer' : 'Nouveau'} membre — Admin CSC Ostwald`}
        description="Formulaire d'édition d'un membre de l'équipe"
        url={isEdit ? `/admin/team/${id}/edit` : '/admin/team/new'}
      />
      <div className="admin-team-edit">
        <header className="admin-team-edit__header">
          <Link to="/admin/team" className="admin-team-edit__back">
            ← Liste de l&apos;équipe
          </Link>
          <h1 className="admin-team-edit__title">
            {isEdit ? 'Éditer un membre' : 'Nouveau membre'}
          </h1>
        </header>

        {isEdit && isLoadingExisting && (
          <p className="admin-team-edit__state" role="status">
            Chargement…
          </p>
        )}

        {(!isEdit || existing) && (
          <form className="admin-team-edit__form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="admin-team-edit__field">
              <label htmlFor="tm-prenom">
                Prénom <span aria-hidden="true">*</span>
              </label>
              <input
                id="tm-prenom"
                type="text"
                autoComplete="given-name"
                aria-required="true"
                aria-invalid={errors.prenom ? 'true' : 'false'}
                {...register('prenom')}
              />
              {errors.prenom && (
                <span className="admin-team-edit__error" role="alert">
                  {errors.prenom.message}
                </span>
              )}
            </div>

            <div className="admin-team-edit__field">
              <label htmlFor="tm-nom">
                Nom <span aria-hidden="true">*</span>
              </label>
              <input
                id="tm-nom"
                type="text"
                autoComplete="family-name"
                aria-required="true"
                aria-invalid={errors.nom ? 'true' : 'false'}
                {...register('nom')}
              />
              {errors.nom && (
                <span className="admin-team-edit__error" role="alert">
                  {errors.nom.message}
                </span>
              )}
            </div>

            <div className="admin-team-edit__field admin-team-edit__field--full">
              <label htmlFor="tm-role">
                Rôle <span aria-hidden="true">*</span>
              </label>
              <input
                id="tm-role"
                type="text"
                placeholder="ex: Directeur, Référente familles, Animatrice jeunesse"
                aria-required="true"
                aria-invalid={errors.role ? 'true' : 'false'}
                {...register('role')}
              />
              {errors.role && (
                <span className="admin-team-edit__error" role="alert">
                  {errors.role.message}
                </span>
              )}
            </div>

            <div className="admin-team-edit__field">
              <label htmlFor="tm-email">Email</label>
              <input
                id="tm-email"
                type="email"
                autoComplete="email"
                placeholder="optionnel"
                aria-invalid={errors.email ? 'true' : 'false'}
                {...register('email')}
              />
              {errors.email && (
                <span className="admin-team-edit__error" role="alert">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="admin-team-edit__field">
              <label htmlFor="tm-phone">Téléphone</label>
              <input
                id="tm-phone"
                type="tel"
                autoComplete="tel"
                placeholder="ex: 07.45.09.96.02"
                aria-invalid={errors.phone ? 'true' : 'false'}
                {...register('phone')}
              />
              {errors.phone && (
                <span className="admin-team-edit__error" role="alert">
                  {errors.phone.message}
                </span>
              )}
            </div>

            <div className="admin-team-edit__field">
              <label htmlFor="tm-order">Ordre d&apos;affichage</label>
              <input
                id="tm-order"
                type="text"
                inputMode="numeric"
                placeholder="0 (par défaut)"
                aria-invalid={errors.display_order ? 'true' : 'false'}
                {...register('display_order')}
              />
              {errors.display_order && (
                <span className="admin-team-edit__error" role="alert">
                  {errors.display_order.message}
                </span>
              )}
            </div>

            <div className="admin-team-edit__field admin-team-edit__field--full">
              <label htmlFor="tm-photo-url">Photo</label>
              <Controller
                control={control}
                name="photo_url"
                render={({ field }) => (
                  <UploadField
                    id="tm-photo"
                    label="Photo de profil"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.photo_url && (
                <span className="admin-team-edit__error" role="alert">
                  {errors.photo_url.message}
                </span>
              )}
            </div>

            {submitError && (
              <p className="admin-team-edit__form-error" role="alert">
                {isApiError(submitError) ? submitError.message : 'Erreur inattendue.'}
              </p>
            )}

            <div className="admin-team-edit__form-actions">
              <Link to="/admin/team" className="admin-team-edit__cancel">
                Annuler
              </Link>
              <button
                type="submit"
                className="admin-team-edit__submit"
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
