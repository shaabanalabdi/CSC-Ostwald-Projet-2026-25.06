// ============================================================
// NosPartenaires.jsx — Sous-page "Nos partenaires" (/a-propos/nos-partenaires)
//
// Affiche deux groupes de logos :
//   1. Institutionnels → financeurs publics (Ville d'Ostwald, CAF, Région, État…)
//   2. Associatifs     → partenaires locaux (associations, structures du quartier)
//
// Phase 17 — les données viennent désormais de /api/partners.
// L'admin peut modifier les partenaires via /admin/partners.
// ============================================================
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import PageSEO from '@components/layout/PageSEO';
import SectionTitle from '@components/ui/SectionTitle';
import Marquee from '@components/ui/Marquee';
import Skeleton from '@components/ui/Skeleton';
import imgHero from '@assets/images/banniere-partenariats.png';
import { usePublicPartners } from '@features/partners';
import { isApiError, resolveStaticUrl } from '@api/client';
import './NosPartenaires.scss';
export default function NosPartenaires() {
  const { t } = useTranslation();
  const { data: partners, isLoading, isError, error } = usePublicPartners();
  // Sépare une seule fois par catégorie (déjà ordonnés par display_order
  // côté API). useMemo évite la re-allocation à chaque render même si
  // le coût d'un .filter() sur ~20 éléments est négligeable.
  const { institutionnels, associatifs } = useMemo(() => {
    if (!partners) return { institutionnels: [], associatifs: [] };
    return {
      institutionnels: partners.filter((p) => p.category === 'institutionnel'),
      associatifs: partners.filter((p) => p.category === 'associatif'),
    };
  }, [partners]);
  return (
    <>
      {/* Balises SEO pour cette sous-page */}
      <PageSEO
        title={t('partenaires.pageTitle')}
        description={t('partenaires.pageDesc')}
        url="/a-propos/nos-partenaires"
      />

      {/* Titre de la page */}
      <div className="page-header qsn__page-header">
        <h1>{t('partenaires.titre')}</h1>
      </div>

      {/* Image de bannière avec overlay texte */}
      <div className="nos-partenaires__hero">
        <img
          src={imgHero}
          alt="Ostwald, ville partenaire"
          width="1200"
          height="400"
          loading="lazy"
        />
        <div className="nos-partenaires__hero-overlay">
          <p className="nos-partenaires__hero-title">{t('partenaires.heroText')}</p>
        </div>
      </div>

      <div className="container">
        {/* Texte d'introduction */}
        <p className="nos-partenaires__intro">{t('partenaires.introSection')}</p>

        {isLoading && (
          <>
            <span className="sr-only" role="status">
              {t('partenaires.chargement')}
            </span>
            <div className="nos-partenaires__logos" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="nos-partenaires__logo-item">
                  <Skeleton width={140} height={90} />
                  <Skeleton shape="text" width={100} />
                </div>
              ))}
            </div>
          </>
        )}

        {isError && (
          <p className="nos-partenaires__state nos-partenaires__state--error" role="alert">
            {isApiError(error) ? error.message : t('partenaires.erreur')}
          </p>
        )}

        {/* ── Groupe 1 : Partenaires institutionnels ── */}
        {institutionnels.length > 0 && (
          <section className="nos-partenaires__section">
            <SectionTitle variant="orange" className="nos-partenaires__section-title">
              {t('partenaires.institutionnels')}
            </SectionTitle>
            <div className="nos-partenaires__logos">
              {institutionnels.map((p) =>
                p.website_url ? (
                  <a
                    key={p.id}
                    href={p.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nos-partenaires__logo-item"
                    title={p.name}
                  >
                    <div className="nos-partenaires__logo-box">
                      <img
                        src={resolveStaticUrl(p.logo_url)}
                        alt={p.name}
                        className="nos-partenaires__logo-img"
                        loading="lazy"
                      />
                    </div>
                    <span className="nos-partenaires__logo-name">{p.name}</span>
                  </a>
                ) : (
                  <div key={p.id} className="nos-partenaires__logo-item" title={p.name}>
                    <div className="nos-partenaires__logo-box">
                      <img
                        src={resolveStaticUrl(p.logo_url)}
                        alt={p.name}
                        className="nos-partenaires__logo-img"
                        loading="lazy"
                      />
                    </div>
                    <span className="nos-partenaires__logo-name">{p.name}</span>
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* ── Groupe 2 : Partenaires associatifs ── */}
        {associatifs.length > 0 && (
          <section className="nos-partenaires__section">
            <SectionTitle variant="blue" className="nos-partenaires__section-title">
              {t('partenaires.associatifs')}
            </SectionTitle>
            {/* Bande défilante (style 21st.dev) — pause au survol, scroll manuel
                en reduced-motion. Speed/gap inchangés depuis la version hardcodée. */}
            <Marquee speed={45} gap={56} className="nos-partenaires__marquee">
              {associatifs.map((p) => (
                <div key={p.id} className="nos-partenaires__logo-item" title={p.name}>
                  {p.logo_url ? (
                    <div className="nos-partenaires__logo-box">
                      <img
                        src={resolveStaticUrl(p.logo_url)}
                        alt={`Logo ${p.name}`}
                        className="nos-partenaires__logo-img"
                        width="200"
                        height="100"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div
                      className="nos-partenaires__logo-placeholder"
                      aria-label={t('partenaires.logoAVenir')}
                    />
                  )}
                  <span className="nos-partenaires__logo-name">{p.name}</span>
                </div>
              ))}
            </Marquee>
          </section>
        )}
      </div>
    </>
  );
}
