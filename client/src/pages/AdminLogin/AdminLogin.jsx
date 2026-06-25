// ============================================================
// AdminLogin.jsx — Page de connexion admin interne (/admin/login).
//
// Stack : RHF + Zod (loginSchema) + React Query (useLogin). Après une
// connexion réussie, le user.toJSON() arrive dans le cache ; on invalide
// la query useMe pour que le ProtectedRoute de la page de destination
// refetch et voie immédiatement l'utilisateur authentifié.
// ============================================================
import { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useLogin, loginSchema } from '@features/auth';
import { isApiError } from '@api/client';
import PageSEO from '@components/layout/PageSEO';
import './AdminLogin.scss';
export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();
  const [formError, setFormError] = useState(null);

  // Bannière de succès après réinitialisation de mot de passe.
  const passwordReset = location.state?.passwordReset ?? false;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const onSubmit = async (data) => {
    setFormError(null);
    try {
      await loginMutation.mutateAsync(data);
      // Force ProtectedRoute (next page) to re-fetch the session.
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      // Resume the intended URL if the user was bounced here, else dashboard.
      const from = location.state?.from?.pathname;
      navigate(from ?? '/admin/dashboard', { replace: true });
    } catch (err) {
      setFormError(isApiError(err) ? err.message : 'Erreur inattendue. Veuillez réessayer.');
    }
  };
  return (
    <>
      <PageSEO
        title="Connexion admin — CSC Ostwald"
        description="Espace d'administration du Centre Social et Culturel d'Ostwald"
        url="/admin/login"
      />
      <div className="admin-login">
        <div className="admin-login__card">
          <Link to="/" className="admin-login__back">
            ← Retour au site
          </Link>
          <h1 className="admin-login__title">Connexion admin</h1>
          <p className="admin-login__subtitle">CSC Ostwald — espace d&apos;administration</p>

          {passwordReset && (
            <p className="admin-login__success" role="status">
              Mot de passe mis à jour. Vous pouvez maintenant vous connecter.
            </p>
          )}

          <form className="admin-login__form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="admin-login__field">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                aria-required="true"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'admin-email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <span id="admin-email-error" className="admin-login__error" role="alert">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="admin-login__field">
              <label htmlFor="admin-password">Mot de passe</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                aria-required="true"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'admin-password-error' : undefined}
                {...register('password')}
              />
              {errors.password && (
                <span id="admin-password-error" className="admin-login__error" role="alert">
                  {errors.password.message}
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
              disabled={isSubmitting || loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Connexion…' : 'Se connecter'}
            </button>

            <Link to="/admin/forgot-password" className="admin-login__forgot">
              Mot de passe oublié ?
            </Link>
          </form>
        </div>
      </div>
    </>
  );
}
