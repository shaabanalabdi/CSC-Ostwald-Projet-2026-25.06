// ============================================================
// NotFound.jsx — Page 404
// Affichée pour toute URL inconnue (route "*" dans App.jsx).
// Polish complet : atmosphère sunset (orange+pink+bleu) pour rester
// chaleureuse + Magnetic CTA + bulles ambient.
// ============================================================
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaHome, FaArrowRight } from 'react-icons/fa';
import PageSEO from '@components/layout/PageSEO';
import SectionTitle from '@components/ui/SectionTitle';
import GradientMesh from '@components/ui/GradientMesh';
import GrainTexture from '@components/ui/GrainTexture';
import AmbientBubbles from '@components/ui/AmbientBubbles';
import Magnetic from '@components/ui/Magnetic';
import './NotFound.scss';
export default function NotFound() {
  const { t } = useTranslation();
  return (
    <>
      <PageSEO
        title="Page introuvable | CSC Ostwald"
        description="Cette page n'existe pas ou a été déplacée."
        noindex
      />
      <div className="not-found">
        {/* Atmosphère sunset : on garde la chaleur de la marque même sur une page
            d'erreur. Pas de ton négatif (« vous êtes perdu ») — plutôt accueillant. */}
        <GradientMesh variant="sunset" />
        <AmbientBubbles count={6} seed={404} />
        <GrainTexture opacity={0.05} />

        <div className="not-found__inner">
          {/* 404 en très grand caractère typographique — accent visuel principal */}
          <div className="not-found__digits" aria-hidden="true">
            <span>4</span>
            <span>0</span>
            <span>4</span>
          </div>

          {/* Sous-titre en bubble orange */}
          <SectionTitle level={1} variant="orange" className="not-found__title">
            {t('notFound.titre') || 'Page introuvable'}
          </SectionTitle>

          <p className="not-found__text">{t('notFound.texte')}</p>

          {/* CTA principal Magnetic — retour à l'accueil */}
          <Magnetic strength={0.3}>
            <Link
              to="/"
              className="btn-bubble btn-bubble--orange csc-bubble--shadow not-found__btn"
            >
              <FaHome aria-hidden="true" />
              <span>{t('notFound.retour')}</span>
              <FaArrowRight size={12} aria-hidden="true" />
            </Link>
          </Magnetic>

          {/* Raccourcis vers les sections les plus visitées — limite la
            probabilité que l'utilisateur reparte sans avoir trouvé son chemin. */}
          <nav className="not-found__shortcuts" aria-label={t('notFound.populaireAria')}>
            <p className="not-found__shortcuts-label">{t('notFound.populaire')}</p>
            <ul className="not-found__shortcuts-list">
              <li>
                <Link to="/famille">{t('nav.famille')}</Link>
              </li>
              <li>
                <Link to="/jeunesse">{t('nav.jeunesse')}</Link>
              </li>
              <li>
                <Link to="/contact">{t('nav.contact')}</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
