// ============================================================
// Benevole.jsx — Section "Devenir bénévole" de la page d'accueil
// Affichée en bas de la page Accueil, avant le Footer.
// ============================================================
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaHandsHelping, FaArrowRight } from 'react-icons/fa';
import { m } from 'framer-motion';
import useMotionPresets from '@hooks/useMotionPresets';
import SectionTitle from '@components/ui/SectionTitle';
import './Benevole.scss';
export default function Benevole() {
  const { t } = useTranslation();
  const { sectionReveal, bubbleHover } = useMotionPresets();
  return (
    <m.section
      className="benevole section-alt"
      id="benevole"
      aria-label="Devenir bénévole"
      {...sectionReveal}
    >
      <div className="container">
        <div className="benevole__inner">
          {/* Grande icône décorative — cachée aux lecteurs d'écran (aria-hidden) */}
          <div className="benevole__icon-wrapper" aria-hidden="true">
            <FaHandsHelping size={48} />
          </div>

          {/* Texte d'appel à l'action + bouton d'inscription */}
          <div className="benevole__content">
            {/* Titre en bubble pink — style Instagram CSC */}
            <SectionTitle variant="blue" className="benevole__title">
              {t('benevole.titre')}
            </SectionTitle>
            <p className="benevole__text">{t('benevole.texte1')}</p>
            {/* Texte mis en valeur (accroche forte) */}
            <p className="benevole__highlight">{t('benevole.highlight')}</p>

            {/* Bouton CTA en bubble orange + micro-interaction au hover */}
            <m.div {...bubbleHover} className="benevole__btn-wrap">
              <Link
                to="/inscription-benevole"
                className="btn-bubble btn-bubble--orange csc-bubble--shadow benevole__btn"
                id="btn-benevole"
                aria-label={t('benevole.btn')}
              >
                {t('benevole.btn')} <FaArrowRight size={13} />
              </Link>
            </m.div>
          </div>
        </div>
      </div>
    </m.section>
  );
}
