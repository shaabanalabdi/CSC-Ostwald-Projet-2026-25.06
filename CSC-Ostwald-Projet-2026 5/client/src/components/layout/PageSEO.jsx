// ============================================================
// PageSEO.jsx — Métadonnées SEO + Open Graph + Twitter Card
//
// À monter dans chaque page (pas dans le layout) pour que les title/meta
// soient mis à jour à chaque changement de route. Utilise react-helmet-async
// (déjà wrapped au niveau App.jsx via <HelmetProvider>).
// ============================================================
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
/** Correspondance code langue i18n → format locale Open Graph. */
const OG_LOCALES = {
  fr: 'fr_FR',
  en: 'en_US',
  ar: 'ar_AR',
  tr: 'tr_TR',
  ru: 'ru_RU',
};
const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://csc-ostwald.fr';
const SITE_NAME = "Centre Social et Culturel d'Ostwald";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;
export default function PageSEO({
  title,
  description = '',
  url = '/',
  image = DEFAULT_IMAGE,
  noindex = false,
}) {
  const { i18n } = useTranslation();
  // Locale OG selon la langue active (fr → fr_FR, ar → ar_AR, etc.).
  // i18n.language est string — fallback si une langue exotique apparaît.
  const ogLocale = OG_LOCALES[i18n.language] ?? 'fr_FR';
  const canonical = `${SITE_URL}${url}`;
  return (
    <Helmet>
      {/* ── Base ─────────────────────────────────────────── */}
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      <link rel="canonical" href={canonical} />

      {/* ── Open Graph (Facebook, WhatsApp, LinkedIn) ────── */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={ogLocale} />

      {/* ── Twitter Card ─────────────────────────────────── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
