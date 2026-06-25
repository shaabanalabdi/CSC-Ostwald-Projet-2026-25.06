// ============================================================
// AdminDashboard.jsx — Accueil admin (/admin/dashboard).
//
// Trois régions :
//   1. Rangée KPI — compteurs en un coup d'œil depuis /api/admin/stats.
//   2. Boîte de réception — modules avec soumissions entrantes (messages,
//                   bénévoles, newsletter, inscriptions). Chaque carte
//                   fait apparaître un badge « en attente » quand des
//                   éléments demandent attention pour que l'admin voie la
//                   charge de travail d'un coup d'œil.
//   3. Contenus   — modules CRUD de la surface publiée (activités,
//                   événements, équipe, partenaires).
// ============================================================
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  FaEnvelope,
  FaHandsHelping,
  FaUsers,
  FaCreditCard,
  FaCalendarAlt,
  FaSitemap,
  FaUserFriends,
  FaHandshake,
  FaFilePdf,
  FaNewspaper,
  FaHeading,
  FaArrowRight,
  FaAddressCard,
} from 'react-icons/fa';
import { useMe, useLogout } from '@features/auth';
import { useAdminStats } from '@features/admin-stats';
import PageSEO from '@components/layout/PageSEO';
import Skeleton from '@components/ui/Skeleton';
import './AdminDashboard.scss';
// Une carte KPI = un compteur cliquable. `accent` fixe la couleur de marque
// (orange / vert / bleu / rose) ; `urgent` intensifie l'icône (pastille pleine)
// quand le compteur réclame une action ; `loading` affiche un skeleton.
function KpiCard({
  value,
  label,
  sub,
  accent = 'blue',
  urgent = false,
  loading = false,
  icon,
  to,
}) {
  const className = [
    'admin-dashboard__kpi',
    `admin-dashboard__kpi--accent-${accent}`,
    urgent && 'admin-dashboard__kpi--urgent',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Link to={to} className={className}>
      <span className="admin-dashboard__kpi-icon" aria-hidden="true">
        {icon}
      </span>
      {loading ? (
        <Skeleton shape="text" width={64} height={30} className="admin-dashboard__kpi-skeleton" />
      ) : (
        <span className="admin-dashboard__kpi-value">{value}</span>
      )}
      <span className="admin-dashboard__kpi-label">{label}</span>
      {sub && !loading && <span className="admin-dashboard__kpi-sub">{sub}</span>}
    </Link>
  );
}
function ModuleCard({ to, title, description, icon, badge, meta, accent = 'blue' }) {
  return (
    <Link to={to} className={`admin-dashboard__module admin-dashboard__module--accent-${accent}`}>
      <span className="admin-dashboard__module-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="admin-dashboard__module-body">
        <h3 className="admin-dashboard__module-title">
          {title}
          {typeof badge === 'number' && badge > 0 && (
            <span className="admin-dashboard__module-badge" aria-label={`${badge} en attente`}>
              {badge}
            </span>
          )}
        </h3>
        <p className="admin-dashboard__module-desc">{description}</p>
        {meta && <p className="admin-dashboard__module-meta">{meta}</p>}
      </div>
      <FaArrowRight className="admin-dashboard__module-chevron" aria-hidden="true" />
    </Link>
  );
}
/**
 * Heuristique : tout compte en attente non nul dans une catégorie
 * « boîte de réception » signifie que l'admin doit y prêter attention.
 * Augmenter le seuil si le badge devient trop bruyant pour l'équipe du CSC.
 */
function isUrgent(n) {
  return typeof n === 'number' && n > 0;
}
export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useMe();
  const logoutMutation = useLogout();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Même si l'appel serveur échoue, on vide l'état local et on
      // redirige — le cookie est peut-être déjà invalide, ce qui est
      // exactement le moment où la déconnexion compte le plus.
    }
    queryClient.removeQueries({ queryKey: ['auth', 'me'] });
    navigate('/admin/login', { replace: true });
  };
  return (
    <>
      <PageSEO
        title="Dashboard admin — CSC Ostwald"
        description="Espace d'administration"
        url="/admin/dashboard"
      />
      <div className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">CSC Ostwald · Administration</p>
            <h1 className="admin-dashboard__title">
              Bonjour{user ? `, ${user.email.split('@')[0]}` : ''}
            </h1>
            {user && (
              <p className="admin-dashboard__welcome">
                <span className="admin-dashboard__role">{user.role}</span>
                <span className="admin-dashboard__sep" aria-hidden="true">
                  •
                </span>
                {user.email}
              </p>
            )}
          </div>
          <button
            type="button"
            className="admin-dashboard__logout"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </header>

        {/* ── KPI ROW ─────────────────────────────────────────── */}
        <section className="admin-dashboard__kpis" aria-label="Statistiques clés">
          <KpiCard
            to="/admin/messages"
            icon={<FaEnvelope />}
            value={stats?.messages.unread ?? 0}
            label="Messages non lus"
            sub={stats && `sur ${stats.messages.total} reçus`}
            accent="orange"
            urgent={isUrgent(stats?.messages.unread)}
            loading={statsLoading}
          />
          <KpiCard
            to="/admin/benevole"
            icon={<FaHandsHelping />}
            value={stats?.benevole.new ?? 0}
            label="Candidatures nouvelles"
            sub={stats && `sur ${stats.benevole.total} reçues`}
            accent="green"
            urgent={isUrgent(stats?.benevole.new)}
            loading={statsLoading}
          />
          <KpiCard
            to="/admin/newsletter"
            icon={<FaUsers />}
            value={stats?.newsletter.confirmed ?? 0}
            label="Abonnés confirmés"
            sub={stats && `sur ${stats.newsletter.total} inscrits`}
            accent="blue"
            loading={statsLoading}
          />
          <KpiCard
            to="/admin/registrations"
            icon={<FaCreditCard />}
            value={stats?.registrations.pending ?? 0}
            label="Inscriptions en attente"
            sub={stats && `${stats.registrations.paid} payées au total`}
            accent="pink"
            urgent={isUrgent(stats?.registrations.pending)}
            loading={statsLoading}
          />
        </section>

        {/* ── INBOX ───────────────────────────────────────────── */}
        <section className="admin-dashboard__section">
          <h2 className="admin-dashboard__section-title admin-dashboard__section-title--orange">
            Boîte de réception
          </h2>
          <p className="admin-dashboard__section-desc">
            Demandes entrantes à traiter — messages, candidatures, abonnements, inscriptions.
          </p>
          <div className="admin-dashboard__modules">
            <ModuleCard
              to="/admin/messages"
              icon={<FaEnvelope />}
              title="Messages reçus"
              description="Formulaire de contact — lecture, marquer comme lu, archivage."
              badge={stats?.messages.unread}
              accent="orange"
            />
            <ModuleCard
              to="/admin/benevole"
              icon={<FaHandsHelping />}
              title="Candidatures bénévoles"
              description="Suivi des candidatures (nouveau / contacté / refusé)."
              badge={stats?.benevole.new}
              accent="green"
            />
            <ModuleCard
              to="/admin/newsletter"
              icon={<FaUsers />}
              title="Abonnés newsletter"
              description="Liste, copie d'emails confirmés, suppression RGPD."
              meta={
                stats &&
                `${stats.newsletter.confirmed} confirmés / ${stats.newsletter.total} inscrits`
              }
              accent="blue"
            />
            <ModuleCard
              to="/admin/registrations"
              icon={<FaCreditCard />}
              title="Inscriptions Jeunesse"
              description="Paiements HelloAsso — statut, montant, transaction."
              badge={stats?.registrations.pending}
              meta={stats && `${stats.registrations.paid} payées au total`}
              accent="pink"
            />
          </div>
        </section>

        {/* ── PUBLIC CONTENT ──────────────────────────────────── */}
        <section className="admin-dashboard__section">
          <h2 className="admin-dashboard__section-title admin-dashboard__section-title--green">
            Contenus publiés
          </h2>
          <p className="admin-dashboard__section-desc">
            Les éléments visibles sur le site public — activités, agenda, équipe, partenaires.
          </p>
          <div className="admin-dashboard__modules">
            <ModuleCard
              to="/admin/activities"
              icon={<FaSitemap />}
              title="Activités"
              description="Famille, Jeunesse, Régulière. Filtres + publication."
              meta={
                stats &&
                `${stats.activities.published} publiées / ${stats.activities.total} totales`
              }
              accent="orange"
            />
            <ModuleCard
              to="/admin/events"
              icon={<FaCalendarAlt />}
              title="Événements"
              description="Agenda daté — distinct des activités récurrentes."
              meta={stats && `${stats.events.upcoming} à venir / ${stats.events.total} totaux`}
              accent="green"
            />
            <ModuleCard
              to="/admin/team"
              icon={<FaUserFriends />}
              title="Équipe"
              description="Membres affichés sur « Qui sommes-nous »."
              meta={stats && `${stats.team.total} membres`}
              accent="blue"
            />
            <ModuleCard
              to="/admin/partners"
              icon={<FaHandshake />}
              title="Partenaires"
              description="Institutionnels + associatifs — logos publics."
              meta={stats && `${stats.partners.total} partenaires`}
              accent="pink"
            />
            <ModuleCard
              to="/admin/projet-social"
              icon={<FaFilePdf />}
              title="Documents Projet Social"
              description="PDF téléchargeables — dossier d'inscription, CERFA, rapports…"
              meta={
                stats &&
                `${stats.projetSocial.published} publiés / ${stats.projetSocial.total} totaux`
              }
              accent="orange"
            />
            <ModuleCard
              to="/admin/news"
              icon={<FaNewspaper />}
              title="Nos actualités"
              description="Cartes affichées en page d'accueil — ajout, édition, brouillon."
              meta={stats && `${stats.news.published} publiées / ${stats.news.total} totales`}
              accent="green"
            />
            <ModuleCard
              to="/admin/hero"
              icon={<FaHeading />}
              title="Bannière d'accueil"
              description="Slides du carrousel Hero — titre, sous-titre, ordre d'affichage."
              meta={stats && `${stats.hero.published} publiées / ${stats.hero.total} totales`}
              accent="blue"
            />
            <ModuleCard
              to="/admin/contact-settings"
              icon={<FaAddressCard />}
              title="Paramètres de contact"
              description="Téléphone, adresse, emails par service — affichés sur la page Contact."
              accent="green"
            />
          </div>
        </section>
      </div>
    </>
  );
}
