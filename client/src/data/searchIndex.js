// ============================================================
// searchIndex.js — Index global de recherche du site
//
// Liste statique des pages et sections principales. Les événements et
// activités viennent désormais de l'API ; on les n'indexe plus côté
// client pour éviter une donnée doublée qui se désynchroniserait du
// contenu réel. Les entrées génériques ci-dessous couvrent déjà les
// rubriques Famille/Jeunesse/Agenda.
// ============================================================
/**
 * Index statique : pages et sections principales du site.
 * Chaque entrée a un `label` affiché, des `keywords` déclencheurs (normalisés
 * sans accents pour matcher la saisie quel que soit son écriture), et une
 * `to` route cible (peut contenir un hash d'ancre).
 */
const staticIndex = [
  {
    label: 'Accueil',
    keywords: ['accueil', 'home', 'principal', 'bienvenue'],
    to: '/',
  },
  {
    label: 'Agenda des événements',
    keywords: ['agenda', 'événements', 'evenements', 'calendrier', 'planning'],
    to: '/#agenda',
  },
  {
    label: 'Informations pratiques',
    keywords: [
      'informations',
      'pratiques',
      'horaires',
      'adresse',
      'localisation',
      'heures',
      'ouverture',
    ],
    to: '/#apropos',
  },
  {
    label: 'Transports — Tram & Bus',
    keywords: ['tram', 'tramway', 'bus', 'transports', 'wihrel', 'arrêt', 'arret', 'c4'],
    to: '/#apropos',
  },
  {
    label: 'Nos actualités',
    keywords: ['actualites', 'actualités', 'news', 'nouvelles', 'informations'],
    to: '/#actualites',
  },
  {
    label: 'Devenir bénévole',
    keywords: [
      'bénévole',
      'benevole',
      'bénévolat',
      'benevolat',
      'volontaire',
      'engager',
      'engagement',
    ],
    to: '/inscription-benevole',
  },
  {
    label: 'Qui sommes-nous ?',
    keywords: [
      'qui',
      'sommes',
      'nous',
      'equipe',
      'équipe',
      'mission',
      'association',
      'centre',
      'histoire',
    ],
    to: '/a-propos/qui-sommes-nous',
  },
  {
    label: 'Nos partenaires',
    keywords: [
      'partenaires',
      'caf',
      'collectivite',
      'collectivité',
      'région',
      'alsace',
      'financement',
    ],
    to: '/a-propos/nos-partenaires',
  },
  {
    label: 'Documents à télécharger',
    keywords: [
      'documents',
      'telecharger',
      'télécharger',
      'formulaire',
      'cerfa',
      'inscription',
      'sanitaire',
      'fiche',
      'pdf',
      'dossier',
    ],
    to: '/a-propos/documents-a-telecharger',
  },
  {
    label: 'Nos actions régulières',
    keywords: ['actions', 'programmes', 'services', 'activites', 'activités'],
    to: '/a-propos/nos-actions',
  },
  {
    label: 'Ateliers bien-être',
    keywords: [
      'yoga',
      'sophrologie',
      'relaxation',
      'bien-etre',
      'bien-être',
      'atelier',
      'ateliers',
      'sante',
      'santé',
    ],
    to: '/a-propos/nos-actions',
  },
  {
    label: 'Sorties culturelles',
    keywords: [
      'sorties',
      'theatre',
      'théâtre',
      'musee',
      'musée',
      'concert',
      'festival',
      'culture',
      'culturelles',
    ],
    to: '/a-propos/nos-actions',
  },
  {
    label: 'Aide aux démarches numériques',
    keywords: [
      'numerique',
      'numérique',
      'digital',
      'aide',
      'informatique',
      'ordinateur',
      'internet',
      'ameli',
      'impots',
      'impôts',
    ],
    to: '/a-propos/nos-actions',
  },
  {
    label: 'Rencontres intergénérationnelles',
    keywords: [
      'intergenerational',
      'intergénérationnel',
      'seniors',
      'generations',
      'générations',
      'jardinage',
      'cuisine',
    ],
    to: '/a-propos/nos-actions',
  },
  {
    label: 'Famille — activités & ateliers',
    keywords: ['famille', 'familles', 'parents', 'enfants', 'parent', 'enfant', 'familiaux'],
    to: '/famille',
  },
  {
    label: 'Rendez-vous réguliers familles',
    keywords: ['rendez-vous', 'rendez', 'reguliers', 'réguliers', 'hebdo', 'mensuel', 'semaine'],
    to: '/famille',
  },
  {
    label: 'Escapades en famille',
    keywords: ['escapades', 'sortie', 'foret', 'forêt', 'nature', 'decouverte', 'découverte'],
    to: '/famille',
  },
  {
    label: 'Atelier créatif parents-enfants',
    keywords: [
      'creatif',
      'créatif',
      'peinture',
      'argile',
      'collage',
      'dessin',
      'mains',
      'creation',
      'création',
    ],
    to: '/famille',
  },
  {
    label: 'Les fourneaux partagés — cuisine',
    keywords: ['cuisine', 'fourneaux', 'recettes', 'repas', 'cuisinier', 'cuisiner'],
    to: '/famille',
  },
  {
    label: 'Café des parents',
    keywords: ['cafe', 'café', 'parents', 'echange', 'échange', 'discussion', 'detente', 'détente'],
    to: '/famille',
  },
  {
    label: 'Jeunesse — projets & idées',
    keywords: [
      'jeunesse',
      'jeune',
      'jeunes',
      'ados',
      'adolescents',
      'projet',
      'projets',
      'idee',
      'idée',
    ],
    to: '/jeunesse',
  },
  {
    label: 'Lancer un projet jeune',
    keywords: ['lancer', 'demarrer', 'démarrer', 'commencer', 'initiative', 'creer', 'créer'],
    to: '/jeunesse',
  },
  {
    label: 'Sport — tournoi foot & basket',
    keywords: ['sport', 'foot', 'football', 'basket', 'tournoi', 'sportif'],
    to: '/jeunesse',
  },
  {
    label: 'Podcast & YouTube au centre',
    keywords: [
      'youtube',
      'podcast',
      'video',
      'vidéo',
      'chaine',
      'chaîne',
      'digital',
      'media',
      'média',
    ],
    to: '/jeunesse',
  },
  {
    label: 'Projets du centre',
    keywords: ['projets', 'initiatives', 'locales', 'territoire'],
    to: '/projets',
  },
  {
    label: 'Inscription — nous contacter',
    keywords: [
      'inscription',
      'inscrire',
      "s'inscrire",
      'enregistrement',
      'reserver',
      'réserver',
      'participer',
      'contact',
      'contacter',
    ],
    to: '/contact',
  },
  {
    label: 'Contact — téléphone & email',
    keywords: [
      'contact',
      'telephone',
      'téléphone',
      'email',
      'mail',
      'joindre',
      'appeler',
      'ecrire',
      'écrire',
      'message',
    ],
    to: '/contact',
  },
  {
    label: 'Politique de confidentialité',
    keywords: [
      'rgpd',
      'confidentialite',
      'confidentialité',
      'donnees',
      'données',
      'vie privee',
      'privée',
      'cookies',
      'cnil',
      'consentement',
    ],
    to: '/politique-de-confidentialite',
  },
  {
    label: 'Mentions légales',
    keywords: ['mentions', 'legales', 'légales', 'editeur', 'éditeur', 'hebergeur', 'hébergeur'],
    to: '/mentions-legales',
  },
];
const searchIndex = staticIndex;
export default searchIndex;
