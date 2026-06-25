// ============================================================
// InscriptionConfirmee.jsx — Page d'atterrissage après un paiement réussi.
//
// HelloAsso (ou la route mock-success) redirige ici après que
// l'utilisateur a complété le paiement. Pure présentation — aucun appel
// API ; le webhook a déjà mis à jour l'inscription côté serveur.
// ============================================================
import { Link } from 'react-router-dom';
import PageSEO from '@components/layout/PageSEO';
import './InscriptionConfirmee.scss';
export default function InscriptionConfirmee() {
  return (
    <>
      <PageSEO
        title="Inscription confirmée — CSC Ostwald"
        description="Votre inscription à l'activité Jeunesse a été enregistrée"
        url="/jeunesse/inscription-confirmee"
      />
      <div className="inscription-confirmee">
        <div className="inscription-confirmee__card">
          <div className="inscription-confirmee__check" aria-hidden="true">
            ✓
          </div>
          <h1 className="inscription-confirmee__title">Inscription confirmée</h1>
          <p className="inscription-confirmee__lead">
            Merci pour votre inscription ! Le CSC Ostwald a bien reçu votre paiement.
          </p>
          <p className="inscription-confirmee__detail">
            Vous recevrez sous peu un e-mail de confirmation avec les détails de l&apos;activité
            (lieu, jour, horaires). Si vous ne le voyez pas, pensez à vérifier vos spams.
          </p>

          <div className="inscription-confirmee__actions">
            <Link
              to="/jeunesse"
              className="inscription-confirmee__link inscription-confirmee__link--primary"
            >
              Voir les autres activités
            </Link>
            <Link to="/" className="inscription-confirmee__link inscription-confirmee__link--ghost">
              Retour à l&apos;accueil
            </Link>
          </div>

          <p className="inscription-confirmee__contact">
            Une question ? <Link to="/contact">Contactez-nous</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
