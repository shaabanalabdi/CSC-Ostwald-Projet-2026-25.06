// ============================================================
// Contact.jsx — Page de contact du CSC Ostwald
//
// Deux colonnes :
//   Gauche → formulaire de contact (prénom, nom, email, téléphone, sujet, message)
//   Droite → informations pratiques (adresse, tél, email, horaires, carte Leaflet)
//
// Validation : Zod schema + React Hook Form (zodResolver).
// Après envoi réussi : affiche SuccessModal avec résumé (sujet + email).
// Note : l'envoi est simulé (pas de backend connecté pour l'instant).
// ============================================================
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PageSEO from '@components/layout/PageSEO';
import { FiSend } from 'react-icons/fi';
import { FaMapMarkerAlt, FaPhone, FaClock } from 'react-icons/fa';
import SuccessModal from '@components/ui/SuccessModal';
import LeafletMap from '@components/ui/LeafletMap';
import { createContactSchema, useContactSubmit } from '@features/contact';
import { useContactSettings } from '@features/contact-settings';
import Magnetic from '@components/ui/Magnetic';
import GradientMesh from '@components/ui/GradientMesh';
import GrainTexture from '@components/ui/GrainTexture';
import './Contact.scss';
export default function Contact() {
  const { t } = useTranslation();
  // Schéma Zod reconstruit quand `t` change (locale switch) afin de garder
  // les messages d'erreur dans la langue active.
  const contactSchema = useMemo(() => createContactSchema(t), [t]);
  // useForm<Input, Context, Output> : RHF v7 supporte des types d'entrée et
  // de sortie distincts. Nécessaire ici car le refine Zod sur `sujet` transforme
  // `string` → `ContactSubject` (union littérale). Sans cette signature, TS
  // refuse `defaultValues.sujet: ''` et la résolution complète d'onSubmit.
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      sujet: '',
      message: '',
      rgpdConsent: false,
    },
  });
  // Mutation React Query — pilote loading/success/error pour POST /api/contact.
  const submitMutation = useContactSubmit();
  const { data: contactInfo } = useContactSettings();

  const phone = contactInfo?.phone ?? '09.78.80.96.29';
  const address = contactInfo?.address ?? t('contact.adresse');
  const emailAccueil = contactInfo?.email_accueil ?? 'contact@csc-ostwald.fr';
  const emailFamilles = contactInfo?.email_familles ?? 'familles@csc-ostwald.fr';
  const emailJeunesse = contactInfo?.email_jeunesse ?? 'jeunesse@csc-ostwald.fr';
  const emailProjets = contactInfo?.email_projets ?? 'projets@csc-ostwald.fr';
  const exceptionalDay = contactInfo?.exceptional_day ?? null;
  const exceptionalOccasion = contactInfo?.exceptional_occasion ?? null;
  const daysLv = contactInfo?.days_lv ?? t('contact.lvJours');
  const hoursLv = contactInfo?.hours_lv ?? t('contact.lvHoraire');
  const daysWe = contactInfo?.days_we ?? t('contact.weJours');
  const hoursWe = contactInfo?.hours_we ?? t('contact.weFerme');
  // `submittedData` capture les valeurs au moment du submit RÉUSSI, parce que
  // `reset()` efface le formulaire et qu'on veut quand même afficher le résumé
  // dans la modale de confirmation.
  const [submittedData, setSubmittedData] = useState(null);
  // Callback appelé quand toutes les validations Zod passent.
  // `data` est typé `ContactFormData` (output type) — `sujet` est garanti
  // ContactSubject, plus `''` ici. On envoie au backend sans `rgpdConsent`
  // (consentement = gate UX côté client, pas une donnée à stocker).
  const onSubmit = (data) => {
    const { rgpdConsent: _rgpd, ...payload } = data;
    submitMutation.mutate(payload, {
      onSuccess: () => {
        setSubmittedData(data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };
  // Ferme la modale et réinitialise entièrement le formulaire + l'état mutation
  const closeModal = () => {
    setSubmittedData(null);
    submitMutation.reset();
    reset();
  };
  // La modale s'affiche dès que la mutation a réussi (et le snapshot capturé)
  const success = submitMutation.isSuccess && submittedData !== null;
  return (
    <>
      {/* Balises SEO pour cette page */}
      <PageSEO title={t('contact.pageTitle')} description={t('contact.heroSub')} url="/contact" />

      <div className="contact">
        {/* ── Section Hero ── */}
        <div className="contact__hero">
          {/* Atmosphère calm : bleu pâle + vert doux pour évoquer la tranquillité
            d'une prise de contact, à l'opposé du Hero principal warm/orange. */}
          <GradientMesh variant="calm" />
          <GrainTexture opacity={0.04} />
          <span className="contact__hero-badge">{t('contact.badge')}</span>
          <p className="contact__hero-sub">{t('contact.heroSub')}</p>
        </div>

        {/* ── Grille deux colonnes ── */}
        <div className="contact__body">
          {/* ── COLONNE GAUCHE : Formulaire de contact ── */}
          <div className="contact__card">
            <div className="contact__card-header">
              <h2>{t('contact.formTitre')}</h2>
            </div>
            <div className="contact__card-body">
              {/* noValidate : désactive la validation native HTML5 (Zod s'en charge) */}
              <form className="contact__form" onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* Ligne côte à côte : Prénom + Nom */}
                <div className="contact__fields-row">
                  <div className="contact__field">
                    <label className="contact__label" htmlFor="contact-prenom">
                      {t('contact.prenom')} <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="contact-prenom"
                      className="contact__input"
                      type="text"
                      {...register('prenom')}
                      placeholder={t('contact.prenom')}
                      aria-required="true"
                      aria-invalid={errors.prenom ? 'true' : 'false'}
                      aria-describedby={errors.prenom ? 'contact-prenom-error' : undefined}
                      autoComplete="given-name"
                      maxLength={80}
                    />
                    {errors.prenom && (
                      <span id="contact-prenom-error" className="contact__error" role="alert">
                        {errors.prenom.message}
                      </span>
                    )}
                  </div>
                  <div className="contact__field">
                    <label className="contact__label" htmlFor="contact-nom">
                      {t('contact.nom')} <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="contact-nom"
                      className="contact__input"
                      type="text"
                      {...register('nom')}
                      placeholder={t('contact.nom')}
                      aria-required="true"
                      aria-invalid={errors.nom ? 'true' : 'false'}
                      aria-describedby={errors.nom ? 'contact-nom-error' : undefined}
                      autoComplete="family-name"
                      maxLength={80}
                    />
                    {errors.nom && (
                      <span id="contact-nom-error" className="contact__error" role="alert">
                        {errors.nom.message}
                      </span>
                    )}
                  </div>
                </div>

                {/* Champ email */}
                <div className="contact__field">
                  <label className="contact__label" htmlFor="contact-email">
                    {t('contact.email')} <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="contact-email"
                    className="contact__input"
                    type="email"
                    {...register('email')}
                    placeholder="votre@email.fr"
                    aria-required="true"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'contact-email-error' : undefined}
                    autoComplete="email"
                    maxLength={100}
                  />
                  {errors.email && (
                    <span id="contact-email-error" className="contact__error" role="alert">
                      {errors.email.message}
                    </span>
                  )}
                </div>

                {/* Champ téléphone (optionnel) */}
                <div className="contact__field">
                  <label className="contact__label" htmlFor="contact-telephone">
                    {t('contact.telephone')}
                  </label>
                  <input
                    id="contact-telephone"
                    className="contact__input"
                    type="tel"
                    {...register('telephone')}
                    placeholder="06 XX XX XX XX"
                    aria-invalid={errors.telephone ? 'true' : 'false'}
                    aria-describedby={errors.telephone ? 'contact-telephone-error' : undefined}
                    autoComplete="tel"
                    maxLength={20}
                  />
                  {errors.telephone && (
                    <span id="contact-telephone-error" className="contact__error" role="alert">
                      {errors.telephone.message}
                    </span>
                  )}
                </div>

                {/* Liste déroulante de sujets */}
                <div className="contact__field">
                  <label className="contact__label" htmlFor="contact-sujet">
                    {t('contact.sujet')} <span aria-hidden="true">*</span>
                  </label>
                  <select
                    id="contact-sujet"
                    className="contact__select"
                    {...register('sujet')}
                    aria-required="true"
                    aria-invalid={errors.sujet ? 'true' : 'false'}
                    aria-describedby={errors.sujet ? 'contact-sujet-error' : undefined}
                  >
                    <option value="">{t('contact.sujetChoisir')}</option>
                    <option value="renseignement">{t('contact.sujetRenseignement')}</option>
                    <option value="inscription">{t('contact.sujetInscription')}</option>
                    <option value="benevole">{t('contact.sujetBenevole')}</option>
                    <option value="partenariat">{t('contact.sujetPartenariat')}</option>
                    <option value="autre">{t('contact.sujetAutre')}</option>
                  </select>
                  {errors.sujet && (
                    <span id="contact-sujet-error" className="contact__error" role="alert">
                      {errors.sujet.message}
                    </span>
                  )}
                </div>

                {/* Zone de texte libre pour le message */}
                <div className="contact__field">
                  <label className="contact__label" htmlFor="contact-message">
                    {t('contact.message')} <span aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    className="contact__textarea"
                    {...register('message')}
                    placeholder={t('contact.messagePlaceholder')}
                    rows={5}
                    aria-required="true"
                    aria-invalid={errors.message ? 'true' : 'false'}
                    aria-describedby={errors.message ? 'contact-message-error' : undefined}
                    maxLength={1000}
                  />
                  {errors.message && (
                    <span id="contact-message-error" className="contact__error" role="alert">
                      {errors.message.message}
                    </span>
                  )}
                </div>

                {/* Case RGPD : consentement obligatoire pour traiter le message */}
                <div className="contact__field">
                  <label className="contact__rgpd" htmlFor="contact-rgpd">
                    <input
                      id="contact-rgpd"
                      type="checkbox"
                      {...register('rgpdConsent')}
                      aria-required="true"
                      aria-invalid={errors.rgpdConsent ? 'true' : 'false'}
                      aria-describedby={errors.rgpdConsent ? 'contact-rgpd-error' : undefined}
                    />
                    <span>
                      {t('form.commun.rgpdText')}{' '}
                      <Link to="/politique-de-confidentialite" className="contact__rgpd-link">
                        {t('form.commun.rgpdLink')}
                      </Link>
                    </span>
                  </label>
                  {errors.rgpdConsent && (
                    <span id="contact-rgpd-error" className="contact__error" role="alert">
                      {errors.rgpdConsent.message}
                    </span>
                  )}
                </div>

                {/* Erreur API (réseau ou 5xx) — affichée au-dessus du bouton.
            Les erreurs Zod sont déjà affichées au niveau du champ ; ce bloc
            couvre le cas où le backend renvoie une erreur après validation. */}
                {submitMutation.isError && (
                  <p className="contact__error" role="alert">
                    {submitMutation.error.message}
                  </p>
                )}

                {/* Bouton d'envoi en bubble bleue — Magnetic pour effet d'attraction */}
                <Magnetic strength={0.25}>
                  <button
                    type="submit"
                    className="btn-bubble btn-bubble--blue csc-bubble--shadow contact__submit"
                    disabled={submitMutation.isPending}
                    aria-busy={submitMutation.isPending}
                  >
                    <FiSend size={16} />{' '}
                    {submitMutation.isPending
                      ? t('contact.envoyerEnCours', { defaultValue: 'Envoi…' })
                      : t('contact.envoyer')}
                  </button>
                </Magnetic>
              </form>
            </div>
          </div>

          {/* ── COLONNE DROITE : Informations pratiques ── */}
          <div className="contact__card">
            <div className="contact__card-header">
              <h2>{t('contact.infoTitre')}</h2>
            </div>
            <div className="contact__card-body">
              <div className="contact__info-block">
                {/* Adresse postale */}
                <div className="contact__info-item">
                  <span className="contact__info-category">{t('contact.adresseLabel')}</span>
                  <div className="contact__info-row">
                    <FaMapMarkerAlt />
                    <span>{address}</span>
                  </div>
                </div>

                {/* Téléphone + 5 emails par service (le client en a fourni 5 distincts) */}
                <div className="contact__info-item">
                  <span className="contact__info-category">{t('contact.contactLabel')}</span>
                  <div className="contact__info-row">
                    <FaPhone />
                    <a href={`tel:${phone.replace(/[\s.-]/g, '')}`} className="contact__info-link">
                      {phone}
                    </a>
                  </div>

                  <ul className="contact__emails-list">
                    <li>
                      <span className="contact__email-label">{t('contact.emailAccueil')}</span>
                      <a href={`mailto:${emailAccueil}`} className="contact__info-link">
                        {emailAccueil}
                      </a>
                    </li>
                    <li>
                      <span className="contact__email-label">{t('contact.emailFamilles')}</span>
                      <a href={`mailto:${emailFamilles}`} className="contact__info-link">
                        {emailFamilles}
                      </a>
                    </li>
                    <li>
                      <span className="contact__email-label">{t('contact.emailJeunesse')}</span>
                      <a href={`mailto:${emailJeunesse}`} className="contact__info-link">
                        {emailJeunesse}
                      </a>
                    </li>
                    <li>
                      <span className="contact__email-label">{t('contact.emailProjets')}</span>
                      <a href={`mailto:${emailProjets}`} className="contact__info-link">
                        {emailProjets}
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Horaires d'ouverture sous forme de tableau */}
                <div className="contact__info-item">
                  <span className="contact__info-category" id="hours-label">
                    {t('contact.horairesLabel')}
                  </span>
                  <div className="contact__info-row">
                    <FaClock aria-hidden="true" />
                    <table className="contact__hours" aria-labelledby="hours-label">
                      <caption className="sr-only">{t('contact.horairesLabel')}</caption>
                      <tbody>
                        {/* Lun – Ven : 09h30 – 17h00 */}
                        <tr>
                          <th scope="row">{daysLv}</th>
                          <td>{hoursLv}</td>
                        </tr>
                        <tr>
                          <th scope="row">{daysWe}</th>
                          <td className="contact__hours-closed">{hoursWe}</td>
                        </tr>
                        {exceptionalDay && exceptionalOccasion && (
                          <tr className="contact__hours-exceptional">
                            <th scope="row">{exceptionalDay}</th>
                            <td>{exceptionalOccasion}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Carte Leaflet + OpenStreetMap — RGPD-compliant (pas de cookies, pas de tracking) */}
                <div className="contact__map">
                  <LeafletMap
                    lat={48.55278}
                    lng={7.71378}
                    zoom={17}
                    popup={
                      <>
                        <strong>CSC Ostwald</strong>
                        <br />
                        1, place de la Bruyère
                        <br />
                        67540 Ostwald
                      </>
                    }
                    ariaLabel={t('contact.mapAriaLabel')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modale de confirmation — affichée après envoi réussi */}
      {/* Affiche un résumé du sujet et de l'email saisi */}
      <SuccessModal
        show={success}
        onClose={closeModal}
        titleId="modal-title-contact"
        title={t('contact.confirme')}
        returnTo="/"
        returnLabel={t('form.commun.retourAccueil')}
        variant="green"
      >
        <p>
          {/* t('contact.merci', { prenom }) → interpole le prénom dans le message.
            `submittedData` est garanti non-null tant que la modale est ouverte
            (cf. setSuccess(true) toujours précédé de setSubmittedData(data)). */}
          {t('contact.merci', { prenom: submittedData?.prenom })}
        </p>
        <div className="success-modal__details">
          <div className="success-modal__row">
            <span className="success-modal__row-label">{t('contact.sujet')}</span>
            <span className="success-modal__row-value">{submittedData?.sujet}</span>
          </div>
          <div className="success-modal__row">
            <span className="success-modal__row-label">{t('contact.email')}</span>
            <span className="success-modal__row-value">{submittedData?.email}</span>
          </div>
        </div>
      </SuccessModal>
    </>
  );
}
