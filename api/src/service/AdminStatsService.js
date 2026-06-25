// ============================================================
// AdminStatsService.js — comptages agrégés pour le dashboard admin.
//
// Un COUNT(*) par métrique, lancés en parallèle via Promise.all afin que
// le temps de réponse total soit borné par la requête unique la plus
// lente (~1 ms chacune sur les tables de la taille du CSC). La forme
// renvoyée reflète 1-pour-1 ce qu'attend la grille StatCard du frontend.
//
// Pourquoi pas un seul UNION ? Chaque table a une forme différente et une
// clause WHERE différente ; les combiner en une seule requête imposerait
// soit des bidouilles GROUP BY, soit une vue dénormalisée, ni l'une ni
// l'autre plus propre que les lectures parallèles faites ici.
// ============================================================

import { pool } from '../config/database.js';

/** Exécute un comptage paramétré, renvoie le nombre unique. */
async function countOne(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return Number(rows[0]?.c ?? 0);
}

/**
 * Extrait une valeur de compteur unique d'un résultat
 * `Promise.allSettled`. Les échecs (hoquet DB, table manquante, …)
 * deviennent `null` afin que le dashboard affiche un espace réservé pour
 * cette métrique au lieu de renvoyer un 500 sur toute la réponse. On
 * journalise aussi le rejet pour qu'il ne soit pas avalé silencieusement.
 */
function pickCounter(settled, label) {
  if (settled.status === 'fulfilled') return settled.value;
  console.error(
    `[admin-stats] failed to count ${label}:`,
    settled.reason?.message ?? settled.reason,
  );
  return null;
}

/** TTL du cache du snapshot. 60 s est assez court pour qu'un admin qui
 *  vient d'agir sur un message voie le nouveau compte après un
 *  rafraîchissement, et assez long pour que les dashboards à
 *  rafraîchissement automatique ne martèlent pas la DB. */
const SNAPSHOT_TTL_MS = 60 * 1000;

class AdminStatsService {
  /** @private */
  _snapshotCache = { value: null, expiresAt: 0 };

  /**
   * Instantané de « ce qui demande attention » + « ce qui est publié »
   * dans tous les domaines. Mis en cache 60 s — 21 COUNT(*) par
   * chargement de dashboard, c'est peu coûteux, mais plusieurs admins
   * rafraîchissant le même dashboard chaque minute finiraient par
   * s'accumuler. Le cache s'invalide naturellement après une minute ;
   * un admin qui a besoin d'un rafraîchissement immédiat peut attendre
   * ou recharger la page.
   */
  getSnapshot = async () => {
    const now = Date.now();
    if (this._snapshotCache.value && this._snapshotCache.expiresAt > now) {
      return this._snapshotCache.value;
    }
    const value = await this._computeSnapshot();
    this._snapshotCache = { value, expiresAt: now + SNAPSHOT_TTL_MS };
    return value;
  };

  /** Force une lecture fraîche au prochain appel de `getSnapshot`. À
   *  brancher sur les chemins d'écriture si un rafraîchissement synchrone
   *  devient nécessaire après les mutations admin (ex. mark-as-read
   *  devrait incrémenter le compte des non-lus). */
  invalidateSnapshot = () => {
    this._snapshotCache = { value: null, expiresAt: 0 };
  };

  /** @private */
  _computeSnapshot = async () => {
    // `Promise.allSettled` au lieu de `Promise.all` — un seul COUNT(*) en
    // échec (table manquante pendant une migration, hoquet DB transitoire,
    // …) ferait sinon exploser tout le dashboard. On collecte ce qui a
    // réussi et on expose `null` pour le reste ; le frontend affiche « — »
    // pour les compteurs null.
    const results = await Promise.allSettled([
      countOne('SELECT COUNT(*) AS c FROM message'),
      countOne('SELECT COUNT(*) AS c FROM message WHERE is_read = 0'),
      countOne('SELECT COUNT(*) AS c FROM benevole_application'),
      countOne("SELECT COUNT(*) AS c FROM benevole_application WHERE status = 'new'"),
      countOne('SELECT COUNT(*) AS c FROM newsletter_subscriber'),
      countOne('SELECT COUNT(*) AS c FROM newsletter_subscriber WHERE is_confirmed = 1'),
      countOne('SELECT COUNT(*) AS c FROM registration'),
      countOne("SELECT COUNT(*) AS c FROM registration WHERE status = 'paid'"),
      countOne("SELECT COUNT(*) AS c FROM registration WHERE status = 'pending'"),
      countOne('SELECT COUNT(*) AS c FROM activity'),
      countOne('SELECT COUNT(*) AS c FROM activity WHERE is_published = 1'),
      countOne('SELECT COUNT(*) AS c FROM event'),
      countOne('SELECT COUNT(*) AS c FROM event WHERE date_event >= NOW() AND show_in_agenda = 1'),
      countOne('SELECT COUNT(*) AS c FROM team_member'),
      countOne('SELECT COUNT(*) AS c FROM partner'),
      countOne('SELECT COUNT(*) AS c FROM projet_social_document'),
      countOne('SELECT COUNT(*) AS c FROM projet_social_document WHERE is_published = 1'),
      countOne('SELECT COUNT(*) AS c FROM news'),
      countOne('SELECT COUNT(*) AS c FROM news WHERE is_published = 1'),
      countOne('SELECT COUNT(*) AS c FROM hero_slide'),
      countOne('SELECT COUNT(*) AS c FROM hero_slide WHERE is_published = 1'),
    ]);

    const [
      messagesTotal,
      messagesUnread,
      benevoleTotal,
      benevoleNew,
      newsletterTotal,
      newsletterConfirmed,
      registrationsTotal,
      registrationsPaid,
      registrationsPending,
      activitiesTotal,
      activitiesPublished,
      eventsTotal,
      eventsUpcoming,
      teamTotal,
      partnersTotal,
      projetSocialTotal,
      projetSocialPublished,
      newsTotal,
      newsPublished,
      heroTotal,
      heroPublished,
    ] = [
      pickCounter(results[0], 'messages.total'),
      pickCounter(results[1], 'messages.unread'),
      pickCounter(results[2], 'benevole.total'),
      pickCounter(results[3], 'benevole.new'),
      pickCounter(results[4], 'newsletter.total'),
      pickCounter(results[5], 'newsletter.confirmed'),
      pickCounter(results[6], 'registrations.total'),
      pickCounter(results[7], 'registrations.paid'),
      pickCounter(results[8], 'registrations.pending'),
      pickCounter(results[9], 'activities.total'),
      pickCounter(results[10], 'activities.published'),
      pickCounter(results[11], 'events.total'),
      pickCounter(results[12], 'events.upcoming'),
      pickCounter(results[13], 'team.total'),
      pickCounter(results[14], 'partners.total'),
      pickCounter(results[15], 'projetSocial.total'),
      pickCounter(results[16], 'projetSocial.published'),
      pickCounter(results[17], 'news.total'),
      pickCounter(results[18], 'news.published'),
      pickCounter(results[19], 'hero.total'),
      pickCounter(results[20], 'hero.published'),
    ];

    return {
      messages: { total: messagesTotal, unread: messagesUnread },
      benevole: { total: benevoleTotal, new: benevoleNew },
      newsletter: { total: newsletterTotal, confirmed: newsletterConfirmed },
      registrations: {
        total: registrationsTotal,
        paid: registrationsPaid,
        pending: registrationsPending,
      },
      activities: { total: activitiesTotal, published: activitiesPublished },
      events: { total: eventsTotal, upcoming: eventsUpcoming },
      team: { total: teamTotal },
      partners: { total: partnersTotal },
      projetSocial: { total: projetSocialTotal, published: projetSocialPublished },
      news: { total: newsTotal, published: newsPublished },
      hero: { total: heroTotal, published: heroPublished },
    };
  };
}

export const adminStatsService = new AdminStatsService();
