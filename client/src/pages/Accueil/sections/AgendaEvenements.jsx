// ============================================================
// AgendaEvenements.jsx — Carrousel scroll-snap des prochains événements
//
// Phase 18 — les données viennent de /api/events/upcoming, qui filtre
// déjà côté serveur (`date_event >= NOW() AND show_in_agenda = 1`,
// ordre croissant). Plus besoin d'isEventPast côté client.
//
// Performance :
//   - scroll natif (passive listener), pas de framer-motion sur le scroll
//   - update state activé/désactivé des flèches à chaque scroll
//   - RTL-safe via Math.abs(scrollLeft)
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaMapMarkerAlt,
  FaTag,
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
  FaArrowRight,
} from 'react-icons/fa';
import { m } from 'framer-motion';
import useMotionPresets from '@hooks/useMotionPresets';
import { usePublicEvents } from '@features/events';
import { isApiError, resolveStaticUrl } from '@api/client';
import CSCBadge from '@components/ui/CSCBadge';
import SectionTitle from '@components/ui/SectionTitle';
import Skeleton from '@components/ui/Skeleton';
import './AgendaEvenements.scss';
/** Default category color when an event has none — orange CSC. */
const DEFAULT_CATEGORY_COLOR = '#ee961b';
/**
 * Formate un datetime ISO en un libellé lisible comme « 18 juillet 2026 ».
 * Utilise la locale courante de l'utilisateur, avec un repli sur 'fr-FR'
 * qui correspond à l'UI d'origine.
 */
function formatEventDate(iso, locale) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale || 'fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}
export default function AgendaEvenements() {
  const { t, i18n } = useTranslation();
  const { sectionReveal, staggerParent, staggerChild } = useMotionPresets();
  const viewportRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const { data: events, isLoading, isError, error } = usePublicEvents({ limit: 20 });
  const total = events?.length ?? 0;
  // Met à jour l'état activé/désactivé des flèches selon la position scrollLeft.
  // Math.abs() couvre les anciens navigateurs RTL où scrollLeft peut être négatif.
  const updateScrollState = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const scrollLeft = Math.abs(el.scrollLeft);
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanPrev(scrollLeft > 4);
    setCanNext(scrollLeft < maxScroll - 4);
  }, []);
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || total === 0) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [total, updateScrollState]);
  // Fait défiler d'exactement UNE largeur de carte (+ gap) à chaque clic.
  // En RTL, scrollBy({ left: +X }) avance toujours dans l'ordre du document
  // (les navigateurs modernes utilisent le « default mode » CSSOM).
  const scrollByOne = (dir) => {
    const el = viewportRef.current;
    if (!el) return;
    const card = el.querySelector('.event-card');
    if (!card) return;
    const cardWidth = card.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(el).columnGap || '20');
    el.scrollBy({ left: dir * (cardWidth + gap), behavior: 'smooth' });
  };
  const renderCard = (event) => {
    const categoryLabel = event.category_label ?? '';
    const categoryColor = event.category_color ?? DEFAULT_CATEGORY_COLOR;
    return (
      <m.article
        key={event.id}
        className="event-card spotlight-card"
        aria-label={event.title}
        {...staggerChild}
      >
        {/* Image en background full-bleed (style Instagram post) */}
        <div className="event-card__img-wrapper">
          {event.image_url && (
            <img
              src={resolveStaticUrl(event.image_url)}
              alt={event.title}
              className="event-card__img"
              loading="lazy"
              width="600"
              height="400"
            />
          )}
          {/* Bubble catégorie en overlay top-left — couleur stockée en DB
                en hex, appliquée en inline-style car SCSS ne peut pas la
                connaître à l'avance. */}
          {categoryLabel && (
            <CSCBadge
              variant="orange"
              size="sm"
              className="event-card__category"
              style={{ background: categoryColor }}
            >
              {categoryLabel}
            </CSCBadge>
          )}
          {/* Bubble date en overlay bottom-right (style Instagram) */}
          <CSCBadge variant="green" size="sm" tilt="right" className="event-card__date-badge">
            {formatEventDate(event.date_event, i18n.language)}
          </CSCBadge>
        </div>

        <div className="event-card__body">
          <h3 className="event-card__title">{event.title}</h3>

          <ul className="event-card__meta">
            {event.lieu && (
              <li>
                <FaMapMarkerAlt />
                <span>{event.lieu}</span>
              </li>
            )}
            {event.cout && (
              <li className="event-card__meta--green">
                <FaTag />
                <span>
                  {t('agenda.cout')} : <strong>{event.cout}</strong>
                </span>
              </li>
            )}
            {event.capacite !== null && (
              <li>
                <FaUsers />
                <span>
                  {t('agenda.places')} : <strong>{event.capacite}</strong>
                </span>
              </li>
            )}
          </ul>

          {/* Inscription = uniquement via contact (décision du CSC) */}
          <Link
            to="/contact"
            className="event-card__btn"
            id={`btn-event-${event.id}`}
            aria-label={`${t('agenda.nousContacter')} — ${event.title}`}
          >
            {t('agenda.nousContacter')} <FaArrowRight size={8} />
          </Link>
        </div>
      </m.article>
    );
  };
  return (
    <m.section
      className="agenda section-alt"
      id="agenda"
      aria-label="Agenda des événements"
      {...sectionReveal}
    >
      <div className="container">
        {/* Titre de section en bubble orange — style Instagram CSC */}
        <SectionTitle variant="orange" className="agenda__title">
          {t('agenda.titre')}
        </SectionTitle>

        {isLoading && (
          <>
            <span className="sr-only" role="status">
              {t('agenda.chargement')}
            </span>
            <div className="agenda__cards" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="event-card">
                  <Skeleton height={200} style={{ borderRadius: 0 }} />
                  <div className="event-card__body" style={{ padding: 18 }}>
                    <Skeleton shape="text" width="80%" />
                    <Skeleton shape="text" width="60%" style={{ marginTop: 12 }} />
                    <Skeleton shape="text" width="50%" style={{ marginTop: 8 }} />
                    <Skeleton shape="text" width="40%" style={{ marginTop: 8 }} />
                    <Skeleton height={36} width="50%" style={{ marginTop: 16 }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {isError && (
          <p className="agenda__empty" role="alert">
            {isApiError(error) ? error.message : t('agenda.erreur')}
          </p>
        )}

        {!isLoading && !isError && total === 0 && (
          <p className="agenda__empty">{t('agenda.vide')}</p>
        )}

        {events && total > 0 && (
          <div className="agenda__wrapper">
            <button
              type="button"
              className="agenda__arrow agenda__arrow--prev"
              onClick={() => scrollByOne(-1)}
              disabled={!canPrev}
              aria-label={t('agenda.prev')}
              id="btn-agenda-prev"
            >
              <FaChevronLeft />
            </button>

            <m.div ref={viewportRef} className="agenda__cards" {...staggerParent}>
              {events.map(renderCard)}
            </m.div>

            <button
              type="button"
              className="agenda__arrow agenda__arrow--next"
              onClick={() => scrollByOne(1)}
              disabled={!canNext}
              aria-label={t('agenda.next')}
              id="btn-agenda-next"
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </m.section>
  );
}
