// ============================================================
// PolitiqueConfidentialite.jsx — Politique de confidentialité
//
// Obligatoire au regard du RGPD (art. 13) et de la LCEN.
// Liée depuis :
//   - le Footer
//   - les cases de consentement RGPD des 3 formulaires
//     (Newsletter, Contact, Bénévole)
// ============================================================
import PageSEO from '@components/layout/PageSEO';
import SectionTitle from '@components/ui/SectionTitle';
import ScrollProgress from '@components/ui/ScrollProgress';
import './PolitiqueConfidentialite.scss';
// Couleurs en rotation pour les 10 sections (cohérent charte Instagram CSC).
// Typé CSCBadgeVariant[] pour que CSCBadge.variant accepte chaque entrée.
const COLORS = [
  'orange',
  'blue',
  'green',
  'pink',
  'orange',
  'blue',
  'green',
  'pink',
  'orange',
  'blue',
];
export default function PolitiqueConfidentialite() {
  return (
    <>
      <PageSEO
        title="Politique de confidentialité | CSC Ostwald"
        description="Politique de confidentialité du Centre Social et Culturel d’Ostwald : données collectées, finalités, durée de conservation et droits RGPD."
        url="/politique-de-confidentialite"
      />
      {/* Barre de progression scroll — utile sur cette page longue */}
      <ScrollProgress />

      <div className="page-header">
        <h1>Politique de confidentialité</h1>
      </div>

      <div className="container section pdc">
        <p className="pdc__intro">
          Le Centre Social et Culturel d’Ostwald accorde une grande importance à la protection de
          vos données personnelles. Cette politique de confidentialité décrit comment nous
          collectons, utilisons et protégeons les informations que vous nous communiquez via ce
          site.
        </p>
        <p className="pdc__update">Dernière mise à jour : 16 mai 2026.</p>

        <section className="pdc__section">
          <SectionTitle variant={COLORS[0]} className="pdc__section-title">
            1. Responsable du traitement
          </SectionTitle>
          <p>Le responsable du traitement des données personnelles est :</p>
          <ul className="pdc__list">
            <li>
              <strong>Centre Social et Culturel d’Ostwald</strong>
            </li>
            <li>1, place de la Bruyère, 67540 Ostwald</li>
            <li>
              Téléphone : <a href="tel:0978809629">09.78.80.96.29</a>
            </li>
            <li>
              Email : <a href="mailto:contact@csc-ostwald.fr">contact@csc-ostwald.fr</a>
            </li>
            <li>Directeur de la publication : Etienne ENETTE</li>
          </ul>
        </section>

        <section className="pdc__section">
          <SectionTitle variant={COLORS[1]} className="pdc__section-title">
            2. Données collectées
          </SectionTitle>
          <p>
            Nous collectons uniquement les données que vous nous transmettez volontairement via les
            formulaires du site :
          </p>
          <ul className="pdc__list">
            <li>
              <strong>Formulaire de contact :</strong> prénom, nom, adresse email, numéro de
              téléphone (optionnel), sujet et contenu du message.
            </li>
            <li>
              <strong>Inscription à la newsletter :</strong> adresse email.
            </li>
            <li>
              <strong>Candidature bénévole :</strong> nom, prénom, email, téléphone, domaines
              d’intérêt, compétences, disponibilités et message libre.
            </li>
          </ul>
          <p>
            Aucune donnée n’est collectée à votre insu. Le site n’utilise ni cookie de traçage, ni
            outil de mesure d’audience tiers (Google Analytics, Meta Pixel, etc.).
          </p>
        </section>

        <section className="pdc__section">
          <SectionTitle variant={COLORS[2]} className="pdc__section-title">
            3. Finalités du traitement
          </SectionTitle>
          <p>Vos données sont utilisées exclusivement pour :</p>
          <ul className="pdc__list">
            <li>Répondre à vos demandes envoyées via le formulaire de contact.</li>
            <li>Vous envoyer notre lettre d’information si vous y êtes inscrit·e.</li>
            <li>Étudier votre candidature de bénévole et vous recontacter.</li>
            <li>Tenir nos registres internes de membres et bénévoles.</li>
          </ul>
          <p>
            Vos données ne sont jamais utilisées à des fins commerciales, ni transmises à des tiers,
            ni vendues.
          </p>
        </section>

        <section className="pdc__section">
          <SectionTitle variant={COLORS[3]} className="pdc__section-title">
            4. Base légale du traitement
          </SectionTitle>
          <p>
            Le traitement de vos données repose sur votre <strong>consentement</strong> (article
            6.1.a du RGPD), recueilli explicitement via une case à cocher avant chaque envoi de
            formulaire. Vous pouvez retirer ce consentement à tout moment en nous contactant.
          </p>
        </section>

        <section className="pdc__section">
          <SectionTitle variant={COLORS[4]} className="pdc__section-title">
            5. Durée de conservation
          </SectionTitle>
          <ul className="pdc__list">
            <li>
              <strong>Messages du formulaire de contact :</strong> conservés jusqu’à 3 ans après le
              dernier échange, puis supprimés.
            </li>
            <li>
              <strong>Inscrits à la newsletter :</strong> conservés tant que vous restez abonné·e.
              Vous pouvez vous désinscrire à tout moment.
            </li>
            <li>
              <strong>Candidatures bénévoles :</strong> conservées 2 ans à compter de la
              candidature, ou jusqu’à la fin de l’engagement bénévole.
            </li>
          </ul>
        </section>

        <section className="pdc__section">
          <SectionTitle variant={COLORS[5]} className="pdc__section-title">
            6. Destinataires des données
          </SectionTitle>
          <p>
            Vos données sont accessibles uniquement aux salariés et administrateurs du CSC d’Ostwald
            dans le cadre strict de leurs missions. Aucun transfert n’est effectué hors de l’Union
            européenne.
          </p>
        </section>

        <section className="pdc__section">
          <SectionTitle variant={COLORS[6]} className="pdc__section-title">
            7. Vos droits
          </SectionTitle>
          <p>
            Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits
            suivants sur vos données personnelles :
          </p>
          <ul className="pdc__list">
            <li>
              <strong>Droit d’accès :</strong> obtenir une copie de vos données.
            </li>
            <li>
              <strong>Droit de rectification :</strong> corriger des données inexactes.
            </li>
            <li>
              <strong>Droit à l’effacement :</strong> demander la suppression de vos données.
            </li>
            <li>
              <strong>Droit à la limitation :</strong> demander la suspension du traitement.
            </li>
            <li>
              <strong>Droit d’opposition :</strong> vous opposer au traitement.
            </li>
            <li>
              <strong>Droit à la portabilité :</strong> récupérer vos données dans un format
              réutilisable.
            </li>
            <li>
              <strong>Droit de retirer votre consentement :</strong> à tout moment, sans que cela
              remette en cause la licéité du traitement antérieur.
            </li>
          </ul>
          <p>
            Pour exercer ces droits, contactez-nous par email à{' '}
            <a href="mailto:contact@csc-ostwald.fr">contact@csc-ostwald.fr</a> ou par courrier à
            l’adresse postale ci-dessus.
          </p>
          <p>
            Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous
            pouvez introduire une réclamation auprès de la CNIL :{' '}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
              www.cnil.fr
            </a>
            .
          </p>
        </section>

        <section className="pdc__section">
          <SectionTitle variant={COLORS[7]} className="pdc__section-title">
            8. Sécurité des données
          </SectionTitle>
          <p>
            Nous mettons en œuvre les mesures techniques et organisationnelles appropriées pour
            protéger vos données contre tout accès non autorisé, altération, divulgation ou
            destruction (connexion sécurisée HTTPS, accès restreint, sauvegardes régulières).
          </p>
        </section>

        <section className="pdc__section">
          <SectionTitle variant={COLORS[8]} className="pdc__section-title">
            9. Cookies et stockage local
          </SectionTitle>
          <p>
            Le site n’utilise <strong>aucun cookie de traçage</strong>. Le seul stockage local (
            <code>localStorage</code>) utilisé concerne vos préférences d’accessibilité (taille de
            police, mode de contraste) et la langue d’affichage choisie. Ces informations restent
            uniquement sur votre appareil.
          </p>
        </section>

        <section className="pdc__section">
          <SectionTitle variant={COLORS[9]} className="pdc__section-title">
            10. Modifications de cette politique
          </SectionTitle>
          <p>
            La présente politique peut être mise à jour à tout moment. Toute modification sera
            publiée sur cette page avec une nouvelle date de mise à jour. Nous vous invitons à la
            consulter régulièrement.
          </p>
        </section>
      </div>
    </>
  );
}
