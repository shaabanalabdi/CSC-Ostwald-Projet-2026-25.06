// ============================================================
// router/index.js — Agrège chaque sous-routeur /api/*.
//
// Garder cette liste courte et explicite est intentionnel : quand un
// nouveau domaine arrive, ajouter UNE ligne ici et la carte des routes
// reste facile à auditer. server.js reste concentré sur la config Express.
// ============================================================

import { Router } from 'express';
import { isDatabaseReachable } from '../config/database.js';
import { NODE_ENV } from '../config/env.js';
import { PAYMENTS_ENABLED } from '../config/helloasso.js';
import { csrfProtection } from '../middleware/csrfProtection.js';
import newsletterRoutes from './routes/newsletter.js';
import contactRoutes from './routes/contact.js';
import benevoleRoutes from './routes/benevole.js';
import authRoutes from './routes/auth.js';
import eventsRoutes from './routes/events.js';
import teamRoutes from './routes/team.js';
import partnersRoutes from './routes/partners.js';
import activitiesRoutes from './routes/activities.js';
import adminMessagesRoutes from './routes/admin-messages.js';
import adminBenevoleRoutes from './routes/admin-benevole.js';
import adminNewsletterRoutes from './routes/admin-newsletter.js';
import adminActivitiesRoutes from './routes/admin-activities.js';
import adminEventsRoutes from './routes/admin-events.js';
import adminTeamRoutes from './routes/admin-team.js';
import adminPartnersRoutes from './routes/admin-partners.js';
import adminRegistrationsRoutes from './routes/admin-registrations.js';
import adminUploadRoutes from './routes/admin-upload.js';
import adminStatsRoutes from './routes/admin-stats.js';
import projetSocialRoutes from './routes/projet-social.js';
import adminProjetSocialRoutes from './routes/admin-projet-social.js';
import newsRoutes from './routes/news.js';
import adminNewsRoutes from './routes/admin-news.js';
import heroRoutes from './routes/hero.js';
import adminHeroRoutes from './routes/admin-hero.js';
import paymentRoutes from './routes/payment.js';
import programmeMensuelRoutes from './routes/programme-mensuel.js';
import adminProgrammeMensuelRoutes from './routes/admin-programme-mensuel.js';
import contactSettingsRoutes from './routes/contact-settings.js';
import adminContactSettingsRoutes from './routes/admin-contact-settings.js';

const apiRouter = Router();

// ─── Système : health check (sans auth, sans écriture DB) ────
// Utilisé par les moniteurs d'uptime et les healthchecks Docker/Render.
// Renvoie 503 quand la DB est injoignable afin que les sondes puissent
// REDÉMARRER ou alerter les opérateurs au lieu de voir un corps « 200 OK »
// prétendant que l'app est cassée — la plupart des moniteurs ne
// regardent que le code de statut.
apiRouter.get('/health', async (req, res) => {
  const dbOk = await isDatabaseReachable();
  const body = {
    status: dbOk ? 'ok' : 'degraded',
    service: 'csc-ostwald-api',
    env: NODE_ENV,
    database: dbOk ? 'reachable' : 'unreachable',
    timestamp: new Date().toISOString(),
  };
  return res.status(dbOk ? 200 : 503).json(body);
});

// ─── Routes de domaine ───────────────────────────────────────
apiRouter.use('/auth', authRoutes);
apiRouter.use('/newsletter', newsletterRoutes);
apiRouter.use('/contact', contactRoutes);
apiRouter.use('/benevole', benevoleRoutes);
apiRouter.use('/events', eventsRoutes);
apiRouter.use('/team', teamRoutes);
apiRouter.use('/partners', partnersRoutes);
apiRouter.use('/activities', activitiesRoutes);
apiRouter.use('/projet-social', projetSocialRoutes);
apiRouter.use('/programme-mensuel', programmeMensuelRoutes);
apiRouter.use('/contact-settings', contactSettingsRoutes);
apiRouter.use('/news', newsRoutes);
apiRouter.use('/hero', heroRoutes);

// Les routes de paiement ne sont montées QUE lorsque la fonctionnalité
// d'inscription payante Jeunesse est active (PAYMENTS_ENABLED). Quand elle
// est désactivée — le site est en ligne avant que le compte HelloAsso ne
// soit prêt — /api/payment/* retombe sur le catch-all 404. Le frontend
// masque alors le parcours d'inscription via VITE_PAYMENTS_ENABLED.
if (PAYMENTS_ENABLED) {
  apiRouter.use('/payment', paymentRoutes);
}

// ─── Admin (chaque sous-route protégée par isAuthenticated + CSRF) ──
// `csrfProtection` monté UNE SEULE FOIS ici couvre chaque sous-route
// /admin/*. C'est un no-op pour GET/HEAD/OPTIONS, donc les listes admin
// en lecture seule continuent de fonctionner sans token ; les mutations
// (POST/PATCH/DELETE) exigent que l'en-tête `X-CSRF-Token` corresponde
// au cookie `csrf_token` posé à la connexion.
apiRouter.use('/admin', csrfProtection);

apiRouter.use('/admin/messages', adminMessagesRoutes);
apiRouter.use('/admin/benevole', adminBenevoleRoutes);
apiRouter.use('/admin/newsletter', adminNewsletterRoutes);
apiRouter.use('/admin/activities', adminActivitiesRoutes);
apiRouter.use('/admin/events', adminEventsRoutes);
apiRouter.use('/admin/team', adminTeamRoutes);
apiRouter.use('/admin/partners', adminPartnersRoutes);
apiRouter.use('/admin/registrations', adminRegistrationsRoutes);
apiRouter.use('/admin/upload', adminUploadRoutes);
apiRouter.use('/admin/stats', adminStatsRoutes);
apiRouter.use('/admin/projet-social', adminProjetSocialRoutes);
apiRouter.use('/admin/programme-mensuel', adminProgrammeMensuelRoutes);
apiRouter.use('/admin/news', adminNewsRoutes);
apiRouter.use('/admin/hero', adminHeroRoutes);
apiRouter.use('/admin/contact-settings', adminContactSettingsRoutes);

export default apiRouter;
