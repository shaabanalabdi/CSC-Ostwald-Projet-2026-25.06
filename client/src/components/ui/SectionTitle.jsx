// ============================================================
// SectionTitle.jsx — Titre de section unifié.
//
// Fine surcouche de <CSCBadge> : fige le combo de props utilisé pour les
// titres de section (badge bulle avec tab + ombre), afin que TOUS les
// titres de section du site soient strictement cohérents — au lieu de
// répéter `<CSCBadge as="h2" tab="bottom" shadow size="lg" …>` partout.
//
// Hérite automatiquement de la police d'affichage Fredoka via `.csc-bubble`.
//
// Exemples :
//   <SectionTitle sector="famille">Nos activités familles</SectionTitle>
//   <SectionTitle variant="green" level={3} size="md">Documents</SectionTitle>
// ============================================================
import CSCBadge from './CSCBadge';

export default function SectionTitle({
  // Niveau de titre HTML (h2 par défaut — un seul h1 par page).
  level = 2,
  // Secteur d'activité — applique le code couleur de la charte.
  sector,
  // Couleur explicite si aucun secteur n'est pertinent (vert par défaut).
  variant = 'green',
  size = 'lg',
  className = '',
  children,
  ...rest
}) {
  return (
    <CSCBadge
      as={`h${level}`}
      sector={sector}
      variant={variant}
      size={size}
      tab="bottom"
      shadow
      className={`section-title ${className}`.trim()}
      {...rest}
    >
      {children}
    </CSCBadge>
  );
}
