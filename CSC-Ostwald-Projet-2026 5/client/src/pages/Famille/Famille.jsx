// ============================================================
// Famille.jsx — Page "Famille" du site CSC Ostwald
//
// Phase 19 — les activités viennent désormais de /api/activities?type=famille.
// Le filtre serveur ne renvoie que les `is_published = 1`. L'admin
// les édite via /admin/activities ; les changements apparaissent ici
// au prochain refetch (staleTime 1 h).
// ============================================================
import { Link } from 'react-router-dom';
import PageSEO from '@components/layout/PageSEO';
import CSCBadge from '@components/ui/CSCBadge';
import SectionTitle from '@components/ui/SectionTitle';
import TextReveal from '@components/ui/TextReveal';
import { useTranslation } from 'react-i18next';
import { usePublicActivities } from '@features/activities';
import { isApiError, resolveStaticUrl } from '@api/client';
import './Famille.scss';
export default function Famille() {
  const { t } = useTranslation();
  const { data: activitesFamille, isLoading, isError, error } = usePublicActivities('famille');
  return (
    <>
      <PageSEO title={t('famille.pageTitle')} description={t('famille.heroIntro')} url="/famille" />

      <section className="famille__hero">
        <SectionTitle level={1} variant="orange" size="xl" className="famille__hero-title">
          {t('famille.heroTitle')}
        </SectionTitle>
        {/* TextReveal : les mots du paragraphe d'intro apparaissent en cascade
            (blur→sharp + slide up) à l'entrée du viewport. Effet signature lisible
            qui donne une « voix » au texte d'accueil. */}
        <TextReveal text={t('famille.heroIntro')} as="p" className="famille__hero-intro" />
      </section>

      {/* ── Section Activités ── */}
      <section className="famille__activites">
        <div className="container">
          <SectionTitle variant="orange" className="famille__activites-title">
            {t('famille.rdvTitre')}
          </SectionTitle>
          <p className="famille__activites-desc">{t('famille.rdvDesc')}</p>

          {/* Loading state: no visible skeleton (the skeleton vs real
            card height mismatch was the dominant CLS contributor on
            this page). We DO still announce via sr-only for AT users
            and reserve the grid height below so the contact block
            doesn't move when the cards swap in. */}
          {isLoading && (
            <span className="sr-only" role="status">
              {t('famille.chargement')}
            </span>
          )}

          {isError && (
            <p className="famille__state famille__state--error" role="alert">
              {isApiError(error) ? error.message : t('famille.erreur')}
            </p>
          )}

          {activitesFamille && activitesFamille.length === 0 && (
            <p className="famille__state" role="status">
              {t('famille.vide')}
            </p>
          )}

          {/* Grille de cartes — une carte par activité famille */}
          {activitesFamille && activitesFamille.length > 0 && (
            <div className="famille__grid">
              {activitesFamille.map((a) => (
                <div key={a.id} className="famille__card spotlight-card">
                  {/* Zone image — bubble fréquence en overlay (style Instagram).
                    Background-image inline car l'URL provient de la DB et change
                    par carte ; SCSS ne peut pas la connaître à l'avance. */}
                  <div
                    className="famille__card-img"
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
                        className="famille__card-badge"
                      >
                        {a.frequence}
                      </CSCBadge>
                    )}
                  </div>

                  <div className="famille__card-body">
                    {/* Catégorie en orange (ex: "SORTIE EN TRIBU") */}
                    {a.categorie_label && (
                      <span className="famille__card-categorie">{a.categorie_label}</span>
                    )}
                    <CSCBadge as="h3" variant="orange" size="sm" className="famille__card-titre">
                      {a.title}
                    </CSCBadge>
                    <p className="famille__card-desc">{a.description}</p>

                    <div className="famille__card-footer">
                      {/* Badge optionnel en bas de carte (ex: "famille", "séance") */}
                      {a.tag && <span className="famille__card-tag">{a.tag}</span>}

                      {/* Inscription = uniquement via contact (décision du CSC) */}
                      <Link to="/contact" className="famille__card-cta">
                        {t('famille.nousContacter')}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bloc contact — coordonnées de la responsable famille (Charline) */}
        <div className="famille__contact">
          <p className="famille__renseignement">{t('famille.renseignement')}</p>
          <div className="famille__contact-coords">
            <span>
              <strong>{t('famille.contactMail')} : </strong>
              {t('famille.charlineMail')}
            </span>
            <span>
              <strong>{t('famille.contactTel')} : </strong>
              {t('famille.charlineTel')}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
