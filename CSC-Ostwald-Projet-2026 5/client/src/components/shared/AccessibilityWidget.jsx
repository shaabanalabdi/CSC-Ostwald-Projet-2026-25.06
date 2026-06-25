// ============================================================
// AccessibilityWidget.jsx — Widget flottant d'accessibilité
//
// Bouton fixe en bas à droite qui ouvre un panel de paramètres :
//   - Augmenter / Diminuer la taille du texte (de 70% à 150%)
//   - Modes visuels : gris, haute contraste, contraste négatif
//   - Réinitialiser tous les paramètres
// Les préférences sont lues/écrites via accessibilityStore (localStorage).
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { FiZoomIn, FiZoomOut, FiRotateCcw } from 'react-icons/fi';
import { MdContrast, MdBrightness4, MdVisibility, MdAccessibility } from 'react-icons/md';
import { useAccessibilityStore } from '@stores/accessibilityStore';
import { useTranslation } from 'react-i18next';
import './AccessibilityWidget.scss';
export default function AccessibilityWidget() {
  // Contrôle la visibilité du panel
  const [open, setOpen] = useState(false);
  // Référence sur le panel pour détecter les clics en dehors
  const panelRef = useRef(null);
  // Fonctions et valeurs du contexte d'accessibilité (typés via AccessibilityContextValue)
  const { fontSize, mode, increaseFontSize, decreaseFontSize, toggleMode, reset } =
    useAccessibilityStore();
  const { t } = useTranslation();
  // Ferme le panel si l'utilisateur clique en dehors de lui.
  // L'écouteur est ajouté uniquement quand le panel est ouvert (optimisation).
  useEffect(() => {
    // Type guard sur e.target — MouseEvent.target peut être EventTarget | null,
    // mais Node.contains() exige Node. instanceof Node sécurise les 2 cas.
    const handleClickOutside = (e) => {
      if (panelRef.current && e.target instanceof Node && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    // Nettoyage : supprime l'écouteur quand le panel se ferme ou le composant démonte
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);
  return (
    // Wrapper global — référence pour la détection de clic en dehors
    <div className="a11y-widget" ref={panelRef}>
      {/* Bouton déclencheur flottant (icône fauteuil roulant) */}
      <button
        type="button"
        className={`a11y-widget__trigger ${open ? 'a11y-widget__trigger--active' : ''}`}
        onClick={() => setOpen((o) => !o)} // bascule l'ouverture du panel
        aria-label={t('a11y.options')}
        aria-expanded={open}
        aria-controls="a11y-widget-panel"
      >
        <MdAccessibility aria-hidden="true" />
      </button>

      {/* Panel de paramètres — rendu uniquement quand open est true.
            Pattern : disclosure (pas modal) car le panel n'a pas besoin
            de trap le focus — il complète l'UI plutôt que de la bloquer. */}
      {open && (
        <div
          id="a11y-widget-panel"
          className="a11y-widget__panel"
          role="group"
          aria-labelledby="a11y-widget-title"
        >
          <h2 id="a11y-widget-title" className="a11y-widget__title">
            {t('a11y.titre')}
          </h2>

          <ul className="a11y-widget__list">
            {/* Augmenter la taille du texte — bloqué à 150% maximum */}
            <li>
              <button
                type="button"
                className="a11y-widget__item"
                onClick={increaseFontSize}
                disabled={fontSize >= 150}
                aria-label={`${t('a11y.augmenter')} (${fontSize}%)`}
              >
                <FiZoomIn className="a11y-widget__icon" aria-hidden="true" />
                <span>{t('a11y.augmenter')}</span>
              </button>
            </li>

            {/* Diminuer la taille du texte — bloqué à 70% minimum */}
            <li>
              <button
                type="button"
                className="a11y-widget__item"
                onClick={decreaseFontSize}
                disabled={fontSize <= 70}
                aria-label={`${t('a11y.diminuer')} (${fontSize}%)`}
              >
                <FiZoomOut className="a11y-widget__icon" aria-hidden="true" />
                <span>{t('a11y.diminuer')}</span>
              </button>
            </li>

            {/* Mode niveaux de gris — classe a11y-grayscale appliquée sur <body> */}
            <li>
              <button
                type="button"
                className={`a11y-widget__item ${mode === 'grayscale' ? 'a11y-widget__item--active' : ''}`}
                aria-pressed={mode === 'grayscale'}
                onClick={() => toggleMode('grayscale')}
              >
                <MdContrast className="a11y-widget__icon" aria-hidden="true" />
                <span>{t('a11y.modeGris')}</span>
              </button>
            </li>

            {/* Mode haute contraste — classe a11y-high-contrast sur <body> */}
            <li>
              <button
                type="button"
                className={`a11y-widget__item ${mode === 'high-contrast' ? 'a11y-widget__item--active' : ''}`}
                aria-pressed={mode === 'high-contrast'}
                onClick={() => toggleMode('high-contrast')}
              >
                <MdBrightness4 className="a11y-widget__icon" aria-hidden="true" />
                <span>{t('a11y.hauteContraste')}</span>
              </button>
            </li>

            {/* Mode contraste négatif — classe a11y-negative sur <body> */}
            <li>
              <button
                type="button"
                className={`a11y-widget__item ${mode === 'negative' ? 'a11y-widget__item--active' : ''}`}
                aria-pressed={mode === 'negative'}
                onClick={() => toggleMode('negative')}
              >
                <MdVisibility className="a11y-widget__icon" aria-hidden="true" />
                <span>{t('a11y.negatif')}</span>
              </button>
            </li>

            {/* Réinitialisation : remet la taille de police à 100% et supprime le mode visuel */}
            <li>
              <button
                type="button"
                className="a11y-widget__item a11y-widget__item--reset"
                onClick={reset}
              >
                <FiRotateCcw className="a11y-widget__icon" aria-hidden="true" />
                <span>{t('a11y.reinitialiser')}</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
