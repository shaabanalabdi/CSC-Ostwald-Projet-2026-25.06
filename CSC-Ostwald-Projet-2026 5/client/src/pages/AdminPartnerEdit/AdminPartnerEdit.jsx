// ============================================================
// AdminPartnerEdit.jsx — CRÉATION + ÉDITION de partenaires.
//
// /admin/partners/new       → formulaire vide, useCreatePartner
// /admin/partners/:id/edit  → formulaire pré-rempli depuis usePartner(id)
// ============================================================
import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError } from '@api/client';
import {
  usePartner,
  useCreatePartner,
  useUpdatePartner,
  partnerSchema,
  PARTNER_CATEGORIES,
} from '@features/admin-partners';
import PageSEO from '@components/layout/PageSEO';
import UploadField from '@components/ui/UploadField';
import './AdminPartnerEdit.scss';
const CATEGORY_LABELS = {
  institutionnel: 'Institutionnel',
  associatif: 'Associatif',
};
const EMPTY_DEFAULTS = {
  name: '',
  logo_url: '',
  website_url: '',
  category: 'institutionnel',
  display_order: '',
};
export default function AdminPartnerEdit() {
  const { id: idParam } = useParams();
  const id = idParam ? Number(idParam) : 0;
  const isEdit = Number.isInteger(id) && id > 0;
  const navigate = useNavigate();
  const { data: existing, isLoading: isLoadingExisting } = usePartner(id);
  const createMutation = useCreatePartner();
  const updateMutation = useUpdatePartner();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(partnerSchema),
    defaultValues: EMPTY_DEFAULTS,
  });
  // L'aperçu du logo est rendu dans UploadField lui-même — pas de
  // useWatch nécessaire ici (la valeur contrôlée fait l'aller-retour via
  // Controller).
  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        logo_url: existing.logo_url,
        website_url: existing.website_url ?? '',
        category: existing.category,
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
      navigate('/admin/partners', { replace: true });
    } catch {
      // Erreur rendue en ligne plus bas.
    }
  };
  const submitMutation = isEdit ? updateMutation : createMutation;
  const submitError = submitMutation.error;
  return (
    <>
      <PageSEO
        title={`${isEdit ? 'Éditer' : 'Nouveau'} partenaire — Admin CSC Ostwald`}
        description="Formulaire d'édition d'un partenaire"
        url={isEdit ? `/admin/partners/${id}/edit` : '/admin/partners/new'}
      />
      <div className="admin-partner-edit">
        <header className="admin-partner-edit__header">
          <Link to="/admin/partners" className="admin-partner-edit__back">
            ← Liste des partenaires
          </Link>
          <h1 className="admin-partner-edit__title">
            {isEdit ? 'Éditer un partenaire' : 'Nouveau partenaire'}
          </h1>
        </header>

        {isEdit && isLoadingExisting && (
          <p className="admin-partner-edit__state" role="status">
            Chargement…
          </p>
        )}

        {(!isEdit || existing) && (
          <form className="admin-partner-edit__form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="admin-partner-edit__field admin-partner-edit__field--full">
              <label htmlFor="pt-name">
                Nom <span aria-hidden="true">*</span>
              </label>
              <input
                id="pt-name"
                type="text"
                aria-required="true"
                aria-invalid={errors.name ? 'true' : 'false'}
                {...register('name')}
              />
              {errors.name && (
                <span className="admin-partner-edit__error" role="alert">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className="admin-partner-edit__field">
              <label htmlFor="pt-category">
                Catégorie <span aria-hidden="true">*</span>
              </label>
              <select
                id="pt-category"
                aria-required="true"
                aria-invalid={errors.category ? 'true' : 'false'}
                {...register('category')}
              >
                {PARTNER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
              {errors.category && (
                <span className="admin-partner-edit__error" role="alert">
                  {errors.category.message}
                </span>
              )}
            </div>

            <div className="admin-partner-edit__field">
              <label htmlFor="pt-order">Ordre d&apos;affichage</label>
              <input
                id="pt-order"
                type="text"
                inputMode="numeric"
                placeholder="0 (par défaut)"
                aria-invalid={errors.display_order ? 'true' : 'false'}
                {...register('display_order')}
              />
              {errors.display_order && (
                <span className="admin-partner-edit__error" role="alert">
                  {errors.display_order.message}
                </span>
              )}
            </div>

            <div className="admin-partner-edit__field admin-partner-edit__field--full">
              <label htmlFor="pt-logo-url">
                Logo <span aria-hidden="true">*</span>
              </label>
              <Controller
                control={control}
                name="logo_url"
                render={({ field }) => (
                  <UploadField
                    id="pt-logo"
                    label="Logo du partenaire"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.logo_url && (
                <span className="admin-partner-edit__error" role="alert">
                  {errors.logo_url.message}
                </span>
              )}
            </div>

            <div className="admin-partner-edit__field admin-partner-edit__field--full">
              <label htmlFor="pt-site">Site web</label>
              <input
                id="pt-site"
                type="url"
                placeholder="https://… (optionnel)"
                aria-invalid={errors.website_url ? 'true' : 'false'}
                {...register('website_url')}
              />
              {errors.website_url && (
                <span className="admin-partner-edit__error" role="alert">
                  {errors.website_url.message}
                </span>
              )}
            </div>

            {submitError && (
              <p className="admin-partner-edit__form-error" role="alert">
                {isApiError(submitError) ? submitError.message : 'Erreur inattendue.'}
              </p>
            )}

            <div className="admin-partner-edit__form-actions">
              <Link to="/admin/partners" className="admin-partner-edit__cancel">
                Annuler
              </Link>
              <button
                type="submit"
                className="admin-partner-edit__submit"
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
