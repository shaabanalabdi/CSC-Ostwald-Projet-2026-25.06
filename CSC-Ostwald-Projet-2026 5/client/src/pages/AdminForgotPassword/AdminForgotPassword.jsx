// ============================================================
// AdminForgotPassword.jsx — Page "Mot de passe oublié" (/admin/forgot-password).
//
// L'admin saisit son e-mail. Le backend envoie un lien sécurisé valable
// 15 minutes. La réponse est toujours identique (succès ou e-mail inconnu)
// pour ne pas révéler quels comptes existent.
// ============================================================
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForgotPassword, forgotPasswordSchema } from '@features/auth';
import { isApiError } from '@api/client';
import PageSEO from '@components/layout/PageSEO';
import './AdminForgotPassword.scss';

export default function AdminForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState(null);

  const mutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    setFormError(null);
    try {
      await mutation.mutateAsync(data);
      setSubmitted(true);
    } catch (err) {
      setFormError(isApiError(err) ? err.message : 'Erreur inattendue. Veuillez réessayer.');
    }
  };

  return (
    <>
      <PageSEO
        title="Mot de passe oublié — CSC Ostwald"
        description="Réinitialisation du mot de passe administrateur"
        url="/admin/forgot-password"
      />
      <div className="admin-login">
        <div className="admin-login__card">
          <Link to="/admin/login" className="admin-login__back">
            ← Retour à la connexion
          </Link>

          {submitted ? (
            <div className="admin-forgot__confirm">
              <h1 className="admin-login__title">E-mail envoyé</h1>
              <p className="admin-forgot__confirm-text">
                Si cette adresse est associée à un compte administrateur, vous recevrez
                un e-mail contenant un lien de réinitialisation valable{' '}
                <strong>15 minutes</strong>.
              </p>
              <p className="admin-forgot__confirm-hint">
                Pensez à vérifier votre dossier spam si vous ne le recevez pas.
              </p>
              <Link to="/admin/login" className="admin-login__submit admin-forgot__confirm-btn">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <h1 className="admin-login__title">Mot de passe oublié</h1>
              <p className="admin-login__subtitle">
                Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation.
              </p>

              <form className="admin-login__form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="admin-login__field">
                  <label htmlFor="forgot-email">Adresse e-mail</label>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'forgot-email-error' : undefined}
                    {...register('email')}
                  />
                  {errors.email && (
                    <span id="forgot-email-error" className="admin-login__error" role="alert">
                      {errors.email.message}
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
                  {mutation.isPending ? 'Envoi en cours…' : 'Envoyer le lien'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
