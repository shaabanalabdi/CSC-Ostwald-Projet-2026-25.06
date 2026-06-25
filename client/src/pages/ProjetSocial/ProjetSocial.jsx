// ============================================================
// ProjetSocial.jsx — public "Projet Social" page.
//
// Documents now come from /api/projet-social/documents. Admins edit
// them via /admin/projet-social — no code change needed to add a PDF.
// Hero copy stays in i18n (rarely changes, multi-language).
// Les documents à télécharger (formulaires, cerfa…) ont été déplacés
// vers la page dédiée : /a-propos/documents-a-telecharger
// ============================================================
import { useTranslation } from 'react-i18next';
import { FaDownload, FaFileAlt } from 'react-icons/fa';
import PageSEO from '@components/layout/PageSEO';
import TextReveal from '@components/ui/TextReveal';
import { usePublicProjetSocialDocuments } from '@features/projet-social';
import { isApiError } from '@api/client';
import './ProjetSocial.scss';

function iconForDoc() {
  return FaFileAlt;
}

const isProjetDoc = (doc) => {
  const label = doc.badge_label.toUpperCase();
  return label.includes('PROJET') || label.includes('RAPPORT');
};

export default function ProjetSocial() {
  const { t } = useTranslation();
  const { data: documents, isLoading, isError, error } = usePublicProjetSocialDocuments();

  const projetDocs = documents ? documents.filter(isProjetDoc) : [];

  const renderCards = (docs) =>
    docs.map((doc) => {
      const DocIcon = iconForDoc(doc);
      return (
        <div key={doc.id} className={`ps__doc-card spotlight-card ps__doc-card--${doc.color}`}>
          <div className="ps__doc-icon">
            <DocIcon size={32} />
          </div>
          <h3 className="ps__doc-title">{doc.title}</h3>
          {doc.description && <p className="ps__doc-desc">{doc.description}</p>}
          <a
            href={doc.file_url}
            download
            className={`btn-bubble btn-bubble--${doc.color} csc-bubble--shadow ps__doc-btn`}
            aria-label={`${t('projetSocial.telecharger')} ${doc.title}`}
          >
            <FaDownload size={13} />
            {t('projetSocial.telecharger')}
          </a>
        </div>
      );
    });

  return (
    <>
      <PageSEO
        title={t('projetSocial.pageTitle')}
        description={t('projetSocial.heroIntro')}
        url="/a-propos/projet-social"
      />

      <section className="ps__hero">
        <h1 className="ps__hero-title">{t('projetSocial.heroTitle')}</h1>
        <TextReveal text={t('projetSocial.heroIntro')} as="p" className="ps__hero-intro" />
      </section>

      {/* ── Section Projet Social ── */}
      <section className="ps__docs section">
        <div className="container">
          <p className="ps__docs-intro">{t('projetSocial.projetsIntro')}</p>

          {isLoading && (
            <p className="ps__state" role="status">
              {t('projetSocial.chargement')}
            </p>
          )}
          {isError && (
            <p className="ps__state ps__state--error" role="alert">
              {isApiError(error) ? error.message : t('projetSocial.erreur')}
            </p>
          )}
          {!isLoading && !isError && projetDocs.length > 0 && (
            <div className="ps__docs-grid">{renderCards(projetDocs)}</div>
          )}
        </div>
      </section>
    </>
  );
}
