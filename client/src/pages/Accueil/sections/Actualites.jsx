// ============================================================
// Actualites.jsx — Section "Nos actualités" (page d'accueil)
//
// Affiche jusqu'à 4 cartes news (image, date, extrait, lien vers
// le post Instagram / Facebook), alimentées par /api/news.
// L'admin gère le contenu depuis /admin/news.
// ============================================================
import { useTranslation } from 'react-i18next';
import { FaInstagram, FaFacebookF } from 'react-icons/fa';
import { m } from 'framer-motion';
import useMotionPresets from '@hooks/useMotionPresets';
import { usePublicNews } from '@features/news';
import { resolveStaticUrl } from '@api/client';
import eventEnfants from '@assets/images/event-enfants.webp';
import eventJeunes from '@assets/images/event-jeunes.webp';
import CSCBadge from '@components/ui/CSCBadge';
import './Actualites.scss';

// Images de repli utilisées quand une actualité n'a pas d'image_url
// défini. Deux visuels distincts pour que des cartes consécutives ne se
// ressemblent pas.
const FALLBACK_IMAGES = [eventEnfants, eventJeunes];

// « 10 juillet 2026 » — même formulation que les anciennes données codées en dur.
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formatDate(iso) {
  if (!iso) return '';
  // L'API renvoie soit 'YYYY-MM-DD', soit une chaîne ISO complète ; les
  // deux se parsent correctement via new Date(...).
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return DATE_FORMATTER.format(d);
}

export default function Actualites() {
  const { t } = useTranslation();
  const { sectionReveal, staggerParent, staggerChild } = useMotionPresets();
  const { data, isLoading } = usePublicNews({ limit: 4 });

  const items = Array.isArray(data) ? data : [];

  // Rien à montrer et pas en attente de l'API → ne pas rendre une
  // section vide (évite un énorme espace blanc sur la page d'accueil).
  if (!isLoading && items.length === 0) return null;

  return (
    <m.section
      className="actu section"
      id="actualites"
      aria-label="Nos actualités"
      {...sectionReveal}
    >
      <div className="container">
        {/* Titre de section en bubble bleu — style Instagram CSC */}
        <CSCBadge as="h2" variant="blue" size="lg" tab="top" shadow className="actu__title">
          {t('actu.titre')}
        </CSCBadge>

        {isLoading && items.length === 0 ? (
          <p className="sr-only" role="status">
            Chargement des actualités…
          </p>
        ) : (
          <m.div className="actu__grid" {...staggerParent}>
            {items.map((item, index) => {
              const imageSrc = item.image_url
                ? resolveStaticUrl(item.image_url)
                : FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
              const platform = item.social_platform;
              const socialUrl = item.social_url;
              const hasSocialLink = platform !== 'none' && Boolean(socialUrl);

              return (
                <m.article
                  key={item.id}
                  className="actu-card spotlight-card"
                  aria-label={item.title}
                  {...staggerChild}
                >
                  <div className="actu-card__img-wrapper">
                    <img
                      src={imageSrc}
                      alt=""
                      className="actu-card__img"
                      loading="lazy"
                      width="600"
                      height="400"
                    />
                    {hasSocialLink && (
                      <div className="actu-card__overlay">
                        <a
                          href={socialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`actu-card__social actu-card__social--${platform}`}
                          id={`btn-actu-social-${item.id}`}
                          aria-label={`${t('actu.voirSur')} ${platform}`}
                        >
                          {platform === 'instagram' ? (
                            <FaInstagram size={20} />
                          ) : (
                            <FaFacebookF size={20} />
                          )}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="actu-card__body">
                    <time className="actu-card__date" dateTime={item.date_published}>
                      {formatDate(item.date_published)}
                    </time>
                    <h3 className="actu-card__title">{item.title}</h3>
                    <p className="actu-card__excerpt">{item.excerpt}</p>
                    {hasSocialLink && (
                      <a
                        href={socialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="actu-card__btn"
                        id={`btn-actu-${item.id}`}
                        aria-label={`Lire l'article : ${item.title}`}
                      >
                        {t('actu.lireSuite')}
                      </a>
                    )}
                  </div>
                </m.article>
              );
            })}
          </m.div>
        )}
      </div>
    </m.section>
  );
}
