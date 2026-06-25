// ============================================================
// Footer.jsx — Pied de page commun à toutes les pages
//
// Trois colonnes :
//   1. Navigation  → reprend les liens de navLinks.js
//   2. Newsletter  → formulaire d'inscription (validation email côté client)
//   3. Contact     → téléphone, email, adresse + liens réseaux sociaux
// La validation email utilise emailRegex depuis validators.js.
// ============================================================
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebookF,
  FaInstagram,
  FaSnapchat,
  FaPaperPlane,
} from 'react-icons/fa';
import { FiChevronDown } from 'react-icons/fi';
import navLinks from '@data/navLinks';
import { NEWSLETTER_ENABLED } from '@/config/features';
import { createNewsletterSchema, useNewsletterSubscribe } from '@features/newsletter';
import AnimatedCheckmark from '@components/ui/AnimatedCheckmark';
import { AnimatePresence, m } from 'framer-motion';
import useMotionPresets from '@hooks/useMotionPresets';
import Magnetic from '@components/ui/Magnetic';
import './Footer.scss';
export default function Footer() {
  const { t } = useTranslation();
  const { reduceMotion } = useMotionPresets();
  // Schéma Zod reconstruit quand `t` change (changement de langue) afin
  // que les messages d'erreur restent traduits dans la locale active.
  const newsletterSchema = useMemo(() => createNewsletterSchema(t), [t]);
  // React Hook Form — uncontrolled inputs (perf : pas de re-render à chaque frappe).
  // zodResolver branche la validation Zod sur le submit.
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '', rgpdConsent: false },
  });
  // Mutation React Query — pilote loading/success/error pour le POST /api/newsletter.
  // En dev, MSW intercepte la requête (cf. mocks/handlers.js).
  const subscribeMutation = useNewsletterSubscribe();
  // Clé du sous-menu actuellement déplié dans la nav du footer (ex: 'nav.aPropos')
  // null = tous les sous-menus sont repliés (état initial)
  const [expandedNav, setExpandedNav] = useState(null);
  // Callback appelé uniquement quand la validation Zod passe.
  // Lance la mutation HTTP ; en cas de succès, on reset le form (la confirmation
  // est gérée via `subscribeMutation.isSuccess` directement dans le JSX).
  const onSubmit = (data) => {
    subscribeMutation.mutate({ email: data.email }, { onSuccess: () => reset() });
  };
  // Premier message d'erreur à afficher.
  // Priorité : (1) erreurs Zod côté client, (2) erreur API renvoyée par le backend.
  const formError =
    errors.email?.message ??
    errors.rgpdConsent?.message ??
    (subscribeMutation.isError ? subscribeMutation.error.message : undefined);
  // Confirmation visuelle — succès de la mutation (et non d'un setState manuel).
  const subscribed = subscribeMutation.isSuccess;
  return (
    // footer#contact : accessible via l'ancre #contact depuis d'autres pages
    <footer className="footer" id="contact" aria-label={t('footer.ariaPiedDePage')}>
      <div className="footer__top">
        <div className="container">
          <div className="footer__grid">
            {/* ── Colonne 1 : Navigation ── */}
            <div className="footer__col">
              <h3 className="footer__heading">{t('footer.headingNav')}</h3>
              <ul className="footer__nav">
                {/* Affiche tous les liens de navLinks.ts
            Si un lien a des `children` (ex: À propos), on affiche
            le parent + une sous-liste indentée avec les enfants. */}
                {navLinks.map((link) => {
                  // Cas 1 : lien avec sous-menu (À propos) → bouton accordéon
                  if (link.children) {
                    const isOpen = expandedNav === link.labelKey;
                    const subnavId = `footer-subnav-${link.labelKey.replace(/\./g, '-')}`;
                    return (
                      <li key={link.labelKey}>
                        <button
                          type="button"
                          className={`footer__nav-toggle${isOpen ? ' footer__nav-toggle--open' : ''}`}
                          aria-expanded={isOpen}
                          aria-controls={subnavId}
                          onClick={() => setExpandedNav(isOpen ? null : link.labelKey)}
                        >
                          <span>{t(link.labelKey)}</span>
                          <FiChevronDown
                            className={`footer__nav-chevron${isOpen ? ' footer__nav-chevron--up' : ''}`}
                            size={14}
                            aria-hidden="true"
                          />
                        </button>
                        {/* Sous-liste animée : height auto + opacity via framer-motion */}
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <m.ul
                              id={subnavId}
                              className="footer__subnav"
                              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                              style={{ overflow: 'hidden' }}
                            >
                              {link.children.map((child) => (
                                <li key={child.to}>
                                  <Link
                                    to={child.to}
                                    className="footer__nav-link footer__nav-link--sub"
                                    onClick={() => setExpandedNav(null)}
                                  >
                                    {t(child.labelKey)}
                                  </Link>
                                </li>
                              ))}
                            </m.ul>
                          )}
                        </AnimatePresence>
                      </li>
                    );
                  }
                  // Cas 2 : lien externe (Faire un don)
                  if (link.external) {
                    return (
                      <li key={link.labelKey}>
                        <a
                          href={link.to}
                          className="footer__nav-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t(link.labelKey)}
                        </a>
                      </li>
                    );
                  }
                  // Cas 3 : lien interne simple
                  return (
                    <li key={link.labelKey}>
                      <Link to={link.to} className="footer__nav-link">
                        {t(link.labelKey)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* ── Colonne 2 : Newsletter + Réseaux sociaux ── */}
            <div className="footer__col">
              {/* Formulaire newsletter — masqué tant que NEWSLETTER_ENABLED
                  vaut false : sans fournisseur SMTP branché, le double
                  opt-in ne peut pas être confirmé. La section réseaux
                  sociaux ci-dessous reste affichée dans tous les cas. */}
              {NEWSLETTER_ENABLED && (
                <>
                  <h3 className="footer__heading">{t('footer.headingNewsletter')}</h3>
                  <p className="footer__newsletter-text">{t('footer.newsletterText')}</p>

                  {/* Si déjà inscrit → message de confirmation, sinon → formulaire */}
                  {subscribed ? (
                    <div className="footer__subscribed-wrap">
                      <p className="footer__subscribed" role="status" aria-live="polite">
                        <AnimatedCheckmark className="footer__subscribed-check" />
                        {t('footer.merciInscription')}
                      </p>
                      <button
                        type="button"
                        className="footer__resubscribe"
                        onClick={() => subscribeMutation.reset()}
                      >
                        {t('footer.newsletterText')}
                      </button>
                    </div>
                  ) : (
                    <form
                      className="footer__form"
                      onSubmit={handleSubmit(onSubmit)}
                      aria-label={t('footer.ariaInscriptionNewsletter')}
                      noValidate
                    >
                      {/* Label visible aux lecteurs d'écran uniquement — placeholder seul = anti-pattern */}
                      <label htmlFor="newsletter-email" className="sr-only">
                        {t('footer.ariaEmail')}
                      </label>
                      {/* Champ email — icône envelope DANS le champ (left padding) */}
                      <div className="footer__field">
                        <FaEnvelope className="footer__field-icon" aria-hidden="true" />
                        <input
                          type="email"
                          {...register('email')}
                          placeholder={t('footer.placeholderEmail')}
                          aria-required="true"
                          id="newsletter-email"
                          aria-invalid={errors.email ? 'true' : 'false'}
                          aria-describedby={formError ? 'newsletter-error' : undefined}
                          autoComplete="email"
                          className="footer__input"
                          maxLength={100}
                        />
                      </div>
                      {/* Case RGPD : consentement obligatoire pour la newsletter */}
                      <label className="footer__rgpd" htmlFor="newsletter-rgpd">
                        <input
                          id="newsletter-rgpd"
                          type="checkbox"
                          {...register('rgpdConsent')}
                          aria-required="true"
                          aria-invalid={errors.rgpdConsent ? 'true' : 'false'}
                        />
                        <span>
                          {t('footer.rgpdText')}{' '}
                          <Link to="/politique-de-confidentialite" className="footer__rgpd-link">
                            {t('footer.rgpdLink')}
                          </Link>
                        </span>
                      </label>
                      {/* Message d'erreur (email invalide ou consentement manquant) */}
                      {formError && (
                        <p id="newsletter-error" className="footer__email-error" role="alert">
                          {formError}
                        </p>
                      )}
                      {/* Bouton CTA en bubble orange — placé en dernier (action finale).
                Wrappé dans <Magnetic> : le bouton suit subtilement le curseur. */}
                      <Magnetic strength={0.25}>
                        <button
                          type="submit"
                          className="btn-bubble btn-bubble--orange btn-bubble--block csc-bubble--shadow footer__submit"
                          id="btn-newsletter-submit"
                          // Bloque le double-submit pendant que la mutation est en vol
                          disabled={subscribeMutation.isPending}
                          aria-busy={subscribeMutation.isPending}
                        >
                          <span>
                            {subscribeMutation.isPending
                              ? t('footer.sinscrireEnCours', { defaultValue: 'Envoi…' })
                              : t('footer.sinscrire')}
                          </span>
                          <FaPaperPlane aria-hidden="true" />
                        </button>
                      </Magnetic>
                    </form>
                  )}
                </>
              )}

              {/* Liens vers les réseaux sociaux du CSC */}
              <div className="footer__social-section">
                <h4 className="footer__social-title" id="footer-social-title">
                  {t('footer.suivezNous')}
                </h4>
                <ul className="footer__socials" aria-labelledby="footer-social-title">
                  <li>
                    <a
                      href="https://www.facebook.com/cscostwald/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer__social footer__social--fb"
                      aria-label="Facebook CSC Ostwald (nouvel onglet)"
                      id="link-facebook"
                    >
                      <FaFacebookF aria-hidden="true" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.instagram.com/csc_ostwald"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer__social footer__social--ig"
                      aria-label="Instagram CSC Ostwald (nouvel onglet)"
                      id="link-instagram"
                    >
                      <FaInstagram aria-hidden="true" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.snapchat.com/add/csc_ostwald"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer__social footer__social--snap"
                      aria-label="Snapchat CSC Ostwald (nouvel onglet)"
                      id="link-snapchat"
                    >
                      <FaSnapchat aria-hidden="true" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* ── Colonne 3 : Coordonnées ── */}
            <div className="footer__col">
              <h3 className="footer__heading">{t('footer.headingContact')}</h3>
              <ul className="footer__contact-list">
                {/* Numéro de téléphone — href="tel:" ouvre le composeur sur mobile */}
                <li>
                  <a href="tel:0978809629" className="footer__contact-item" id="link-phone">
                    <FaPhone />
                    <span>09.78.80.96.29</span>
                  </a>
                </li>
                {/* Email — href="mailto:" ouvre le client mail */}
                <li>
                  <a
                    href="mailto:contact@csc-ostwald.fr"
                    className="footer__contact-item"
                    id="link-email"
                  >
                    <FaEnvelope />
                    <span>contact@csc-ostwald.fr</span>
                  </a>
                </li>
                {/* Adresse postale (non cliquable) */}
                <li>
                  <div className="footer__contact-item footer__contact-item--address">
                    <FaMapMarkerAlt />
                    <span>1, place de la Bruyère, 67540 Ostwald</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de copyright en bas — new Date().getFullYear() affiche l'année courante automatiquement */}
      <div className="footer__bottom">
        <div className="container">
          <p>
            {`© ${new Date().getFullYear()} Centre Social et Culturel d'Ostwald. `}
            {t('footer.droitsReserves')}
          </p>

          <div className="footer__legal-links">
            <Link to="/mentions-legales" id="link-mentions-legales" className="footer__mentions">
              {t('footer.mentionsLegales')}
            </Link>
            <Link
              to="/politique-de-confidentialite"
              id="link-politique"
              className="footer__mentions"
            >
              {t('footer.politiqueConfidentialite')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
