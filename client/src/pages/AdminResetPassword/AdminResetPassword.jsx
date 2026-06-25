// ============================================================
// AdminResetPassword.jsx — Page "Nouveau mot de passe" (/admin/reset-password).
//
// Récupère le token depuis le paramètre URL `?token=...` envoyé par e-mail.
// Si le token est absent, redirige immédiatement vers /admin/forgot-password.
// En cas de succès, redirige vers /admin/login avec un message de confirmation.
// ============================================================
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useResetPassword, resetPasswordSchema } from '@features/auth';
import { isApiError } from '@api/client';
import PageSEO from '@components/layout/PageSEO';
import './AdminResetPassword.scss';

export default function AdminResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formError, setFormError] = useState(null);
  const mutation = useResetPassword();

  // Si le token est absent dans l'URL, on redirige vers la page de demande.
  useEffect(() => {
    if (!token) {
      navigate('/admin/forgot-password', { replace: true });
    }
  }, [token, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm: '' },
  });

  const onSubmit = async (data) => {
    setFormError(null);
    try {
      await mutation.mutateAsync({ token, password: data.password });
      // Redirige vers la connexion avec un indicateur de succès affiché via state.
      navigate('/admin/login', {
        replace: true,
        state: { passwordReset: true },
      });
    } catch (err) {
      setFormError(isApiError(err) ? err.message : 'Erreur inattendue. Veuillez réessayer.');
    }
  };

  if (!token) return null;

  return (
    <>
      <PageSEO
        title="Nouveau mot de passe — CSC Ostwald"
        description="Définir un nouveau mot de passe administrateur"
        url="/admin/reset-password"
      />
      <div className="admin-login">
        <div className="admin-login__card">
          <Link to="/admin/login" className="admin-login__back">
            ← Retour à la connexion
          </Link>

          <h1 className="admin-login__title">Nouveau mot de passe</h1>
          <p className="admin-login__subtitle">
            Choisissez un mot de passe sécurisé d&apos;au moins 8 caractères.
          </p>

          <form className="admin-login__form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="admin-login__field">
              <label htmlFor="reset-password">Nouveau mot de passe</label>
              <input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                aria-required="true"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'reset-password-error' : undefined}
                {...register('password')}
              />
              {errors.password && (
                <span id="reset-password-error" className="admin-login__error" role="alert">
                  {errors.password.message}
                </span>
              )}
            </div>

            <div className="admin-login__field">
              <label htmlFor="reset-confirm">Confirmer le mot de passe</label>
              <input
                id="reset-confirm"
                type="password"
                autoComplete="new-password"
                aria-required="true"
                aria-invalid={errors.confirm ? 'true' : 'false'}
                aria-describedby={errors.confirm ? 'reset-confirm-error' : undefined}
                {...register('confirm')}
              />
              {errors.confirm && (
                <span id="reset-confirm-error" className="admin-login__error" role="alert">
                  {errors.confirm.message}
                </span>
              )}
            </div>

            {formError && (
              <p className="admin-login__form-error" role="alert">
                {formError}
              </p>
            )}

            <button
              type="submit"
              className="admin-login__submit"
              disabled={isSubmitting || mutation.isPending}
            >
              {mutation.isPending ? 'Enregistrement…' : 'Enregistrer le nouveau mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
