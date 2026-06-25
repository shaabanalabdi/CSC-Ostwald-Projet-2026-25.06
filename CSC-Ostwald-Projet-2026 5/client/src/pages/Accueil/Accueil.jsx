// ============================================================
// Accueil.jsx — Page d'accueil du site CSC Ostwald
//
// Compose plusieurs sections dans l'ordre :
//   1. Hero         → carrousel vidéo plein écran
//   2. InfoPratiques → horaires, adresse, transports
//   3. AgendaEvenements → prochains événements depuis /api/events/upcoming
//   4. Actualites   → dernières nouvelles du centre
//   5. Benevole     → appel à devenir bénévole
//
// JSON_LD : données structurées Schema.org injectées dans le <head>
//   → permettent à Google d'afficher les infos du CSC dans les résultats de recherche
// ============================================================
import { useTranslation } from 'react-i18next';
import PageSEO from '@components/layout/PageSEO';
import { Helmet } from 'react-helmet-async';
import Hero from './sections/Hero';
import InfoPratiques from './sections/InfoPratiques';
import AgendaEvenements from './sections/AgendaEvenements';
import Actualites from './sections/Actualites';
import Benevole from './sections/Benevole';
import SectionWave from '@components/ui/SectionWave';
// Données structurées Schema.org de type CivicStructure
// Améliorent le référencement en fournissant des infos standardisées aux moteurs de recherche.
// Typé `const` pour préserver les littéraux exacts (`'CivicStructure'`, etc.)
// dans le JSON.stringify ci-dessous.
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'CivicStructure',
  name: "Centre Social et Culturel d'Ostwald",
  alternateName: 'CSC Ostwald',
  url: import.meta.env.VITE_SITE_URL ?? 'https://csc-ostwald.fr',
  telephone: '+33978809629',
  email: 'contact@csc-ostwald.fr',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '1, place de la Bruyère',
    addressLocality: 'Ostwald',
    postalCode: '67540',
    addressCountry: 'FR',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:30',
      closes: '17:00',
    },
  ],
  sameAs: ['https://www.facebook.com/cscostwald/', 'https://www.instagram.com/csc_ostwald'],
};
export default function Accueil() {
  const { t } = useTranslation();
  return (
    <>
      {/* Balises SEO : title et meta description pour cette page */}
      <PageSEO title={t('accueil.pageTitle')} description={t('accueil.metaDesc')} url="/" />
      {/* Injection du JSON-LD dans le <head> pour Google */}
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(JSON_LD)}</script>
      </Helmet>

      {/* Layout.tsx owns the single <main> landmark — pages contribute
            their sections inside it (no nested <main> allowed). */}
      <Hero />
      {/* Transition cinématique : vague animée qui adoucit le passage
            du Hero (warm orange) à la section InfoPratiques (blanc). */}
      <SectionWave from="transparent" to="#ffffff" height={70} />
      <InfoPratiques />
      <AgendaEvenements />
      <Actualites />
      <Benevole />
    </>
  );
}
