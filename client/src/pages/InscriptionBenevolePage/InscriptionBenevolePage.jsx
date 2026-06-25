// ============================================================
// InscriptionBenevolePage.jsx — Formulaire d'inscription bénévole
//
// Accédé via /inscription-benevole (pas de paramètre dans l'URL)
// Structure en 3 colonnes (cards) :
//   1. Informations personnelles → nom, prénom, email, téléphone
//   2. Compétences & Intérêts   → domaines et compétences (cases à cocher)
//   3. Disponibilité            → jours de la semaine, plages horaires, message libre
//
// Les listes de choix (DOMAINES, COMPETENCES, JOURS, PLAGES) sont traduites
// via i18n avec returnObjects: true pour récupérer un tableau JSON.
// Validation : Zod schema + React Hook Form (zodResolver).
// Après envoi : affiche SuccessModal avec le récapitulatif des choix.
// ============================================================
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageSEO from '@components/layout/PageSEO';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FaArrowLeft, FaPaperPlane } from 'react-icons/fa';
import SuccessModal from '@components/ui/SuccessModal';
import { createBenevoleSchema, useBenevoleApply } from '@features/benevole';
import './InscriptionBenevolePage.scss';
export default function InscriptionBenevolePage() {
  const { t } = useTranslation();
  // returnObjects: true permet de récupérer un tableau depuis le JSON de traduction.
  // Exemple dans fr/translation.json : "DOMAINES": ["Animation", "Cuisine", ...]
  // Le typage retourné par i18next est `unknown` quand returnObjects est utilisé,
  // donc on cast vers `string[]` (les 4 clés sont garanties être des tableaux par contrat).
  const DOMAINES = t('form.benevole.DOMAINES', { returnObjects: true });
  const COMPETENCES = t('form.benevole.COMPETENCES', { returnObjects: true });
  const JOURS = t('form.benevole.JOURS', { returnObjects: true });
  const PLAGES = t('form.benevole.PLAGES', { returnObjects: true });
  // Schéma Zod reconstruit quand `t` change (locale switch).
  const benevoleSchema = useMemo(() => createBenevoleSchema(t), [t]);
  // useForm<Input, Context, Output> : ContextOutput diffère de Input à cause
  // des `.default([])` sur les arrays (entrée optionnelle, sortie garantie).
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(benevoleSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      domaines: [],
      competences: [],
      jours: [],
      plages: [],
      message: '',
      rgpdConsent: false,
    },
  });
  // Mutation React Query — POST /api/benevole (MSW en dev).
  const applyMutation = useBenevoleApply();
  // Capture des valeurs au submit RÉUSSI pour affichage post-reset dans la modale.
  const [submittedData, setSubmittedData] = useState(null);
  // Callback appelé quand la validation Zod passe.
  // On envoie au backend sans `rgpdConsent` (gate UX côté client).
  const onSubmit = (data) => {
    const { rgpdConsent: _rgpd, ...payload } = data;
    applyMutation.mutate(payload, {
      onSuccess: () => {
        setSubmittedData(data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };
  // Réinitialise tout le formulaire après fermeture de la modale
  const closeModal = () => {
    setSubmittedData(null);
    applyMutation.reset();
    reset();
  };
  // La modale s'affiche dès que la mutation a réussi (et le snapshot capturé)
  const success = applyMutation.isSuccess && submittedData !== null;
  return (
    <>
      <PageSEO
        title={t('form.benevole.pageTitle')}
        description={t('form.benevole.heroSub')}
        url="/inscription-benevole"
      />
      <div className="benevole-form">
        {/* Section hero avec titre et lien retour */}
        <div className="benevole-form__hero">
          <Link to="/#benevole" className="benevole-form__back">
            <FaArrowLeft size={12} /> {t('form.commun.retour')}
          </Link>
          <h1 className="benevole-form__hero-title">
            {t('form.benevole.heroTitre')} <span>{t('form.benevole.heroTitreAccent')}</span>
          </h1>
          <p className="benevole-form__hero-sub">{t('form.benevole.heroSub')}</p>
        </div>

        <div className="benevole-form__container">
          {/* Grille 3 colonnes — chaque card est une section du formulaire */}
          <form className="benevole-form__grid" onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* ── COLONNE 1 : Informations personnelles ── */}
            <div className="benevole-form__card">
              <h2>{t('form.benevole.infoPerso')}</h2>

              <div className="benevole-form__field">
                <label htmlFor="bv-nom">
                  {t('form.benevole.nom')} <span aria-hidden="true">*</span>
                </label>
                <input
                  id="bv-nom"
                  type="text"
                  {...register('nom')}
                  placeholder={t('form.benevole.nom')}
                  aria-required="true"
                  aria-invalid={errors.nom ? 'true' : 'false'}
                  aria-describedby={errors.nom ? 'bv-nom-error' : undefined}
                  autoComplete="family-name"
                  maxLength={80}
                />
                {errors.nom && (
                  <span id="bv-nom-error" className="benevole-form__error" role="alert">
                    {errors.nom.message}
                  </span>
                )}
              </div>

              <div className="benevole-form__field">
                <label htmlFor="bv-prenom">
                  {t('form.benevole.prenom')} <span aria-hidden="true">*</span>
                </label>
                <input
                  id="bv-prenom"
                  type="text"
                  {...register('prenom')}
                  placeholder={t('form.benevole.prenom')}
                  aria-required="true"
                  aria-invalid={errors.prenom ? 'true' : 'false'}
                  aria-describedby={errors.prenom ? 'bv-prenom-error' : undefined}
                  autoComplete="given-name"
                  maxLength={80}
                />
                {errors.prenom && (
                  <span id="bv-prenom-error" className="benevole-form__error" role="alert">
                    {errors.prenom.message}
                  </span>
                )}
              </div>

              <div className="benevole-form__field">
                <label htmlFor="bv-email">
                  {t('form.benevole.email')} <span aria-hidden="true">*</span>
                </label>
                <input
                  id="bv-email"
                  type="email"
                  {...register('email')}
                  placeholder="votre@email.fr"
                  aria-required="true"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'bv-email-error' : undefined}
                  autoComplete="email"
                  maxLength={100}
                />
                {errors.email && (
                  <span id="bv-email-error" className="benevole-form__error" role="alert">
                    {errors.email.message}
                  </span>
                )}
              </div>

              <div className="benevole-form__field">
                <label htmlFor="bv-tel">
                  {t('form.benevole.telephone')} <span aria-hidden="true">*</span>
                </label>
                {/* Champ téléphone avec indicatif pays visible */}
                <div className="benevole-form__phone">
                  <span className="benevole-form__phone-prefix" aria-hidden="true">
                    <span className="benevole-form__flag">🇫🇷</span> +33
                  </span>
                  <input
                    id="bv-tel"
                    type="tel"
                    {...register('telephone')}
                    placeholder="06 XX XX XX XX"
                    aria-required="true"
                    aria-invalid={errors.telephone ? 'true' : 'false'}
                    aria-describedby={errors.telephone ? 'bv-tel-error' : undefined}
                    autoComplete="tel"
                    maxLength={20}
                  />
                </div>
                {errors.telephone && (
                  <span id="bv-tel-error" className="benevole-form__error" role="alert">
                    {errors.telephone.message}
                  </span>
                )}
              </div>
            </div>

            {/* ── COLONNE 2 : Compétences & Intérêts ── */}
            <div className="benevole-form__card">
              <h2>{t('form.benevole.competencesTitre')}</h2>

              {/* Domaines d'action souhaités — checkboxes multi-select.
            Pattern RHF : plusieurs <input type="checkbox"> partageant le
            même `name` + un `value` distinct → RHF les agrège en array. */}
              <fieldset className="benevole-form__fieldset">
                <legend className="benevole-form__sublabel">
                  {t('form.benevole.domainesLabel')}
                </legend>
                <div className="benevole-form__checkgroup">
                  {DOMAINES.map((d) => (
                    <label key={d} className="benevole-form__check">
                      <input type="checkbox" value={d} {...register('domaines')} />
                      <span className="benevole-form__checkmark" aria-hidden="true" />
                      <span className="benevole-form__check-text">{d}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Compétences à apporter */}
              <fieldset className="benevole-form__fieldset">
                <legend className="benevole-form__sublabel">
                  {t('form.benevole.competencesLabel')}
                </legend>
                <div className="benevole-form__checkgroup">
                  {COMPETENCES.map((c) => (
                    <label key={c} className="benevole-form__check">
                      <input type="checkbox" value={c} {...register('competences')} />
                      <span className="benevole-form__checkmark" aria-hidden="true" />
                      <span className="benevole-form__check-text">{c}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* ── COLONNE 3 : Disponibilité + Message ── */}
            <div className="benevole-form__card">
              <h2>{t('form.benevole.disponibilite')}</h2>

              {/* Jours de disponibilité */}
              <fieldset className="benevole-form__fieldset">
                <legend className="benevole-form__sublabel">{t('form.benevole.joursLabel')}</legend>
                <div className="benevole-form__days">
                  {JOURS.map((j) => (
                    <label key={j} className="benevole-form__check">
                      <input type="checkbox" value={j} {...register('jours')} />
                      <span className="benevole-form__checkmark" aria-hidden="true" />
                      <span className="benevole-form__check-text">{j}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Plages horaires préférées */}
              <fieldset className="benevole-form__fieldset">
                <legend className="benevole-form__sublabel">
                  {t('form.benevole.plagesLabel')}
                </legend>
                <div className="benevole-form__checkgroup">
                  {PLAGES.map((p) => (
                    <label key={p} className="benevole-form__check">
                      <input type="checkbox" value={p} {...register('plages')} />
                      <span className="benevole-form__checkmark" aria-hidden="true" />
                      <span className="benevole-form__check-text">{p}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Message libre optionnel */}
              <div className="benevole-form__field">
                <label htmlFor="bv-message" className="benevole-form__sublabel">
                  {t('form.benevole.messageLabel')}
                </label>
                <textarea
                  id="bv-message"
                  {...register('message')}
                  placeholder={t('form.benevole.messagePlaceholder')}
                  rows={4}
                />
              </div>

              {/* Case RGPD : consentement obligatoire avant envoi */}
              <label className="benevole-form__rgpd" htmlFor="bv-rgpd">
                <input
                  id="bv-rgpd"
                  type="checkbox"
                  {...register('rgpdConsent')}
                  aria-required="true"
                  aria-invalid={errors.rgpdConsent ? 'true' : 'false'}
                  aria-describedby={errors.rgpdConsent ? 'bv-rgpd-error' : undefined}
                />
                <span>
                  {t('form.commun.rgpdText')}{' '}
                  <Link to="/politique-de-confidentialite" className="benevole-form__rgpd-link">
                    {t('form.commun.rgpdLink')}
                  </Link>
                </span>
              </label>
              {errors.rgpdConsent && (
                <span id="bv-rgpd-error" className="benevole-form__error" role="alert">
                  {errors.rgpdConsent.message}
                </span>
              )}

              {/* Erreur API (réseau ou 5xx) — affichée au-dessus du bouton.
            Distincte des erreurs Zod, qui s'affichent par champ. */}
              {applyMutation.isError && (
                <p className="benevole-form__error" role="alert">
                  {applyMutation.error.message}
                </p>
              )}

              {/* Bouton de soumission en bubble (Instagram CSC) */}
              <button
                type="submit"
                className="btn-bubble btn-bubble--orange csc-bubble--shadow benevole-form__submit"
                disabled={applyMutation.isPending}
                aria-busy={applyMutation.isPending}
              >
                <FaPaperPlane size={14} />{' '}
                {applyMutation.isPending
                  ? t('form.benevole.soumettreEnCours', { defaultValue: 'Envoi…' })
                  : t('form.benevole.soumettre')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modale de confirmation avec récapitulatif complet */}
      <SuccessModal
        show={success}
        onClose={closeModal}
        titleId="modal-title-benevole"
        title={t('form.benevole.confirme')}
        returnTo="/#benevole"
        returnLabel={t('form.commun.retourAccueil')}
        variant="orange"
      >
        {/* `submittedData` est garanti non-null tant que la modale est ouverte
            (setSuccess(true) toujours précédé de setSubmittedData(data)). */}
        {submittedData && (
          <>
            <p>
              Merci{' '}
              <strong>
                {submittedData.prenom} {submittedData.nom}
              </strong>
              ,<br />
              {t('form.benevole.merci')}
            </p>
            <div className="success-modal__details">
              <div className="success-modal__row">
                <span className="success-modal__row-label">{t('form.commun.contact')}</span>
                <span className="success-modal__row-value">{submittedData.email}</span>
              </div>
              {/* Affiche chaque section uniquement si au moins un choix a été fait */}
              {submittedData.domaines.length > 0 && (
                <div className="success-modal__row">
                  <span className="success-modal__row-label">
                    {t('form.benevole.domainesResume')}
                  </span>
                  <span className="success-modal__row-value">
                    {submittedData.domaines.join(', ')}
                  </span>
                </div>
              )}
              {submittedData.competences.length > 0 && (
                <div className="success-modal__row">
                  <span className="success-modal__row-label">
                    {t('form.benevole.competencesResume')}
                  </span>
                  <span className="success-modal__row-value">
                    {submittedData.competences.join(', ')}
                  </span>
                </div>
              )}
              {submittedData.jours.length > 0 && (
                <div className="success-modal__row">
                  <span className="success-modal__row-label">
                    {t('form.benevole.disponibilitesResume')}
                  </span>
                  <span className="success-modal__row-value">{submittedData.jours.join(', ')}</span>
                </div>
              )}
              {submittedData.plages.length > 0 && (
                <div className="success-modal__row">
                  <span className="success-modal__row-label">
                    {t('form.benevole.plagesResume')}
                  </span>
                  <span className="success-modal__row-value">
                    {submittedData.plages.join(', ')}
                  </span>
                </div>
              )}
              {/* Message libre affiché uniquement s'il n'est pas vide */}
              {submittedData.message.trim() && (
                <div className="success-modal__row">
                  <span className="success-modal__row-label">
                    {t('form.benevole.messageResume')}
                  </span>
                  <span className="success-modal__row-value">{submittedData.message}</span>
                </div>
              )}
            </div>
          </>
        )}
      </SuccessModal>
    </>
  );
}
