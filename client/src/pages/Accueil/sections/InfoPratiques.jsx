// ============================================================
// InfoPratiques.jsx — Section infos pratiques (page d'accueil)
// Adresse + transports, horaires d'ouverture, coordonnées de contact.
// ============================================================
import { useTranslation } from 'react-i18next';
import { FaTram, FaBus, FaClock, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { m } from 'framer-motion';
import useMotionPresets from '@hooks/useMotionPresets';
import SectionTitle from '@components/ui/SectionTitle';
import './InfoPratiques.scss';
export default function InfoPratiques() {
  const { t } = useTranslation();
  const { sectionReveal } = useMotionPresets();
  const horaires = [
    { jourKey: 'info.lundi', horaire: t('info.horaire') },
    { jourKey: 'info.mardi', horaire: t('info.horaire') },
    { jourKey: 'info.mercredi', horaire: t('info.horaire') },
    { jourKey: 'info.jeudi', horaire: t('info.horaire') },
    { jourKey: 'info.vendredi', horaire: t('info.horaire') },
  ];
  return (
    <m.section className="info" id="apropos" aria-label="Informations pratiques" {...sectionReveal}>
      <div className="container">
        {/* Titre de section en bubble vert — style Instagram CSC */}
        <SectionTitle variant="green" className="info__title">
          {t('info.titre')}
        </SectionTitle>

        <div className="info__grid">
          <div>
            <div className="info__block">
              <h3 className="info__subtitle">{t('info.commentNousTrouver')}</h3>
              {/* Lien cliquable vers OpenStreetMap — RGPD-compliant, pas de tracking */}
              <a
                href="https://www.openstreetmap.org/?mlat=48.55278&mlon=7.71378#map=18/48.55278/7.71378"
                target="_blank"
                rel="noopener noreferrer"
                className="info__address info__address--link"
                aria-label="Voir l’adresse sur OpenStreetMap"
              >
                <FaMapMarkerAlt />
                <span>1, place de la Bruyère, 67540 Ostwald</span>
              </a>
              <div className="info__transport">
                <span className="info__transport-item">
                  <FaTram />
                  <span>{t('info.tram')}</span>
                </span>
                <span className="info__transport-item">
                  <FaBus />
                  <span>{t('info.bus')}</span>
                </span>
              </div>
            </div>

            <div className="info__block">
              <h3 className="info__subtitle">
                <FaClock className="info__clock-icon" />
                {t('info.horaires')}
              </h3>
              <table className="info__table" aria-label="Horaires d’accueil">
                <tbody>
                  {horaires.map((h) => (
                    <tr key={h.jourKey} className="info__table-row">
                      <td className="info__table-day">{t(h.jourKey)}</td>
                      <td className="info__table-time">{h.horaire}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="info__block info__contact-block">
              <h3 className="info__subtitle">{t('info.nousContacter')}</h3>
              <p className="info__contact-text">
                <strong>{t('info.sansRdv')}</strong> : {t('info.texte1')}
              </p>
              <p className="info__contact-text">
                {t('info.texte2')}{' '}
                <a href="tel:0978809629" className="info__phone">
                  <FaPhone /> 09.78.80.96.29
                </a>{' '}
                {t('info.texte2b')}
              </p>
              <p className="info__contact-text">
                {t('info.texte3')}{' '}
                <a href="mailto:contact@csc-ostwald.fr" className="info__email">
                  <FaEnvelope /> contact@csc-ostwald.fr
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </m.section>
  );
}
