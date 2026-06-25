// ============================================================
// Navbar.jsx — Barre de navigation fixe du site
//
// Fonctionnalités :
//   - Fond blanc + ombre légère au scroll (classe navbar--scrolled)
//   - Menu déroulant desktop pour "À Propos" (dropdown)
//   - Menu burger responsive pour mobile
//   - Sélecteur de langue (5 langues) avec mémorisation localStorage
//   - Barre de recherche intégrée (composant SearchBar)
//   - Bouton "Faire un don" (lien externe HelloAsso, external: true dans navLinks)
//   - Fermeture automatique des menus au changement de route ou clic dehors
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import { FaGlobe, FaHandHoldingHeart, FaTachometerAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import logoCSC from '@assets/images/logo_CSC_Ostwald.png';
import logoCSF from '@assets/images/logo-csf67-b.jpg';
import navLinks from '@data/navLinks';
import { useMe } from '@features/auth';
import { AnimatePresence, m } from 'framer-motion';
import useMotionPresets from '@hooks/useMotionPresets';
import SearchBar from '@components/ui/SearchBar';
import Magnetic from '@components/ui/Magnetic';
import './Navbar.scss';
// Langues disponibles avec leur drapeau emoji
const LANGUAGES = [
  { code: 'fr', flag: '🇫🇷' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'ar', flag: '🇩🇿' },
  { code: 'tr', flag: '🇹🇷' },
  { code: 'ru', flag: '🇷🇺' },
];
export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { reduceMotion } = useMotionPresets();
  const { data: authUser } = useMe();
  const isAdminLoggedIn = Boolean(authUser);
  // true = menu mobile ouvert
  const [menuOpen, setMenuOpen] = useState(false);
  // true = l'utilisateur a scrollé → applique l'ombre sur la navbar
  const [scrolled, setScrolled] = useState(false);
  // Clé du dropdown desktop actuellement ouvert (null = tous fermés)
  const [openDropdown, setOpenDropdown] = useState(null);
  // Clé du sous-menu mobile actuellement déplié
  const [mobileExpanded, setMobileExpanded] = useState(null);
  // true = sélecteur de langue ouvert
  const [langOpen, setLangOpen] = useState(false);
  // Référence sur le container de la navbar (pour détecter le clic en dehors)
  const dropdownRef = useRef(null);
  // Ajoute/retire la classe --scrolled quand l'utilisateur fait défiler la page
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    // Nettoyage : supprime l'écouteur quand le composant est démonté
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  // Ferme les menus si l'utilisateur clique en dehors de la navbar
  // useCallback mémorise la fonction pour qu'elle ne soit pas recréée inutilement.
  // Type guard sur e.target — MouseEvent.target est EventTarget | null,
  // mais Node.contains() exige Node. instanceof Node sécurise les 2 cas.
  const handleClickOutside = useCallback((e) => {
    if (
      dropdownRef.current &&
      e.target instanceof Node &&
      !dropdownRef.current.contains(e.target)
    ) {
      setOpenDropdown(null);
      setLangOpen(false);
    }
  }, []);
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);
  // useLocation() retourne l'objet de localisation courant (pathname, search, hash)
  const { pathname } = useLocation();
  // true si la route courante est une sous-page du dropdown donné
  // (ex: pathname="/a-propos/qui-sommes-nous" → "À Propos" doit s'afficher actif)
  const isDropdownActive = (link) =>
    link.children?.some((child) => pathname.startsWith(child.to)) ?? false;
  // Ferme tous les menus à chaque changement de page (navigation).
  // Pattern légitime : réagir au changement de route → effet de bord UI.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setOpenDropdown(null);
    setMenuOpen(false);
    setMobileExpanded(null);
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */
  // Empêche le scroll du body quand le menu mobile est ouvert
  // (évite que le contenu derrière défile pendant la navigation au tactile)
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);
  // Langue actuellement active, avec fallback sur le français si non trouvée
  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];
  // Variants framer-motion partagés pour le stagger du menu mobile.
  // Typés Variants pour que TS comprenne les valeurs (hidden/visible) et
  // que la transition `staggerChildren` ne soit pas rejetée.
  const mobileListVariants = reduceMotion
    ? {}
    : {
        hidden: {},
        visible: { transition: { staggerChildren: 0.04 } },
      };
  const mobileItemVariants = reduceMotion
    ? {}
    : {
        hidden: { opacity: 0, x: -12 },
        visible: { opacity: 1, x: 0 },
      };
  return (
    // En-tête principal — la classe --scrolled ajoute une ombre au scroll
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} id="navbar">
      <div className="navbar__container" ref={dropdownRef}>
        {/* Logos CSC et CSF — 2 liens distincts désormais :
            - CSC → page d'accueil (interne, <Link>)
            - CSF → site officiel de la Confédération Syndicale des Familles (externe, <a>)
            width/height = dimensions réellement rendues, pour réserver la bonne
            place et éviter tout CLS implicite. */}
        <div className="navbar__brand">
          <Link
            to="/"
            className="navbar__brand-link"
            aria-label="Centre Social et Culturel d'Ostwald — Accueil"
          >
            <img
              src={logoCSC}
              alt="Logo CSC Ostwald"
              className="navbar__logo-img navbar__logo-img--csc"
              width="52"
              height="60"
            />
          </Link>
          <a
            href="https://www.la-csf.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="navbar__brand-link"
            aria-label="Confédération Syndicale des Familles — site officiel (nouvel onglet)"
          >
            <img
              src={logoCSF}
              alt="Logo UD CSF 67"
              className="navbar__logo-img navbar__logo-img--csf"
              width="83"
              height="60"
            />
          </a>
        </div>

        {/* Navigation desktop — rendue à partir de navLinks.ts */}
        <nav className="navbar__nav" aria-label="Navigation principale">
          <ul className="navbar__list">
            {navLinks.map((link) =>
              // CAS 1 : lien avec sous-menu (children) → dropdown (disclosure pattern)
              link.children ? (
                (() => {
                  const dropdownId = `navbar-dropdown-${link.labelKey.replace(/\./g, '-')}`;
                  const isOpen = openDropdown === link.labelKey;
                  return (
                    <li key={link.labelKey} className="navbar__item navbar__item--dropdown">
                      <button
                        type="button"
                        className={`navbar__link navbar__dropdown-trigger${isOpen ? ' navbar__dropdown-trigger--open' : ''}${isDropdownActive(link) ? ' navbar__dropdown-trigger--active' : ''}`}
                        aria-expanded={isOpen}
                        aria-controls={dropdownId}
                        // Bascule le dropdown ouvert/fermé au clic
                        onClick={() => setOpenDropdown(isOpen ? null : link.labelKey)}
                        // Ferme le dropdown avec la touche Échap (accessibilité)
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setOpenDropdown(null);
                        }}
                      >
                        {t(link.labelKey)}
                        {/* Chevron qui s'inverse quand le menu est ouvert */}
                        <FiChevronDown
                          className={`navbar__chevron${isOpen ? ' navbar__chevron--up' : ''}`}
                          size={14}
                          aria-hidden="true"
                        />
                      </button>
                      {/* Sous-menu affiché uniquement quand ce dropdown est actif.
                    Pattern disclosure (boutons + liens) — pas role="menu"
                    car ce dernier requiert navigation au clavier flèches. */}
                      {isOpen && (
                        <ul id={dropdownId} className="navbar__dropdown">
                          {link.children.map((child) => (
                            <li key={child.to}>
                              {/* NavLink applique la classe --active si la route correspond */}
                              <NavLink
                                to={child.to}
                                className={({ isActive }) =>
                                  `navbar__dropdown-link${isActive ? ' navbar__dropdown-link--active' : ''}`
                                }
                                onClick={() => setOpenDropdown(null)}
                              >
                                {t(child.labelKey)}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })() // CAS 2 : lien externe (ex: HelloAsso pour les dons)
              ) : link.external ? (
                <li key={link.labelKey}>
                  {/* Lien externe wrappé Magnetic : attraction subtile vers le curseur
                    (cohérent avec les autres CTAs du site : hero, footer, contact). */}
                  <Magnetic strength={0.2}>
                    <a
                      href={link.to}
                      className="navbar__link navbar__link--don"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t(link.labelKey)} (nouvel onglet)`}
                    >
                      <FaHandHoldingHeart size={14} aria-hidden="true" />
                      {t(link.labelKey)}
                    </a>
                  </Magnetic>
                </li>
              ) : (
                // CAS 3 : lien interne simple
                <li key={link.labelKey}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `navbar__link${isActive ? ' navbar__link--active' : ''}`
                    }
                  >
                    {t(link.labelKey)}
                  </NavLink>
                </li>
              )
            )}
            {isAdminLoggedIn && (
              <li className="navbar__item">
                <Link to="/admin/dashboard" className="navbar__link navbar__link--admin">
                  <FaTachometerAlt size={14} aria-hidden="true" />
                  {t('nav.dashboard')}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Zone d'actions à droite : recherche, langue, burger mobile */}
        <div className="navbar__actions">
          {/* Barre de recherche (composant SearchBar) */}
          <SearchBar />

          {/* Sélecteur de langue */}
          <div className="navbar__lang">
            <button
              type="button"
              className="navbar__lang-btn"
              onClick={() => setLangOpen(!langOpen)}
              // Lighthouse `label-content-name-mismatch` (WCAG 2.5.3,
              // « Label in Name ») exige que le texte visible du bouton
              // (le code langue FR/EN/AR/TR/RU) apparaisse dans
              // l'accessible name. Sinon un utilisateur vocal ne peut
              // pas dire « clique FR ». Injection du code en fin de
              // label.
              aria-label={`${t('nav.changerLangue')} (${currentLang.code.toUpperCase()})`}
              aria-expanded={langOpen}
              aria-controls="navbar-lang-list"
            >
              <FaGlobe size={14} aria-hidden="true" />
              {/* Affiche le code langue en majuscules : FR, EN, AR... */}
              <span className="navbar__lang-code">{currentLang.code.toUpperCase()}</span>
              <FiChevronDown
                className={`navbar__chevron${langOpen ? ' navbar__chevron--up' : ''}`}
                size={12}
                aria-hidden="true"
              />
            </button>
            {/* Liste des langues — visible uniquement quand langOpen est true */}
            {langOpen && (
              <ul
                id="navbar-lang-list"
                className="navbar__lang-dropdown"
                aria-label={t('nav.changerLangue')}
              >
                {LANGUAGES.map((lang) => {
                  const isActive = i18n.language === lang.code;
                  return (
                    <li key={lang.code}>
                      <button
                        type="button"
                        // Classe --active sur la langue actuellement sélectionnée
                        className={`navbar__lang-option${isActive ? ' navbar__lang-option--active' : ''}`}
                        aria-current={isActive ? 'true' : undefined}
                        onClick={() => {
                          // Change la langue dans i18n (sauvegardé automatiquement dans localStorage)
                          i18n.changeLanguage(lang.code);
                          setLangOpen(false);
                        }}
                      >
                        <span aria-hidden="true">{lang.flag}</span>
                        <span>{t(`lang.${lang.code}`)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Bouton burger — visible uniquement sur mobile (masqué en CSS desktop) */}
          <button
            type="button"
            className="navbar__burger"
            aria-label={menuOpen ? t('nav.fermerMenu') : t('nav.ouvrirMenu')}
            aria-expanded={menuOpen}
            aria-controls="navbar-mobile-menu"
            id="btn-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {/* Affiche une croix si le menu est ouvert, sinon le burger */}
            {menuOpen ? (
              <FiX size={22} aria-hidden="true" />
            ) : (
              <FiMenu size={22} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Menu mobile animé via framer-motion (slide down + fade + stagger items) */}
      <AnimatePresence>
        {menuOpen && (
          <m.div
            id="navbar-mobile-menu"
            className="navbar__mobile navbar__mobile--open"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <m.ul initial="hidden" animate="visible" variants={mobileListVariants}>
              {navLinks.map((link) =>
                link.children ? (
                  <m.li key={link.labelKey} variants={mobileItemVariants}>
                    <button
                      type="button"
                      className="navbar__mobile-link navbar__mobile-dropdown-trigger"
                      aria-expanded={mobileExpanded === link.labelKey}
                      aria-controls={`navbar-mobile-submenu-${link.labelKey.replace(/\./g, '-')}`}
                      onClick={() =>
                        setMobileExpanded(mobileExpanded === link.labelKey ? null : link.labelKey)
                      }
                    >
                      {t(link.labelKey)}
                      <FiChevronDown
                        className={`navbar__chevron${mobileExpanded === link.labelKey ? ' navbar__chevron--up' : ''}`}
                        size={14}
                        aria-hidden="true"
                      />
                    </button>
                    {/* Sous-menu accordéon animé (height auto) */}
                    <AnimatePresence initial={false}>
                      {mobileExpanded === link.labelKey && (
                        <m.ul
                          id={`navbar-mobile-submenu-${link.labelKey.replace(/\./g, '-')}`}
                          className="navbar__mobile-submenu"
                          initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          {link.children.map((child) => (
                            <li key={child.to}>
                              <NavLink
                                to={child.to}
                                className="navbar__mobile-sublink"
                                onClick={() => {
                                  setMenuOpen(false);
                                  setMobileExpanded(null);
                                }}
                              >
                                {t(child.labelKey)}
                              </NavLink>
                            </li>
                          ))}
                        </m.ul>
                      )}
                    </AnimatePresence>
                  </m.li>
                ) : link.external ? (
                  // Lien externe (ex: Faire un don) → CTA pill orange même en mobile
                  <m.li key={link.labelKey} variants={mobileItemVariants}>
                    <a
                      href={link.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="navbar__mobile-link navbar__mobile-link--don"
                    >
                      <FaHandHoldingHeart size={16} aria-hidden="true" />
                      {t(link.labelKey)}
                    </a>
                  </m.li>
                ) : (
                  <m.li key={link.labelKey} variants={mobileItemVariants}>
                    <NavLink
                      to={link.to}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `navbar__mobile-link${isActive ? ' navbar__mobile-link--active' : ''}`
                      }
                    >
                      {t(link.labelKey)}
                    </NavLink>
                  </m.li>
                )
              )}
              {isAdminLoggedIn && (
                <m.li variants={mobileItemVariants}>
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="navbar__mobile-link navbar__mobile-link--admin"
                  >
                    <FaTachometerAlt size={16} aria-hidden="true" />
                    {t('nav.dashboard')}
                  </Link>
                </m.li>
              )}
            </m.ul>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
