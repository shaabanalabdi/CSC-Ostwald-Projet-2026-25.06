import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { isApiError } from '@api/client';
import { useAdminContactSettings, useUpdateContactSettings } from '@features/contact-settings';
import PageSEO from '@components/layout/PageSEO';
import './AdminContactSettings.scss';

export default function AdminContactSettings() {
  const { data, isLoading, isError, error } = useAdminContactSettings();
  const updateMutation = useUpdateContactSettings();

  const [edits, setEdits] = useState({});
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const get = (key) => (key in edits ? edits[key] : (data?.[key] ?? ''));

  const form = {
    phone: get('phone'),
    email_accueil: get('email_accueil'),
    email_familles: get('email_familles'),
    email_jeunesse: get('email_jeunesse'),
    email_projets: get('email_projets'),
    address: get('address'),
    days_lv: get('days_lv'),
    hours_lv: get('hours_lv'),
    days_we: get('days_we'),
    hours_we: get('hours_we'),
    exceptional_day: get('exceptional_day'),
    exceptional_occasion: get('exceptional_occasion'),
  };

  const setField = (key, value) => setEdits((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync(form);
      setEdits({});
      setSaved(true);
      savedTimerRef.current = setTimeout(() => setSaved(false), 3000);
    } catch {
      // L'erreur est affichée via updateMutation.isError
    }
  };

  const field = (id, label, key, type = 'text') => (
    <div className="acs__field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={form[key]}
        onChange={(e) => setField(key, e.target.value)}
        required
      />
    </div>
  );

  return (
    <>
      <PageSEO
        title="Paramètres de contact — Admin CSC Ostwald"
        description=""
        url="/admin/contact-settings"
      />
      <div className="acs">
        <header className="acs__header">
          <Link to="/admin/dashboard" className="acs__back">
            ← Dashboard
          </Link>
          <h1 className="acs__title">Paramètres de contact</h1>
          <p className="acs__desc">
            Ces informations s'affichent sur la page de contact publique du site.
          </p>
        </header>

        {isLoading && <p className="acs__state">Chargement…</p>}
        {isError && (
          <p className="acs__state acs__state--error">
            {isApiError(error) ? error.message : 'Impossible de charger les paramètres.'}
          </p>
        )}

        {data && (
          <form className="acs__form" onSubmit={handleSubmit}>
            <section className="acs__section">
              <h2 className="acs__section-title">Téléphone & Adresse</h2>
              {field('acs-phone', 'Téléphone', 'phone', 'tel')}
              {field('acs-address', 'Adresse postale', 'address')}
            </section>

            <section className="acs__section">
              <h2 className="acs__section-title">Horaires d'accueil</h2>
              <div className="acs__row">
                {field('acs-days-lv', 'Jours (ligne 1)', 'days_lv')}
                {field('acs-hours-lv', 'Horaires (ligne 1)', 'hours_lv')}
              </div>
              <div className="acs__row">
                {field('acs-days-we', 'Jours (ligne 2)', 'days_we')}
                {field('acs-hours-we', 'Horaires (ligne 2)', 'hours_we')}
              </div>
            </section>

            <section className="acs__section">
              <h2 className="acs__section-title">Adresses e-mail</h2>
              {field('acs-email-accueil', 'Accueil général', 'email_accueil', 'email')}
              {field('acs-email-familles', 'Secteur familles', 'email_familles', 'email')}
              {field('acs-email-jeunesse', 'Secteur jeunesse', 'email_jeunesse', 'email')}
              {field('acs-email-projets', 'Projets', 'email_projets', 'email')}
            </section>

            <section className="acs__section">
              <h2 className="acs__section-title">Jour exceptionnel</h2>
              <p className="acs__hint">
                Laissez vide si aucune exception. Quand rempli, une ligne verte s'affiche dans le
                tableau des horaires sur la page Contact.
              </p>
              <div className="acs__row">
                <div className="acs__field">
                  <label htmlFor="acs-exceptional-day">
                    Jour <small>(ex : Ce samedi)</small>
                  </label>
                  <input
                    id="acs-exceptional-day"
                    type="text"
                    value={form.exceptional_day}
                    onChange={(e) => setField('exceptional_day', e.target.value)}
                    placeholder="Ex : Ce samedi"
                    maxLength={100}
                  />
                </div>
                <div className="acs__field">
                  <label htmlFor="acs-exceptional-occasion">
                    Occasion <small>(ex : Portes ouvertes 10h–16h)</small>
                  </label>
                  <input
                    id="acs-exceptional-occasion"
                    type="text"
                    value={form.exceptional_occasion}
                    onChange={(e) => setField('exceptional_occasion', e.target.value)}
                    placeholder="Ex : Portes ouvertes 10h–16h"
                    maxLength={255}
                  />
                </div>
              </div>
              {(form.exceptional_day || form.exceptional_occasion) && (
                <button
                  type="button"
                  className="acs__clear"
                  onClick={() => {
                    setField('exceptional_day', '');
                    setField('exceptional_occasion', '');
                  }}
                >
                  ✕ Supprimer le jour exceptionnel
                </button>
              )}
            </section>

            {updateMutation.isError && (
              <p className="acs__error">
                {isApiError(updateMutation.error)
                  ? updateMutation.error.message
                  : 'Une erreur est survenue.'}
              </p>
            )}

            <div className="acs__actions">
              <button
                type="submit"
                className="acs__btn acs__btn--primary"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              {saved && <span className="acs__saved">✓ Modifications enregistrées</span>}
            </div>
          </form>
        )}
      </div>
    </>
  );
}
