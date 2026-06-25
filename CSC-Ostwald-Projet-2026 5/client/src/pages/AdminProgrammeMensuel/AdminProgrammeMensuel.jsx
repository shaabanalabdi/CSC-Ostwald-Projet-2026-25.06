import { useState } from 'react';
import { Link } from 'react-router-dom';
import { isApiError, resolveStaticUrl } from '@api/client';
import {
  useAdminProgrammeMensuel,
  useCreateProgramme,
  useDeleteProgramme,
  useUpdateProgramme,
} from '@features/programme-mensuel';
import PageSEO from '@components/layout/PageSEO';
import './AdminProgrammeMensuel.scss';

const MOIS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const EMPTY_FORM = {
  titre: '',
  image_url: '',
  mois: 1,
  annee: new Date().getFullYear(),
  is_published: true,
};

export default function AdminProgrammeMensuel() {
  const { data, isLoading, isError, error } = useAdminProgrammeMensuel();
  const createMutation = useCreateProgramme();
  const updateMutation = useUpdateProgramme();
  const deleteMutation = useDeleteProgramme();

  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const programmes = data ?? [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, mois: Number(form.mois), annee: Number(form.annee) };
    if (editId) {
      await updateMutation.mutateAsync({ id: editId, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (p) => {
    setForm({
      titre: p.titre,
      image_url: p.image_url,
      mois: p.mois,
      annee: p.annee,
      is_published: p.is_published === 1,
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleDelete = (p) => {
    // eslint-disable-next-line no-alert
    if (window.confirm(`Supprimer le programme « ${p.titre} » ?`)) {
      deleteMutation.mutate(p.id);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <PageSEO
        title="Programme mensuel — Admin CSC Ostwald"
        description=""
        url="/admin/programme-mensuel"
      />
      <div className="apm">
        <header className="apm__header">
          <div>
            <Link to="/admin/dashboard" className="apm__back">
              ← Dashboard
            </Link>
            <h1 className="apm__title">
              Programme mensuel
              {data && (
                <span className="apm__count">
                  {programmes.length} programme{programmes.length !== 1 ? 's' : ''}
                </span>
              )}
            </h1>
          </div>
          <button
            type="button"
            className="apm__cta"
            onClick={() => {
              setForm(EMPTY_FORM);
              setEditId(null);
              setShowForm(true);
            }}
          >
            + Ajouter
          </button>
        </header>

        {showForm && (
          <form className="apm__form" onSubmit={handleSubmit}>
            <h2 className="apm__form-title">{editId ? 'Modifier' : 'Nouveau programme'}</h2>

            <div className="apm__field">
              <label htmlFor="apm-titre">Titre</label>
              <input
                id="apm-titre"
                type="text"
                value={form.titre}
                onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                required
              />
            </div>

            <div className="apm__row">
              <div className="apm__field">
                <label htmlFor="apm-mois">Mois</label>
                <select
                  id="apm-mois"
                  value={form.mois}
                  onChange={(e) => setForm((f) => ({ ...f, mois: Number(e.target.value) }))}
                >
                  {MOIS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="apm__field">
                <label htmlFor="apm-annee">Année</label>
                <input
                  id="apm-annee"
                  type="number"
                  value={form.annee}
                  min="2020"
                  max="2100"
                  onChange={(e) => setForm((f) => ({ ...f, annee: Number(e.target.value) }))}
                  required
                />
              </div>
            </div>

            <div className="apm__field">
              <label htmlFor="apm-image-url">
                URL de l'image <small>(ex: /uploads/xxx.png)</small>
              </label>
              <input
                id="apm-image-url"
                type="text"
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                required
                placeholder="/uploads/..."
              />
            </div>

            <div className="apm__field apm__field--check">
              <label>
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                />
                Publié
              </label>
            </div>

            <div className="apm__form-actions">
              <button type="submit" className="apm__btn apm__btn--primary" disabled={isPending}>
                {isPending ? 'Enregistrement…' : editId ? 'Enregistrer' : 'Créer'}
              </button>
              <button
                type="button"
                className="apm__btn apm__btn--ghost"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                }}
              >
                Annuler
              </button>
            </div>

            {(createMutation.isError || updateMutation.isError) && (
              <p className="apm__error">
                {isApiError(createMutation.error || updateMutation.error)
                  ? (createMutation.error || updateMutation.error).message
                  : 'Une erreur est survenue.'}
              </p>
            )}
          </form>
        )}

        {isLoading && <p className="apm__state">Chargement…</p>}
        {isError && (
          <p className="apm__state apm__state--error">
            Erreur : {isApiError(error) ? error.message : 'Réessayez.'}
          </p>
        )}

        {data && programmes.length === 0 && !showForm && (
          <p className="apm__state">
            Aucun programme pour l'instant. Cliquez sur « Ajouter » pour commencer.
          </p>
        )}

        {programmes.length > 0 && (
          <ul className="apm__list">
            {programmes.map((p) => (
              <li
                key={p.id}
                className={`apm__card ${p.is_published === 0 ? 'apm__card--draft' : ''}`}
              >
                {p.image_url && (
                  <img src={resolveStaticUrl(p.image_url)} alt={p.titre} className="apm__thumb" />
                )}
                <div className="apm__info">
                  <p className="apm__mois">
                    {p.mois_nom} {p.annee}
                  </p>
                  <h3 className="apm__name">{p.titre}</h3>
                  {p.is_published === 0 && <span className="apm__draft">Brouillon</span>}
                </div>
                <div className="apm__actions">
                  <button
                    type="button"
                    className="apm__action apm__action--edit"
                    onClick={() => handleEdit(p)}
                  >
                    Éditer
                  </button>
                  <button
                    type="button"
                    className="apm__action apm__action--delete"
                    onClick={() => handleDelete(p)}
                    disabled={deleteMutation.isPending}
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
