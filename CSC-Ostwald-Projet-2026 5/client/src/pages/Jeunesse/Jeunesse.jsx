// ============================================================
// Jeunesse.jsx — Page "Jeunesse" du site CSC Ostwald
//
// Phase 19 — les ateliers Jeunesse viennent désormais de
// /api/activities?type=jeunesse. Le serveur applique le filtre
// `is_published = 1`. L'admin les édite via /admin/activities.
//
// Le flow d'inscription en ligne (Phase 11.3) reste préservé :
// `buildInscriptionUrl` lit `cout` depuis l'API et construit l'URL
// /inscription-jeunesse avec activity_id / title / amount.
// ============================================================
import { Link } from 'react-router-dom';
import PageSEO from '@components/layout/PageSEO';
import CSCBadge from '@components/ui/CSCBadge';
import SectionTitle from '@components/ui/SectionTitle';
import TextReveal from '@components/ui/TextReveal';
import { useTranslation } from 'react-i18next';
import { usePublicActivities } from '@features/activities';
import { isApiError, resolveStaticUrl } from '@api/client';
import { parseCoutToCents } from '@features/registration';
import { PAYMENTS_ENABLED } from '@/config/features';
import './Jeunesse.scss';
// Construit l'URL d'inscription d'une activité, ou renvoie null si la
// chaîne de prix est impossible à parser. Un retour null indique à la
// carte de masquer le bouton « S'inscrire » (Nous contacter reste en
// repli).
//
// SÉCURITÉ : le montant n'est INTENTIONNELLEMENT pas dans l'URL. Le
// `RegistrationService` backend cherche `activity.price_cents` côté
// serveur et ignore tout ce que le client envoie — mettre le montant
// dans l'URL (a) laisserait les utilisateurs l'éditer pour payer moins,
// et (b) suggérerait aux lecteurs que c'est une source fiable. La page
// d'inscription récupère le prix d'affichage depuis l'API activité par id.
function buildInscriptionUrl(activity) {
  // On pré-vérifie quand même qu'un prix sensé peut être parsé depuis
  // `cout` (chaîne d'affichage), pour ne pas montrer le bouton
  // « S'inscrire » sur des activités qui ne sont pas réellement
  // payantes. Le contrôle est cosmétique — la vraie barrière vit sur le
  // serveur.
  const amountCents = parseCoutToCents(activity.cout);
  if (amountCents === null) return null;
  const params = new URLSearchParams({
    activity_id: String(activity.id),
    title: activity.title,
  });
  return `/inscription-jeunesse?${params.toString()}`;
}
export default function Jeunesse() {
  const { t } = useTranslation();
  const { data: activitesJeunesse, isLoading, isError, error } = usePublicActivities('jeunesse');
  return (
    <>
      <PageSEO
        title={t('jeunesse.pageTitle')}
        description={t('jeunesse.heroIntro')}
        url="/jeunesse"
      />

      <section className="jeunesse__hero">
        <SectionTitle level={1} variant="blue" size="xl" className="jeunesse__hero-title">
          {t('jeunesse.sectionTitre')}
        </SectionTitle>
        {/* TextReveal : cascade des mots à l'apparition (signature CSC Ostwald) */}
        <TextReveal text={t('jeunesse.heroSubtitle')} as="p" className="jeunesse__hero-intro" />
      </section>

      {/* ── ATELIERS — grille des activités régulières + bloc contact Aurélie ── */}
      <section className="jeunesse__activites">
        <div className="container">
          <SectionTitle variant="blue" className="jeunesse__activites-title">
            {t('jeunesse.rdvTitre')}
          </SectionTitle>
          <p className="jeunesse__activites-desc">{t('jeunesse.rdvDesc')}</p>

          {/* Loading state: see Famille.tsx — visual skeleton dropped
            because its height couldn't match the variable real-card
            height closely enough, and the resulting CLS (0.13 on
            mobile) was way over the WCAG/Lighthouse 0.1 threshold. */}
          {isLoading && (
            <span className="sr-only" role="status">
              {t('jeunesse.chargement')}
            </span>
          )}

          {isError && (
            <p className="jeunesse__state jeunesse__state--error" role="alert">
              {isApiError(error) ? error.message : t('jeunesse.erreur')}
            </p>
          )}

          {activitesJeunesse && activitesJeunesse.length === 0 && (
            <p className="jeunesse__state" role="status">
              {t('jeunesse.vide')}
            </p>
          )}

          {/* Grille de cartes — une carte par activité jeunesse */}
          {activitesJeunesse && activitesJeunesse.length > 0 && (
            <div className="jeunesse__grid">
              {activitesJeunesse.map((a) => {
                // Bouton « S'inscrire » masqué tant que PAYMENTS_ENABLED est
                // false (site en ligne avant que HelloAsso ne soit prêt) —
                // « Nous contacter » reste alors le seul appel à l'action.
                const _inscriptionUrl = PAYMENTS_ENABLED ? buildInscriptionUrl(a) : null;
                return (
                  <div key={a.id} className="jeunesse__card spotlight-card">
                    {/* Zone image — bubble fréquence en overlay (style Instagram).
                        Background-image inline car l'URL est en DB et change par carte. */}
                    <div
                      className="jeunesse__card-img"
                      style={
                        a.image_url
                          ? { backgroundImage: `url(${resolveStaticUrl(a.image_url)})` }
                          : undefined
                      }
                    >
                      {a.frequence && (
                        <CSCBadge
                          variant="green"
                          size="sm"
                          tilt="right"
                          className="jeunesse__card-badge"
                        >
                          {a.frequence}
                        </CSCBadge>
                      )}
                    </div>

                    <div className="jeunesse__card-body">
                      {/* Catégorie en bleu (ex: "MUSIQUE & EXPRESSION") */}
                      {a.categorie_label && (
                        <span className="jeunesse__card-categorie">{a.categorie_label}</span>
                      )}
                      <CSCBadge as="h3" variant="blue" size="sm" className="jeunesse__card-titre">
                        {a.title}
                      </CSCBadge>
                      <p className="jeunesse__card-desc">{a.description}</p>

                      <div className="jeunesse__card-footer">
                        {/* Badge optionnel (ex: "jeune") */}
                        {a.tag && <span className="jeunesse__card-tag">{a.tag}</span>}

                        <div className="jeunesse__card-actions">
                          <Link to="/contact" className="jeunesse__card-cta">
                            {t('jeunesse.nousContacter')}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bloc contact — coordonnées de la responsable jeunesse (Aurélie) */}
        <div className="jeunesse__contact">
          <p className="jeunesse__renseignement">{t('jeunesse.renseignement')}</p>
          <div className="jeunesse__contact-coords">
            <span>
              <strong>{t('jeunesse.contactMail')} : </strong>
              {t('jeunesse.aurelieMail')}
            </span>
            <span>
              <strong>{t('jeunesse.contactTel')} : </strong>
              {t('jeunesse.aurelieTel')}
            </span>
          </div>
        </div>
      </section>

      {/* ── CTA BAS DE PAGE — "On t'aide à te lancer !" ── */}
      <section className="jeunesse__lancer">
        <div className="container">
          {/* Titre d'appel à l'action */}
          <h2 className="jeunesse__lancer-titre">{t('jeunesse.heroTitle')}</h2>
          {/* Description de l'accompagnement proposé */}
          <p className="jeunesse__hero-intro">{t('jeunesse.heroIntro')}</p>
        </div>
      </section>
    </>
  );
}
