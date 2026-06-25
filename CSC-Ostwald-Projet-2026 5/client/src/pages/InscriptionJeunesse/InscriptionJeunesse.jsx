// ============================================================
// InscriptionJeunesse.jsx — Formulaire d'inscription public.
//
// Accédé via /inscription-jeunesse?activity_id=N&title=…
//   - `activity_id` est le seul paramètre obligatoire (et le seul
//     qu'utilise le backend).
//   - `title` est un sucre d'affichage OPTIONNEL pour que le formulaire
//     montre le nom de l'activité pendant son chargement. Le titre
//     faisant foi vient de l'activité elle-même.
//
// Parcours :
//   1. Lire activity_id depuis l'URL.
//   2. Récupérer l'activité (on met déjà en cache
//      /api/activities?type=jeunesse sur la page Jeunesse, donc c'est en
//      général instantané) et lire `price_cents` depuis le serveur.
//   3. L'utilisateur remplit prenom / nom / email + consentement RGPD.
//   4. À la soumission, POST /api/payment/checkout. Le backend ignore
//      tout `amount_cents` envoyé par le client et utilise
//      `activity.price_cents` — il n'y a AUCUN moyen pour un utilisateur
//      de payer moins que le prix configuré en trafiquant cette page ou
//      l'URL.
//   5. window.location.assign(checkoutUrl) → HelloAsso (réel ou mock).
// ============================================================
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@api/client';
import { useCheckout, createRegistrationSchema } from '@features/registration';
import { usePublicActivities } from '@features/activities';
import PageSEO from '@components/layout/PageSEO';
import { PAYMENTS_ENABLED } from '@/config/features';
import './InscriptionJeunesse.scss';
function formatAmount(cents) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
export default function InscriptionJeunesse() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [submitError, setSubmitError] = useState(null);
  const activityId = Number(searchParams.get('activity_id') ?? '');
  const fallbackTitle = searchParams.get('title') ?? '';

  // Récupère l'activité depuis la liste publique pour afficher le prix
  // faisant foi côté serveur. La liste est déjà mise en cache une heure
  // par usePublicActivities, donc c'est presque toujours un cache hit.
  const { data: activities, isLoading: activitiesLoading } = usePublicActivities('jeunesse');
  const activity = Array.isArray(activities)
    ? activities.find((a) => a.id === activityId)
    : undefined;
  const activityTitle = activity?.title ?? fallbackTitle;
  // Prix faisant foi côté serveur. Null tant que l'activité ne charge
  // pas OU si l'admin n'a pas défini price_cents sur cette activité (on
  // traite les deux comme « soumission désactivée » plutôt que d'afficher
  // un 0,00 € trompeur).
  const amountCents =
    activity && Number.isInteger(activity.price_cents) ? activity.price_cents : null;

  const schema = useMemo(() => createRegistrationSchema(t), [t]);
  const checkoutMutation = useCheckout();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { prenom: '', nom: '', email: '', rgpdConsent: false },
  });
  const onSubmit = async (data) => {
    setSubmitError(null);
    try {
      const result = await checkoutMutation.mutateAsync({
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        activity_id: activityId,
        // amount_cents intentionnellement omis — le backend l'ignore et
        // utilise activity.price_cents côté serveur. L'envoyer serait
        // trompeur : on croirait que le prix vient du client.
        activity_title: activityTitle || undefined,
      });
      // Redirige l'utilisateur vers HelloAsso (ou l'URL mock-success en
      // dev). assign() (et non `href = ...`) garde la navigation dans
      // l'historique pour que le bouton retour ramène l'utilisateur de
      // HelloAsso vers ce formulaire.
      window.location.assign(result.checkoutUrl);
    } catch (err) {
      setSubmitError(isApiError(err) ? err.message : t('inscription.erreurInattendue'));
    }
  };
  // Affiche « Lien invalide » uniquement quand l'URL elle-même est
  // cassée. Le cas « price_cents manquant » affiche un message différent
  // — voir plus bas.
  const paramsValid = Number.isInteger(activityId) && activityId > 0;
  const isLoadingPrice = paramsValid && activitiesLoading && amountCents === null;
  const priceMissing =
    paramsValid && !activitiesLoading && (activity == null || amountCents === null);

  // Parcours d'inscription payante désactivé (PAYMENTS_ENABLED=false) — le
  // site est en ligne avant que le compte HelloAsso ne soit prêt. On
  // affiche un message clair plutôt que le formulaire, au cas où un
  // visiteur arrive ici par un lien direct, un favori ou un moteur de
  // recherche. Tous les hooks ci-dessus se sont déjà exécutés, donc ce
  // retour anticipé ne viole pas les règles des hooks React.
  if (!PAYMENTS_ENABLED) {
    return (
      <>
        <PageSEO
          title="Inscription Jeunesse — CSC Ostwald"
          description="Les inscriptions en ligne seront bientôt disponibles."
          url="/inscription-jeunesse"
        />
        <div className="inscription-jeunesse">
          <div className="inscription-jeunesse__card">
            <Link to="/jeunesse" className="inscription-jeunesse__back">
              ← Retour aux activités Jeunesse
            </Link>
            <h1 className="inscription-jeunesse__title">
              Inscriptions en ligne bientôt disponibles
            </h1>
            <p>
              L&apos;inscription et le paiement en ligne ne sont pas encore ouverts. Pour vous
              inscrire à une activité Jeunesse, merci de nous contacter directement — nous vous
              accompagnerons dans la démarche.
            </p>
            <Link to="/contact" className="inscription-jeunesse__back">
              Nous contacter
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageSEO
        title="Inscription Jeunesse — CSC Ostwald"
        description="Inscription en ligne et paiement sécurisé via HelloAsso"
        url="/inscription-jeunesse"
      />
      <div className="inscription-jeunesse">
        <div className="inscription-jeunesse__card">
          <Link to="/jeunesse" className="inscription-jeunesse__back">
            ← Retour aux activités Jeunesse
          </Link>

          {!paramsValid && (
            <>
              <h1 className="inscription-jeunesse__title">Lien invalide</h1>
              <p>
                Le lien d&apos;inscription est incomplet ou incorrect. Merci de retourner à la page
                Jeunesse et de cliquer sur le bouton « S&apos;inscrire » d&apos;une activité.
              </p>
            </>
          )}

          {isLoadingPrice && (
            <p className="inscription-jeunesse__loading" role="status">
              Chargement de l&apos;activité…
            </p>
          )}

          {priceMissing && (
            <>
              <h1 className="inscription-jeunesse__title">Inscription indisponible</h1>
              <p>
                Cette activité n&apos;est pas encore ouverte aux inscriptions en ligne — son tarif
                n&apos;a pas été configuré. Merci de nous contacter directement.
              </p>
              <Link to="/contact" className="inscription-jeunesse__back">
                Nous contacter
              </Link>
            </>
          )}

          {paramsValid && !isLoadingPrice && !priceMissing && (
            <>
              <h1 className="inscription-jeunesse__title">Inscription</h1>
              <div className="inscription-jeunesse__summary">
                {activityTitle && (
                  <p className="inscription-jeunesse__activity">
                    <span>Activité</span> {activityTitle}
                  </p>
                )}
                <p className="inscription-jeunesse__price">
                  <span>Montant</span> {amountCents === 0 ? 'Gratuit' : formatAmount(amountCents)}
                </p>
              </div>

              <form
                className="inscription-jeunesse__form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
              >
                <div className="inscription-jeunesse__row">
                  <div className="inscription-jeunesse__field">
                    <label htmlFor="reg-prenom">
                      Prénom <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="reg-prenom"
                      type="text"
                      autoComplete="given-name"
                      aria-required="true"
                      aria-invalid={errors.prenom ? 'true' : 'false'}
                      aria-describedby={errors.prenom ? 'reg-prenom-err' : undefined}
                      maxLength={80}
                      {...register('prenom')}
                    />
                    {errors.prenom && (
                      <span
                        id="reg-prenom-err"
                        className="inscription-jeunesse__error"
                        role="alert"
                      >
                        {errors.prenom.message}
                      </span>
                    )}
                  </div>

                  <div className="inscription-jeunesse__field">
                    <label htmlFor="reg-nom">
                      Nom <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="reg-nom"
                      type="text"
                      autoComplete="family-name"
                      aria-required="true"
                      aria-invalid={errors.nom ? 'true' : 'false'}
                      aria-describedby={errors.nom ? 'reg-nom-err' : undefined}
                      maxLength={80}
                      {...register('nom')}
                    />
                    {errors.nom && (
                      <span id="reg-nom-err" className="inscription-jeunesse__error" role="alert">
                        {errors.nom.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="inscription-jeunesse__field">
                  <label htmlFor="reg-email">
                    Email <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'reg-email-err' : undefined}
                    maxLength={100}
                    {...register('email')}
                  />
                  {errors.email && (
                    <span id="reg-email-err" className="inscription-jeunesse__error" role="alert">
                      {errors.email.message}
                    </span>
                  )}
                </div>

                <label className="inscription-jeunesse__rgpd">
                  <input
                    type="checkbox"
                    aria-required="true"
                    aria-invalid={errors.rgpdConsent ? 'true' : 'false'}
                    {...register('rgpdConsent')}
                  />
                  <span>
                    J&apos;accepte que mes données (prénom, nom, email) soient conservées dans le
                    cadre de l&apos;inscription à cette activité, conformément à la{' '}
                    <Link to="/politique-de-confidentialite">politique de confidentialité</Link>.
                  </span>
                </label>
                {errors.rgpdConsent && (
                  <span className="inscription-jeunesse__error" role="alert">
                    {errors.rgpdConsent.message}
                  </span>
                )}

                {submitError && (
                  <p className="inscription-jeunesse__form-error" role="alert">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  className="inscription-jeunesse__submit"
                  disabled={isSubmitting || checkoutMutation.isPending}
                >
                  {checkoutMutation.isPending
                    ? 'Redirection…'
                    : amountCents === 0
                      ? 'Valider mon inscription'
                      : 'Procéder au paiement'}
                </button>

                <p className="inscription-jeunesse__note">
                  {amountCents === 0
                    ? 'Activité gratuite : votre inscription sera enregistrée et confirmée par email.'
                    : 'Vous serez redirigé vers HelloAsso pour finaliser le paiement. Aucune donnée bancaire ne transite par notre site.'}
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
