// ============================================================
// UploadField.jsx — Sélecteur de fichier admin qui téléverse vers
// l'API et stocke l'URL renvoyée dans le champ de formulaire parent.
//
// `kind` choisit le préréglage : 'image' (défaut — endpoint /admin/upload,
// 5 Mo) ou 'video' (endpoint /admin/upload/video, 50 Mo). Le composant
// reste rétro-compatible : sans `kind`, il se comporte exactement comme
// avant (upload d'image).
//
// Conçu pour react-hook-form : associer avec `Controller` (préféré) ou
// piloter via `register(...)` + `setValue` depuis le parent.
// ============================================================
import { useRef, useState } from 'react';
import { getCsrfHeaders, isApiError, resolveStaticUrl } from '@api/client';
import './UploadField.scss';

// Préréglages par type de média. Centralise tout ce qui diffère entre
// un upload d'image et un upload de vidéo (endpoint, nom de champ
// multipart, types acceptés, libellé d'aide).
const PRESETS = {
  image: {
    accept: 'image/png,image/jpeg,image/webp,image/gif',
    uploadPath: '/admin/upload',
    fieldName: 'image',
    hint: 'PNG, JPG, WebP, GIF — 5 Mo max',
    emptyLabel: 'Aucune image',
  },
  video: {
    accept: 'video/mp4,video/webm',
    uploadPath: '/admin/upload/video',
    fieldName: 'video',
    hint: 'MP4, WebM — 50 Mo max',
    emptyLabel: 'Aucune vidéo',
  },
};

export default function UploadField({
  value,
  onChange,
  label = 'Fichier',
  id = 'upload',
  disabled,
  kind = 'image',
}) {
  const preset = PRESETS[kind] ?? PRESETS.image;
  const fileInputRef = useRef(null);
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const handlePick = () => {
    fileInputRef.current?.click();
  };
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    // Réinitialise l'input pour que re-choisir le MÊME fichier déclenche encore onChange.
    e.target.value = '';
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append(preset.fieldName, file);
      // On n'utilise pas le helper apiPost car il envoie du JSON ; multer
      // a besoin de multipart/form-data, ce que fetch gère automatiquement
      // quand le corps est un FormData (le navigateur pose l'en-tête
      // Content-Type avec la bonne frontière).
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';
      // CSRF : /api/admin/* est protégé par le middleware
      // double-submit-cookie, donc même les uploads multipart DOIVENT
      // renvoyer le cookie csrf_token comme en-tête X-CSRF-Token.
      const res = await fetch(`${apiBase}${preset.uploadPath}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: getCsrfHeaders(),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      onChange(data.url);
    } catch (err) {
      setError(isApiError(err) ? err.message : err.message);
    } finally {
      setUploading(false);
    }
  };
  const handleClear = () => {
    onChange('');
    setError(null);
  };
  const resolved = resolveStaticUrl(value);
  return (
    <div className="upload-field">
      <div className="upload-field__row">
        <div className="upload-field__preview">
          {resolved ? (
            kind === 'video' ? (
              // #t=0.1 force l'affichage de la 1re image (sinon cadre noir).
              <video src={`${resolved}#t=0.1`} muted playsInline preload="metadata" />
            ) : (
              <img src={resolved} alt={label} />
            )
          ) : (
            <span className="upload-field__placeholder">{preset.emptyLabel}</span>
          )}
        </div>

        <div className="upload-field__controls">
          <input
            id={`${id}-url`}
            type="url"
            className="upload-field__input-url"
            placeholder="URL (/uploads/… ou https://…)"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || isUploading}
          />

          <input
            ref={fileInputRef}
            id={`${id}-file`}
            type="file"
            // Synchronisé avec les middlewares backend (uploadImage /
            // uploadVideo) pour ne jamais proposer un format qui renverra 415.
            accept={preset.accept}
            className="upload-field__hidden-input"
            onChange={(e) => void handleFile(e)}
          />

          <div className="upload-field__buttons">
            <button
              type="button"
              className="upload-field__btn"
              onClick={handlePick}
              disabled={disabled || isUploading}
            >
              {isUploading ? 'Téléversement…' : value ? 'Remplacer' : 'Choisir un fichier'}
            </button>
            {value && (
              <button
                type="button"
                className="upload-field__btn upload-field__btn--danger"
                onClick={handleClear}
                disabled={disabled || isUploading}
              >
                Retirer
              </button>
            )}
          </div>

          <p className="upload-field__hint">{preset.hint}</p>
          {error && (
            <p className="upload-field__error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
