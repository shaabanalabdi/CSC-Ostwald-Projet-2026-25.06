// ============================================================
// CSCBadge.jsx — Badge décoratif inspiré des posts Instagram @csc_ostwald
//
// Reproduit fidèlement les "bubbles colorés avec petit tab" qui sont
// la signature visuelle du CSC sur les réseaux sociaux.
//
// Exemples d'usage :
//   <CSCBadge variant="orange" size="xl" tab="bottom">
//     ATELIER ENFANTS
//   </CSCBadge>
//
//   <CSCBadge as="h2" variant="blue" size="lg">
//     Arts plastiques pour les 6–10 ans
//   </CSCBadge>
//
//   <CSCBadge variant="green" size="sm" tilt="right">
//     14 mai · 14h
//   </CSCBadge>
//
//   // `sector` exprime le code couleur de la charte de façon sémantique :
//   <CSCBadge sector="jeunesse" size="sm">Atelier ados</CSCBadge>
// ============================================================

// Correspondance secteur d'activité → variante de couleur du badge.
// Source unique côté JS — reflète $sector-colors de styles/_variables.scss
// (familles = orange · jeunesse = rose · reguliere/environnement = vert).
const SECTOR_VARIANT = {
  famille: 'orange',
  jeunesse: 'pink',
  reguliere: 'green',
  environnement: 'green',
};

export default function CSCBadge({
  variant = 'orange',
  sector,
  size = 'md',
  tab = 'none',
  tilt = 'none',
  shadow = false,
  as: Component = 'span',
  className = '',
  children,
  ...rest
}) {
  // `sector` (famille|jeunesse|reguliere|environnement) prime sur `variant` —
  // il évite d'avoir à mémoriser quelle couleur correspond à quel secteur.
  const resolvedVariant = (sector && SECTOR_VARIANT[sector]) || variant;
  // Construction de la liste des classes BEM
  const classes = [
    'csc-bubble',
    `csc-bubble--${resolvedVariant}`,
    size !== 'md' && `csc-bubble--${size}`,
    tab !== 'none' && `csc-bubble--tab-${tab}`,
    tilt !== 'none' && `csc-bubble--tilt-${tilt}`,
    shadow && 'csc-bubble--shadow',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Component className={classes} spellCheck={false} {...rest}>
      {children}
    </Component>
  );
}
