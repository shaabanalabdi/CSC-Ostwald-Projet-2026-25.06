// ============================================================
// App.jsx — Racine de l'application : routage, providers, lazy-loading
//
// RtlProvider : applique dir="rtl" sur <html> quand la langue est l'arabe.
// AccessibilityProvider : partage les préférences visuelles (police, contraste).
// Toutes les pages sont chargées en lazy (code splitting) pour alléger le bundle initial.
// ============================================================
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
// LazyMotion + m + domAnimation : lazy-loading des features framer-motion.
// Réduit le bundle de ~34KB → ~4.6KB en chargeant uniquement les features
// d'animation DOM utilisées (vs gestures/layout/drag inutilisés ici).
// `m` est le composant feature-less qui hérite des features chargées par LazyMotion.
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@api/queryClient';
import { AccessibilityProvider } from '@stores/accessibilityStore';
import Layout from '@components/layout/Layout';
import AdminLayout from '@components/layout/AdminLayout';
import ScrollToTop from '@components/shared/ScrollToTop';
import ErrorBoundary from '@components/shared/ErrorBoundary';
import ProtectedRoute from '@components/shared/ProtectedRoute';
import useSpotlight from '@hooks/useSpotlight';
// React Query Devtools — chargé en dev uniquement (tree-shaken en prod par Vite).
// Pas de Suspense ici : c'est un module statique, pas un import dynamique.
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools }))
    )
  : null;
// Accueil : import EAGER (pas lazy) — c'est la page d'entrée.
// Lazy + Suspense fallback (PageLoader) faisait que Lighthouse mesurait
// le loader comme LCP candidate, puis ce dernier disparaissait → erreur
// NO_LCP. Eager garantit un Hero title stable dès le premier paint.
import Accueil from '@pages/Accueil';
// Chargement différé des AUTRES pages (code splitting).
// Chaque import() crée un chunk séparé dans le bundle final.
const APropos = lazy(() => import('@pages/APropos'));
const QuiSommesNous = lazy(() => import('@pages/QuiSommesNous'));
const NosPartenaires = lazy(() => import('@pages/NosPartenaires'));
const NosActions = lazy(() => import('@pages/NosActions'));
const Famille = lazy(() => import('@pages/Famille'));
const Jeunesse = lazy(() => import('@pages/Jeunesse'));
const Projets = lazy(() => import('@pages/Projets'));
const Contact = lazy(() => import('@pages/Contact'));
const InscriptionBenevolePage = lazy(() => import('@pages/InscriptionBenevolePage'));
const InscriptionJeunesse = lazy(() => import('@pages/InscriptionJeunesse'));
const InscriptionConfirmee = lazy(() => import('@pages/InscriptionConfirmee'));
const ProjetSocial = lazy(() => import('@pages/ProjetSocial'));
const DocumentsATelecharger = lazy(() => import('@pages/DocumentsATelecharger'));
const MentionsLegales = lazy(() => import('@pages/MentionsLegales'));
const PolitiqueConfidentialite = lazy(() => import('@pages/PolitiqueConfidentialite'));
const NotFound = lazy(() => import('@pages/NotFound'));
// Admin (outil interne, gardé hors du Layout public — pas de Navbar/Footer).
const AdminLogin = lazy(() => import('@pages/AdminLogin'));
const AdminForgotPassword = lazy(() => import('@pages/AdminForgotPassword'));
const AdminResetPassword = lazy(() => import('@pages/AdminResetPassword'));
const AdminDashboard = lazy(() => import('@pages/AdminDashboard'));
const AdminMessages = lazy(() => import('@pages/AdminMessages'));
const AdminBenevole = lazy(() => import('@pages/AdminBenevole'));
const AdminNewsletter = lazy(() => import('@pages/AdminNewsletter'));
const AdminActivities = lazy(() => import('@pages/AdminActivities'));
const AdminActivityEdit = lazy(() => import('@pages/AdminActivityEdit'));
const AdminEvents = lazy(() => import('@pages/AdminEvents'));
const AdminEventEdit = lazy(() => import('@pages/AdminEventEdit'));
const AdminTeam = lazy(() => import('@pages/AdminTeam'));
const AdminTeamEdit = lazy(() => import('@pages/AdminTeamEdit'));
const AdminPartners = lazy(() => import('@pages/AdminPartners'));
const AdminPartnerEdit = lazy(() => import('@pages/AdminPartnerEdit'));
const AdminRegistrations = lazy(() => import('@pages/AdminRegistrations'));
const AdminProjetSocial = lazy(() => import('@pages/AdminProjetSocial'));
const AdminProjetSocialEdit = lazy(() => import('@pages/AdminProjetSocialEdit'));
const AdminNews = lazy(() => import('@pages/AdminNews'));
const AdminNewsEdit = lazy(() => import('@pages/AdminNewsEdit'));
const AdminHero = lazy(() => import('@pages/AdminHero'));
const AdminHeroEdit = lazy(() => import('@pages/AdminHeroEdit'));
const AdminProgrammeMensuel = lazy(() => import('@pages/AdminProgrammeMensuel'));
const AdminContactSettings = lazy(() => import('@pages/AdminContactSettings'));
// Loader affiché par Suspense pendant le chargement d'une page lazy.
// 3 bubbles colorées (orange/bleu/vert — charte CSC) qui pulsent en cascade.
// Identité signature CSC Ostwald vs spinner générique.
function PageLoader() {
  return (
    <div
      className="page-loader"
      role="status"
      aria-live="polite"
      aria-label="Chargement de la page"
    >
      <div className="page-loader__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="page-loader__label">Chargement…</p>
    </div>
  );
}
// Applique l'attribut dir="rtl" ou "ltr" sur <html> selon la langue active.
// Nécessaire pour que les styles CSS RTL s'appliquent correctement (ex: arabe).
function RtlProvider({ children }) {
  const { i18n } = useTranslation();
  useEffect(() => {
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir; // modifie la direction du texte
    document.documentElement.lang = i18n.language; // met à jour l'attribut lang pour les lecteurs d'écran
  }, [i18n.language]); // se réexécute uniquement quand la langue change
  return <>{children}</>;
}
// Wrapper qui anime les transitions entre routes via AnimatePresence.
// Doit être un enfant de BrowserRouter pour utiliser useLocation().
// Respecte prefers-reduced-motion : si activé, pas d'animation visible.
function AnimatedRoutes() {
  const location = useLocation();
  useReducedMotion();
  // Variants framer-motion — typés explicitement pour que TS valide les
  // valeurs (initial/animate/exit) et la transition.
  const pageVariants = { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } };
  return (
    // initial={false} : skip l'animation au PREMIER mount uniquement.
    // Sans cela, toutes les pages démarrent à opacity:0 puis fadent en JS,
    // ce qui empêche Lighthouse de mesurer LCP (erreur NO_LCP).
    // Les transitions ENTRE routes restent animées (key=pathname change).
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={{ duration: 0 }}
        // `position: relative` est requis par framer-motion `useScroll({ target })`
        // (ex: useParallax dans Hero) — sans ça, le hook ne trouve pas un
        // ancêtre positionné et émet le warning « scroll offset calculated incorrectly ».
        // minHeight: 100vh évite le layout shift pendant la transition de route.
        style={{ minHeight: '100vh', position: 'relative' }}
      >
        <Routes location={location}>
          {/* Layout : toutes les routes enfants partagent Navbar + Footer */}
          <Route element={<Layout />}>
            <Route path="/" element={<Accueil />} />

            {/* Section "À Propos" avec 4 sous-pages */}
            <Route path="/a-propos" element={<APropos />}>
              <Route index element={<Navigate to="qui-sommes-nous" replace />} />
              <Route path="qui-sommes-nous" element={<QuiSommesNous />} />
              <Route path="nos-partenaires" element={<NosPartenaires />} />
              <Route path="projet-social" element={<ProjetSocial />} />
              <Route path="documents-a-telecharger" element={<DocumentsATelecharger />} />
            </Route>

            <Route path="/nos-actions" element={<NosActions />} />
            <Route path="/famille" element={<Famille />} />
            <Route path="/jeunesse" element={<Jeunesse />} />
            <Route path="/projets" element={<Projets />} />
            <Route path="/contact" element={<Contact />} />

            <Route path="/inscription-benevole" element={<InscriptionBenevolePage />} />
            <Route path="/inscription-jeunesse" element={<InscriptionJeunesse />} />
            <Route path="/jeunesse/inscription-confirmee" element={<InscriptionConfirmee />} />

            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/politique-de-confidentialite" element={<PolitiqueConfidentialite />} />
          </Route>

          {/* ── Admin (Navbar + Footer via AdminLayout) ──────────
            `/admin/login` reste hors layout : page d'entrée publique
            avant authentification, on n'affiche ni Navbar ni Footer
            tant que l'admin n'est pas connecté(e). Tout le reste
            passe par AdminLayout, enveloppé UNE FOIS par ProtectedRoute
            (qui rend <Outlet/> pour les routes enfants quand il n'a
            pas de children). */}
          <Route path="/admin">
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="login" element={<AdminLogin />} />
            <Route path="forgot-password" element={<AdminForgotPassword />} />
            <Route path="reset-password" element={<AdminResetPassword />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="messages" element={<AdminMessages />} />
                <Route path="benevole" element={<AdminBenevole />} />
                <Route path="newsletter" element={<AdminNewsletter />} />
                <Route path="activities" element={<AdminActivities />} />
                <Route path="activities/new" element={<AdminActivityEdit />} />
                <Route path="activities/:id/edit" element={<AdminActivityEdit />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="events/new" element={<AdminEventEdit />} />
                <Route path="events/:id/edit" element={<AdminEventEdit />} />
                <Route path="team" element={<AdminTeam />} />
                <Route path="team/new" element={<AdminTeamEdit />} />
                <Route path="team/:id/edit" element={<AdminTeamEdit />} />
                <Route path="partners" element={<AdminPartners />} />
                <Route path="partners/new" element={<AdminPartnerEdit />} />
                <Route path="partners/:id/edit" element={<AdminPartnerEdit />} />
                <Route path="registrations" element={<AdminRegistrations />} />
                <Route path="projet-social" element={<AdminProjetSocial />} />
                <Route path="projet-social/new" element={<AdminProjetSocialEdit />} />
                <Route path="projet-social/:id/edit" element={<AdminProjetSocialEdit />} />
                <Route path="news" element={<AdminNews />} />
                <Route path="news/new" element={<AdminNewsEdit />} />
                <Route path="news/:id/edit" element={<AdminNewsEdit />} />
                <Route path="hero" element={<AdminHero />} />
                <Route path="hero/new" element={<AdminHeroEdit />} />
                <Route path="hero/:id/edit" element={<AdminHeroEdit />} />
                <Route path="programme-mensuel" element={<AdminProgrammeMensuel />} />
                <Route path="contact-settings" element={<AdminContactSettings />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </m.div>
    </AnimatePresence>
  );
}
export default function App() {
  // Active l'effet spotlight global (1 listener pour toutes les .spotlight-card).
  useSpotlight();
  return (
    // QueryClientProvider doit englober tout consommateur de useQuery/useMutation
    // (forms newsletter/contact/bénévole, et plus tard les fetch d'événements).
    <QueryClientProvider client={queryClient}>
      {/* LazyMotion wrap toute l'app : les features d'animation DOM sont
            chargées une seule fois, partagées par tous les composants <m.X>.
            Sans `strict` : tolère les imports legacy mais le bundle bénéficie
            déjà fortement de l'usage généralisé de `m.X` à la place de `motion.X`. */}
      <LazyMotion features={domAnimation}>
        <RtlProvider>
          <AccessibilityProvider>
            {/* basename = base public path Vite (import.meta.env.BASE_URL).
                `/` en dev/Vercel, `/<repo>/` sur GitHub Pages — garde les
                liens internes corrects quel que soit l'hébergement. */}
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <ScrollToTop />
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <AnimatedRoutes />
                </Suspense>
              </ErrorBoundary>
            </BrowserRouter>
          </AccessibilityProvider>
        </RtlProvider>
      </LazyMotion>
      {/* Devtools en dev uniquement — fallback null + initialIsOpen false (UI fermée au start) */}
      {ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
