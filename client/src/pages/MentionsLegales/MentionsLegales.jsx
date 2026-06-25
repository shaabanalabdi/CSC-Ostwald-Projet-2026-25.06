import PageSEO from '@components/layout/PageSEO';
import SectionTitle from '@components/ui/SectionTitle';
import './MentionsLegales.scss';
// Couleurs de bubble en rotation : orange → blue → green → pink → cycle
// Cohérent avec la charte Instagram CSC (variation visuelle des sections).
// Typé explicitement CSCBadgeVariant[] pour que le `variant` du Badge accepte.
const SECTION_COLORS = ['orange', 'blue', 'green', 'pink', 'orange'];
export default function MentionsLegales() {
  return (
    <>
      <PageSEO
        title="Mentions légales | CSC Ostwald"
        description="Mentions légales du site du Centre Social et Culturel d’Ostwald."
        url="/mentions-legales"
        noindex
      />

      <div className="page-header">
        <h1>Mentions légales</h1>
      </div>

      <div className="container section">
        <section className="mentions__section">
          <SectionTitle variant={SECTION_COLORS[0]} className="mentions__section-title">
            Éditeur du site
          </SectionTitle>
          <p>
            <strong>Nom de l’association :</strong> Centre Social et Culturel d’Ostwald
          </p>
          <p>
            <strong>Adresse :</strong> 1, place de la Bruyère, 67540 Ostwald
          </p>
          <p>
            <strong>Téléphone :</strong> <a href="tel:0978809629">09.78.80.96.29</a>
          </p>
          <p>
            <strong>Email :</strong>{' '}
            <a href="mailto:contact@csc-ostwald.fr">contact@csc-ostwald.fr</a>
          </p>
          <p>
            <strong>Directeur de la publication :</strong> Etienne ENETTE
          </p>
        </section>

        <section className="mentions__section">
          <SectionTitle variant={SECTION_COLORS[1]} className="mentions__section-title">
            Hébergement
          </SectionTitle>
          <p>
            <strong>Hébergeur :</strong> OVH SAS (commercialisée sous OVHcloud)
          </p>
          <p>
            <strong>Adresse :</strong> 2 rue Kellermann, 59100 Roubaix, France
          </p>
          <p>
            <strong>Téléphone :</strong> <a href="tel:+33972101007">+33 9 72 10 10 07</a>
          </p>
          <p>
            <strong>Site web :</strong>{' '}
            <a href="https://www.ovhcloud.com" target="_blank" rel="noopener noreferrer">
              www.ovhcloud.com
            </a>
          </p>
          <p>
            <strong>RCS :</strong> Lille Métropole 424 761 419
          </p>
        </section>

        <section className="mentions__section">
          <SectionTitle variant={SECTION_COLORS[2]} className="mentions__section-title">
            Propriété intellectuelle
          </SectionTitle>
          <p>
            L’ensemble du contenu de ce site (textes, images, logos, vidéos) est la propriété du
            Centre Social et Culturel d’Ostwald ou de ses partenaires, et est protégé par les lois
            relatives à la propriété intellectuelle. Toute reproduction, même partielle, est
            interdite sans autorisation préalable.
          </p>
        </section>

        <section className="mentions__section">
          <SectionTitle variant={SECTION_COLORS[3]} className="mentions__section-title">
            Données personnelles
          </SectionTitle>
          <p>
            Les informations recueillies via les formulaires d’inscription sont utilisées uniquement
            dans le cadre des activités du CSC d’Ostwald. Elles ne sont pas transmises à des tiers.
            Conformément à la loi Informatique et Libertés et au RGPD, vous disposez d’un droit
            d’accès, de rectification et de suppression de vos données. Pour exercer ce droit,
            contactez-nous à <a href="mailto:contact@csc-ostwald.fr">contact@csc-ostwald.fr</a>.
          </p>
        </section>

        <section>
          <SectionTitle variant={SECTION_COLORS[4]} className="mentions__section-title">
            Cookies
          </SectionTitle>
          <p>
            Ce site utilise uniquement le stockage local (localStorage) pour mémoriser vos
            préférences d’accessibilité. Aucun cookie de traçage ou publicitaire n’est utilisé.
          </p>
        </section>
      </div>
    </>
  );
}
