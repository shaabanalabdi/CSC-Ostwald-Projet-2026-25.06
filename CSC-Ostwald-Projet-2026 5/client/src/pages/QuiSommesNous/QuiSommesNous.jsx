// ============================================================
// QuiSommesNous.jsx — Sous-page "Qui sommes-nous" (/a-propos/qui-sommes-nous).
//
// Phase 17 — la liste de l'équipe est désormais récupérée depuis
// l'API (/api/team). Avant ça, c'était un tableau codé en dur.
// L'admin peut modifier les membres via /admin/team sans toucher au
// code, et les changements apparaissent ici dès le prochain refetch.
//
// Le Conseil d'Administration reste codé en dur : pas (encore) de
// table `council_member` en base, et la liste change à chaque AG —
// la mise à jour manuelle annuelle reste acceptable. À sortir en
// table dédiée le jour où le CA voudra l'éditer lui-même.
// ============================================================
import PageSEO from '@components/layout/PageSEO';
import SectionTitle from '@components/ui/SectionTitle';
import { useTranslation, Trans } from 'react-i18next';
import imgBuilding from '@assets/images/CSC-centre-culturel-Ostwald.webp';
import carteReseau from '@assets/images/reseau-resau-csc.png';
import { usePublicTeam } from '@features/team';
import { isApiError, resolveStaticUrl } from '@api/client';
import Skeleton from '@components/ui/Skeleton';
import './QuiSommesNous.scss';
import { FaHandshake, FaClipboardList, FaPalette, FaUsers, FaLink } from 'react-icons/fa';

const csfLinks = [
  // Territoire Alsace Nord
  { label: 'CSF Bischwiller', href: 'https://www.csf.asso.fr', top: '17%', left: '57%' },
  { label: 'CSF Oberhoffen-sur-Moder', href: 'https://www.csf.asso.fr', top: '22%', left: '73%' },
  { label: 'CSF Zinswiller', href: 'https://www.csf.asso.fr', top: '14%', left: '90%' },
  // Territoire Alsace Ouest
  { label: 'CSF Monswiller', href: 'https://www.csf.asso.fr', top: '58%', left: '9%' },
  { label: 'CSF Steinbourg', href: 'https://www.csf.asso.fr', top: '58%', left: '23%' },
  // Territoire Alsace Centre
  { label: 'CSF Molsheim', href: 'https://www.csf.asso.fr', top: '91%', left: '9%' },
  { label: 'CSF Dambach-La-Ville', href: 'https://www.csf.asso.fr', top: '91%', left: '25%' },
  // Territoire Eurométropole de Strasbourg
  { label: 'CSF EMS', href: 'https://www.csf.asso.fr', top: '96%', left: '50%' },
  { label: 'CSF Elsau', href: 'https://www.csf.asso.fr', top: '96%', left: '62%' },
  { label: 'CSF Neuhof Ouest', href: 'https://www.csf.asso.fr', top: '96%', left: '76%' },
  { label: 'CSF Ostwald', href: 'https://csc-ostwald.fr', top: '96%', left: '92%' },
];
// Membres du Conseil d'Administration — mis à jour manuellement chaque AG
const conseil = [
  { num: 1, fonction: 'Co-responsable', nom: 'RITZENTHALER', prenom: 'Brigitte' },
  { num: 2, fonction: 'Co-responsable', nom: 'GERTZ', prenom: 'André' },
  { num: 3, fonction: 'Trésorier', nom: 'REBIERE', prenom: 'Dominique' },
  { num: 4, fonction: 'Administrateur', nom: 'VELTZ', prenom: 'Jean-Marie' },
  { num: 5, fonction: 'Administrateur', nom: 'BAJCSA', prenom: 'Ivan' },
  { num: 6, fonction: 'Administrateur', nom: 'BOURRIQUEN', prenom: 'Marie-Delphine' },
  { num: 7, fonction: 'Administrateur', nom: 'BADONNEL', prenom: 'Amandine' },
  { num: 8, fonction: 'Administrateur', nom: 'MICHALAK', prenom: 'Camille' },
  { num: 9, fonction: 'Administrateur', nom: 'NICEVIC', prenom: 'Meryem' },
  { num: 10, fonction: 'Administrateur', nom: 'LEBLANC', prenom: 'Dominique' },
];
/** Initiales pour la carte équipe quand `photo_url` est absent. */
function initials(member) {
  const p = member.prenom?.[0] ?? '';
  const n = member.nom?.[0] ?? '';
  return `${p}${n}`.toUpperCase() || '?';
}
export default function QuiSommesNous() {
  const { t } = useTranslation();
  const {
    data: team,
    isLoading: isLoadingTeam,
    isError: isTeamError,
    error: teamError,
  } = usePublicTeam();
  const objectivesGlobal = [
    { icon: <FaHandshake />, textKey: 'quiSommesNous.axe1' },
    { icon: <FaClipboardList />, textKey: 'quiSommesNous.axe2' },
    { icon: <FaPalette />, textKey: 'quiSommesNous.axe3' },
  ];
  const objectivesFamilles = [
    { icon: <FaUsers />, textKey: 'quiSommesNous.axe4' },
    { icon: <FaLink />, textKey: 'quiSommesNous.axe5' },
  ];
  return (
    <>
      <PageSEO
        title={t('quiSommesNous.pageTitle')}
        description="Le Centre Socio-Culturel d'Ostwald : un lieu de rencontre, d'échange et de solidarité ouvert à tous les habitants."
        url="/a-propos/qui-sommes-nous"
      />

      <div className="page-header qsn__page-header">
        <h1>{t('quiSommesNous.titre')}</h1>
      </div>

      <img
        src={imgBuilding}
        alt="Centre Socio-Culturel d’Ostwald"
        className="qsn__building"
        width="1200"
        height="600"
        loading="lazy"
      />

      <div className="container">
        <section className="qsn__reseau">
          <SectionTitle variant="blue">{t('quiSommesNous.reseauTitre')}</SectionTitle>
          <p>{t('quiSommesNous.reseauDesc')}</p>
          <div className="qsn__reseau-wrapper">
            <div className="qsn__reseau-map">
              <img
                src={carteReseau}
                alt="Les implantations locales de la CSF 67"
                className="qsn__reseau-img"
              />
              {csfLinks.map((csf) => (
                <a
                  key={csf.label}
                  href={csf.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="qsn__reseau-link"
                  style={{ top: csf.top, left: csf.left }}
                  title={csf.label}
                >
                  {csf.label}
                </a>
              ))}
            </div>
          </div>
        </section>

        <div className="qsn__intro">
          <h2 className="qsn__intro-titre">{t('quiSommesNous.introTitre')}</h2>
          <p>{t('quiSommesNous.introPara1')}</p>
          {t('quiSommesNous.introPara2') && (
            <p>
              <Trans i18nKey="quiSommesNous.introPara2" components={{ bold: <strong /> }} />
            </p>
          )}
          {t('quiSommesNous.introPara3') && (
            <p>
              <Trans i18nKey="quiSommesNous.introPara3" components={{ bold: <strong /> }} />
            </p>
          )}
          <p className="qsn__intro-highlight">
            <strong>{t('quiSommesNous.intro2')}</strong>
          </p>
        </div>

        <section className="qsn__objectives">
          <SectionTitle variant="orange" className="qsn__section-title">
            {t('quiSommesNous.objectifsCentre')}
          </SectionTitle>

          <h3 className="qsn__sub-title">{t('quiSommesNous.projetAnimationGlobale')}</h3>
          <ul className="qsn__objectives-list">
            {objectivesGlobal.map((obj) => (
              <li key={obj.textKey} className="qsn__objectives-item">
                <span className="qsn__objectives-icon" aria-hidden="true">
                  {obj.icon}
                </span>
                <span>{t(obj.textKey)}</span>
              </li>
            ))}
          </ul>

          <h3 className="qsn__sub-title qsn__sub-title--spaced">
            {t('quiSommesNous.projetAnimationCollectiveFamilles')}
          </h3>
          <ul className="qsn__objectives-list">
            {objectivesFamilles.map((obj) => (
              <li key={obj.textKey} className="qsn__objectives-item">
                <span className="qsn__objectives-icon" aria-hidden="true">
                  {obj.icon}
                </span>
                <span>{t(obj.textKey)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ÉQUIPE — données depuis /api/team */}
        <section className="qsn__team">
          <SectionTitle variant="green" className="qsn__section-title">
            {t('quiSommesNous.equipe')}
          </SectionTitle>
          <p className="qsn__team-intro">{t('quiSommesNous.equipeIntro')}</p>

          {isLoadingTeam && (
            <>
              <span className="sr-only" role="status">
                {t('quiSommesNous.equipeChargement')}
              </span>
              <div className="qsn__team-grid" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="qsn__team-member">
                    <Skeleton shape="circle" width={110} height={110} />
                    <Skeleton shape="text" width={90} style={{ marginTop: 8 }} />
                    <Skeleton shape="text" width={110} />
                    <Skeleton shape="text" width={130} style={{ marginTop: 6 }} />
                  </div>
                ))}
              </div>
            </>
          )}

          {isTeamError && (
            <p className="qsn__team-state qsn__team-state--error" role="alert">
              {isApiError(teamError) ? teamError.message : t('quiSommesNous.equipeErreur')}
            </p>
          )}

          {team && team.length > 0 && (
            <div className="qsn__team-grid">
              {team.map((member) => (
                <div key={member.id} className="qsn__team-member">
                  <div className="qsn__team-avatar">
                    {member.photo_url ? (
                      <img
                        src={resolveStaticUrl(member.photo_url)}
                        alt={`${member.prenom} ${member.nom}`}
                        className="qsn__team-avatar-img"
                        width="120"
                        height="120"
                        loading="lazy"
                      />
                    ) : (
                      <span className="qsn__team-initials" aria-hidden="true">
                        {initials(member)}
                      </span>
                    )}
                  </div>
                  <p className="qsn__team-name">
                    {member.prenom} {member.nom}
                  </p>
                  <p className="qsn__team-role">{member.role}</p>
                  <div className="qsn__team-coords">
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="qsn__team-email">
                        {member.email}
                      </a>
                    )}
                    {member.phone && (
                      <a
                        href={`tel:${member.phone.replace(/\./g, '')}`}
                        className="qsn__team-phone"
                      >
                        {member.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CONSEIL D'ADMINISTRATION — tableau des membres avec fonction/nom/prénom */}
        <section className="qsn__conseil">
          <SectionTitle variant="blue" className="qsn__section-title">
            {t('quiSommesNous.conseilTitre')}
          </SectionTitle>
          <p className="qsn__conseil-desc">
            {t('quiSommesNous.conseilDesc')}{' '}
            <a href="mailto:association.usagers@csc-ostwald.fr" className="qsn__conseil-email">
              association.usagers@csc-ostwald.fr
            </a>
          </p>

          {/* Wrapper pour scroll horizontal sur très petits écrans.
            La table elle-même remplit 100% via table-layout: fixed. */}
          <div className="qsn__conseil-table-wrap">
            <table className="qsn__conseil-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('quiSommesNous.conseilFonction')}</th>
                  <th>{t('quiSommesNous.conseilNom')}</th>
                  <th>{t('quiSommesNous.conseilPrenom')}</th>
                </tr>
              </thead>
              <tbody>
                {conseil.map((m) => (
                  <tr key={m.num}>
                    <td>{m.num}</td>
                    <td>{m.fonction}</td>
                    <td>{m.nom}</td>
                    <td>{m.prenom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="qsn__conseil-cta">{t('quiSommesNous.conseilCta')}</p>
        </section>
      </div>
    </>
  );
}
