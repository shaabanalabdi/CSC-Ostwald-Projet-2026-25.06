// ============================================================
// DocumentsATelecharger.jsx — Page "Documents à télécharger"
//
// Sous-page de la section "À Propos" accessible via :
//   /a-propos/documents-a-telecharger
//
// Affiche tous les documents utiles (formulaires, cerfa, fiche sanitaire…)
// issus de l'API /api/projet-social/documents, filtrés pour ne garder
// que ceux qui NE sont pas des rapports ou projets sociaux.
// Les admins gèrent ces documents via /admin/projet-social.
// ============================================================
import { useTranslation } from 'react-i18next';
import { FaDownload, FaFilePdf, FaFileSignature } from 'react-icons/fa';
import PageSEO from '@components/layout/PageSEO';
import TextReveal from '@components/ui/TextReveal';
import { usePublicProjetSocialDocuments } from '@features/projet-social';
import { isApiError } from '@api/client';
import '../ProjetSocial/ProjetSocial.scss';

function iconForDoc(doc) {
  const label = doc.badge_label.toUpperCase();
  if (label.includes('CERFA')) return FaFilePdf;
  if (doc.title.toLowerCase().includes('inscription')) return FaFileSignature;
  return FaFilePdf;
}

const isProjetDoc = (doc) => {
  const label = doc.badge_label.toUpperCase();
  return label.includes('PROJET') || label.includes('RAPPORT');
};

export default function DocumentsATelecharger() {
  const { t } = useTranslation();
  const { data: documents, isLoading, isError, error } = usePublicProjetSocialDocuments();

  const docs = documents ? documents.filter((doc) => !isProjetDoc(doc)) : [];

  const renderCards = (docList) =>
    docList.map((doc) => {
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
        title={t('documentsATelecharger.pageTitle')}
        description={t('documentsATelecharger.heroIntro')}
        url="/a-propos/documents-a-telecharger"
      />

      <section className="ps__hero">
        <h1 className="ps__hero-title">{t('documentsATelecharger.heroTitle')}</h1>
        <TextReveal
          text={t('documentsATelecharger.heroIntro')}
          as="p"
          className="ps__hero-intro"
        />
      </section>

      <section className="ps__docs ps__docs--alt section">
        <div className="container">
          <p className="ps__docs-intro">{t('documentsATelecharger.docsIntro')}</p>

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
          {!isLoading && !isError && docs.length === 0 && (
            <p className="ps__state" role="status">
              {t('projetSocial.vide')}
            </p>
          )}
          {!isLoading && !isError && docs.length > 0 && (
            <div className="ps__docs-grid ps__docs-grid--three">{renderCards(docs)}</div>
          )}
        </div>
      </section>
    </>
  );
}
