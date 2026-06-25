// ============================================================
// AdminRegistrations.jsx — Admin des inscriptions payantes aux activités.
//
// HelloAsso écrit les lignes ici via le webhook. L'admin peut :
//   - Voir la liste (les plus récentes d'abord, titre d'activité joint)
//   - Remplacer le statut (rare — ex. remboursement en espèces enregistré
//     après coup)
//   - Supprimer (préférer status='refunded' pour la piste d'audit ;
//                supprimer uniquement quand la ligne est une vraie erreur)
// ============================================================
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isApiError } from '@api/client';
import {
  useRegistrations,
  useUpdateRegistrationStatus,
  useDeleteRegistration,
} from '@features/admin-registrations';
import PageSEO from '@components/layout/PageSEO';
import ExportCsvButton from '@components/ui/ExportCsvButton';
import SearchInput from '@components/ui/SearchInput';
import { normalize } from '@utils/string';
import './AdminRegistrations.scss';
const PER_PAGE = 30;
const STATUS_LABELS = {
  pending: 'En attente',
  paid: 'Payé',
  refunded: 'Remboursé',
};
function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
/** amount_cents (int) → "12,50 €". */
function formatAmount(cents) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
export default function AdminRegistrations() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useRegistrations({
    page,
    perPage: PER_PAGE,
  });
  const updateStatusMutation = useUpdateRegistrationStatus();
  const deleteMutation = useDeleteRegistration();
  const [query, setQuery] = useState('');
  const filteredItems = useMemo(() => {
    if (!data) return [];
    const q = normalize(query.trim());
    if (!q) return data.items;
    return data.items.filter((r) =>
      normalize(`${r.prenom} ${r.nom} ${r.email} ${r.activity_title ?? ''}`).includes(q)
    );
  }, [data, query]);
  const handleStatusChange = (id, status) => {
    updateStatusMutation.mutate({ id, status });
  };
  const handleDelete = (reg) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(
      `Supprimer définitivement l'inscription de ${reg.prenom} ${reg.nom} ?\n\nAstuce: pour conserver la trace, préférer le statut « Remboursé ».`
    );
    if (ok) deleteMutation.mutate(reg.id);
  };
  return (
    <>
      <PageSEO
        title="Inscriptions Jeunesse — Admin CSC Ostwald"
        description="Suivi des inscriptions payées via HelloAsso"
        url="/admin/registrations"
      />
      <div className="admin-registrations">
        <header className="admin-registrations__header">
          <div>
            <Link to="/admin/dashboard" className="admin-registrations__back">
              ← Dashboard
            </Link>
            <h1 className="admin-registrations__title">
              Inscriptions Jeunesse
              {data && <span className="admin-registrations__count">{data.total} au total</span>}
            </h1>
          </div>
          <div className="admin-registrations__actions-header">
            <SearchInput
              id="registrations-search"
              value={query}
              onChange={setQuery}
              placeholder="Rechercher (nom, email, activité)…"
            />
            <ExportCsvButton
              path="/admin/registrations/export.csv"
              filename="inscriptions.csv"
              className="admin-registrations__btn"
              disabled={isLoading}
            />
            <button
              type="button"
              className="admin-registrations__btn"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              Actualiser
            </button>
          </div>
        </header>

        {isLoading && (
          <p className="admin-registrations__state" role="status">
            Chargement…
          </p>
        )}

        {isError && (
          <p className="admin-registrations__state admin-registrations__state--error" role="alert">
            Erreur : {isApiError(error) ? error.message : 'Réessayez plus tard.'}
          </p>
        )}

        {data && data.items.length === 0 && (
          <p className="admin-registrations__state" role="status">
            Aucune inscription pour l&apos;instant. Les inscriptions HelloAsso apparaîtront ici dès
            qu&apos;un paiement sera validé.
          </p>
        )}

        {data && data.items.length > 0 && (
          <>
            {query && (
              <p className="admin-registrations__state" role="status">
                {filteredItems.length} résultat{filteredItems.length === 1 ? '' : 's'} pour «{' '}
                {query} »
              </p>
            )}
            <div className="admin-registrations__table-wrap">
              <table className="admin-registrations__table">
                <thead>
                  <tr>
                    <th scope="col">Inscrit</th>
                    <th scope="col">Activité</th>
                    <th scope="col">Montant</th>
                    <th scope="col">Statut</th>
                    <th scope="col">Date</th>
                    <th scope="col">Transaction</th>
                    <th scope="col" className="admin-registrations__th-actions">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((reg) => (
                    <tr
                      key={reg.id}
                      className={`admin-registrations__row admin-registrations__row--${reg.status}`}
                    >
                      <td>
                        <div className="admin-registrations__person">
                          {reg.prenom} {reg.nom}
                        </div>
                        <a href={`mailto:${reg.email}`} className="admin-registrations__email">
                          {reg.email}
                        </a>
                      </td>
                      <td>
                        {reg.activity_title ?? (
                          <em className="admin-registrations__deleted">Activité supprimée</em>
                        )}
                      </td>
                      <td className="admin-registrations__amount">
                        {formatAmount(reg.amount_cents)}
                      </td>
                      <td>
                        <label htmlFor={`reg-status-${reg.id}`} className="admin-registrations__sr">
                          Statut
                        </label>
                        <select
                          id={`reg-status-${reg.id}`}
                          className={`admin-registrations__status admin-registrations__status--${reg.status}`}
                          value={reg.status}
                          onChange={(e) => handleStatusChange(reg.id, e.target.value)}
                          disabled={
                            updateStatusMutation.isPending &&
                            updateStatusMutation.variables?.id === reg.id
                          }
                        >
                          {Object.keys(STATUS_LABELS).map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="admin-registrations__date">{formatDate(reg.created_at)}</td>
                      <td className="admin-registrations__transaction">
                        {reg.helloasso_transaction_id ? (
                          <code title={reg.helloasso_transaction_id}>
                            {reg.helloasso_transaction_id.slice(0, 8)}…
                          </code>
                        ) : (
                          <em>—</em>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-registrations__delete"
                          onClick={() => handleDelete(reg)}
                          disabled={deleteMutation.isPending && deleteMutation.variables === reg.id}
                          aria-label={`Supprimer l'inscription ${reg.id}`}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.totalPages > 1 && (
              <nav className="admin-registrations__pagination" aria-label="Pagination">
                <button
                  type="button"
                  className="admin-registrations__page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                >
                  ← Précédent
                </button>
                <span className="admin-registrations__page-label">
                  Page {data.page} sur {data.totalPages}
                </span>
                <button
                  type="button"
                  className="admin-registrations__page-btn"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages || isLoading}
                >
                  Suivant →
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </>
  );
}
