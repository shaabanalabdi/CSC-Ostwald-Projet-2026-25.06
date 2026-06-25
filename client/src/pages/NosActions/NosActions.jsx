import PageSEO from '@components/layout/PageSEO';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import imgEnfants from '@assets/images/event-enfants.webp';
import imgJeunes from '@assets/images/event-jeunes.webp';
import { usePublicProgrammeMensuel } from '@features/programme-mensuel';
import { resolveStaticUrl } from '@api/client';
import './NosActions.scss';

const ATELIERS = [
  {
    key: 'peinture1',
    image: imgEnfants,
    title: 'Atelier peinture',
    heureDebut: '10h00',
    heureFin: '12h00',
    jour1: 'Mercredi',
    jour2: 'Lundi',
  },
  {
    key: 'peinture2',
    image: imgJeunes,
    title: 'Atelier peinture',
    heureDebut: '10h00',
    heureFin: '12h00',
    jour1: 'Mercredi',
    jour2: 'Lundi',
  },
  {
    key: 'peinture3',
    image: imgEnfants,
    title: 'Atelier peinture',
    heureDebut: '10h00',
    heureFin: '12h00',
    jour1: 'Mercredi',
    jour2: 'Lundi',
  },
  {
    key: 'peinture4',
    image: imgJeunes,
    title: 'Atelier peinture',
    heureDebut: '10h00',
    heureFin: '12h00',
    jour1: 'Mercredi',
    jour2: 'Lundi',
  },
];

export default function NosActions() {
  const { t } = useTranslation();
  const { data: programmes } = usePublicProgrammeMensuel();
  const programmesAffichés =
    Array.isArray(programmes) && programmes.length > 0 ? programmes.slice(0, 2) : null;

  return (
    <>
      <PageSEO
        title={t('nosActions.pageTitle')}
        description={t('nosActions.intro')}
        url="/nos-actions"
      />

      <div className="container nosactions__wrapper">
        {/* INTRO */}
        <p className="nosactions__intro">{t('nosActions.intro')}</p>

        {/* PROGRAMME MENSUEL */}
        <section className="nosactions__section">
          <h2 className="nosactions__section-title">Programme mensuel</h2>
          <div className="nosactions__programme-grid">
            {programmesAffichés ? (
              programmesAffichés.map((p) => (
                <div key={p.id} className="nosactions__programme-img">
                  <img src={resolveStaticUrl(p.image_url)} alt={`${p.mois_nom} ${p.annee}`} />
                  <p className="nosactions__programme-label">
                    {p.mois_nom} {p.annee}
                  </p>
                </div>
              ))
            ) : (
              <>
                <div className="nosactions__programme-img">
                  <img src={imgEnfants} alt="Programme mensuel 1" />
                </div>
                <div className="nosactions__programme-img">
                  <img src={imgJeunes} alt="Programme mensuel 2" />
                </div>
              </>
            )}
          </div>
        </section>

        {/* ATELIERS RÉGULIERS */}
        <section className="nosactions__section">
          <h2 className="nosactions__section-title">Ateliers réguliers</h2>
          <div className="ateliers__grid">
            {ATELIERS.map((atelier) => (
              <article key={atelier.key} className="atelier__card">
                <div className="atelier__img-wrapper">
                  <img src={atelier.image} alt={atelier.title} className="atelier__img" />
                </div>
                <h3 className="atelier__title">{atelier.title}</h3>
                <p className="atelier__horaire">
                  A partir de <span className="orange">{atelier.heureDebut}</span> jusqu'a{' '}
                  <span className="orange">{atelier.heureFin}</span>
                </p>
                <p className="atelier__jours">
                  Tous les <span className="orange">{atelier.jour1}</span> ou{' '}
                  <span className="bleu">{atelier.jour2}</span>
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* CTA CONTACT */}
        <section className="nosactions__cta">
          <p className="nosactions__cta-text">{t('nosActions.ctaTexte')}</p>
          <Link to="/contact" className="nosactions__cta-btn">
            {t('nosActions.ctaBouton')} <FaArrowRight size={13} />
          </Link>
        </section>
      </div>
    </>
  );
}
