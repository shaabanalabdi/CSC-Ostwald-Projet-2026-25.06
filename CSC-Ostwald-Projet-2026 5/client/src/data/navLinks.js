// ============================================================
// navLinks.js — Liste des liens de navigation (Navbar + Footer)
// ============================================================
const navLinks = [
  // Lien simple vers la page d'accueil
  { labelKey: 'nav.accueil', to: '/' },
  // Entrée avec sous-menu : À Propos contient 3 sous-pages
  {
    labelKey: 'nav.aPropos',
    to: '/a-propos',
    children: [
      { labelKey: 'nav.quiSommesNous', to: '/a-propos/qui-sommes-nous' },
      { labelKey: 'nav.nosPartenaires', to: '/a-propos/nos-partenaires' },
      { labelKey: 'nav.projetSocial', to: '/a-propos/projet-social' },
      { labelKey: 'nav.documentsATelecharger', to: '/a-propos/documents-a-telecharger' },
    ],
  },
  // Pages principales dans l'ordre de la navbar
  { labelKey: 'nav.activites', to: '/nos-actions' },
  { labelKey: 'nav.famille', to: '/famille' },
  { labelKey: 'nav.jeunesse', to: '/jeunesse' },
  { labelKey: 'nav.projets', to: '/projets' },
  { labelKey: 'nav.contact', to: '/contact' },
  // Bouton "Faire un don" — lien externe vers HelloAsso
  // external: true → rendu comme <a target="_blank"> dans Navbar.jsx
  // TODO: remplacer '#' par le vrai lien HelloAsso quand disponible
  { labelKey: 'nav.don', to: '#', external: true },
];
export default navLinks;
