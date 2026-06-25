// ============================================================
// accessibilityStore.jsx — Contexte global d'accessibilité
// Partage les préférences visuelles dans toute l'application
// (taille de police, mode visuel) via React Context.
// Utilisé dans : AccessibilityWidget, Layout
// ============================================================
import { createContext, useContext, useState, useEffect } from 'react';
/**
 * Tuple littéral utilisé pour la validation à l'exécution depuis localStorage
 * (qui ne renvoie que des `string` — il faut vérifier que la valeur stockée
 * est bien un mode connu avant de la rétablir dans l'état).
 */
const VALID_MODES = ['grayscale', 'high-contrast', 'negative'];
/** Bornes de la taille de police pilotée par le widget (en %). */
const FONT_SIZE_MIN = 70;
const FONT_SIZE_MAX = 150;
const FONT_SIZE_STEP = 10;
const FONT_SIZE_DEFAULT = 100;
const AccessibilityContext = createContext(null);
export function AccessibilityProvider({ children }) {
  const [fontSize, setFontSize] = useState(() => {
    try {
      const stored = localStorage.getItem('a11y-fontSize');
      const parsed = parseInt(stored ?? String(FONT_SIZE_DEFAULT), 10);
      return isNaN(parsed) ? FONT_SIZE_DEFAULT : parsed;
    } catch {
      return FONT_SIZE_DEFAULT;
    }
  });
  const [mode, setMode] = useState(() => {
    try {
      const stored = localStorage.getItem('a11y-mode');
      // Validation à l'exécution : localStorage peut contenir n'importe quelle
      // string (corrompue, périmée, valeur d'une autre version), on ne fait
      // confiance qu'aux valeurs présentes dans VALID_MODES.
      return stored && VALID_MODES.includes(stored) ? stored : null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`;
    // localStorage.setItem n'accepte que des string — conversion explicite
    // (en JS la coercion implicite passait, en TS strict elle est interdite).
    localStorage.setItem('a11y-fontSize', String(fontSize));
  }, [fontSize]);
  useEffect(() => {
    document.body.classList.remove(...VALID_MODES.map((m) => `a11y-${m}`));
    if (mode) {
      document.body.classList.add(`a11y-${mode}`);
      localStorage.setItem('a11y-mode', mode);
    } else {
      localStorage.removeItem('a11y-mode');
    }
  }, [mode]);
  const increaseFontSize = () => setFontSize((f) => Math.min(f + FONT_SIZE_STEP, FONT_SIZE_MAX));
  const decreaseFontSize = () => setFontSize((f) => Math.max(f - FONT_SIZE_STEP, FONT_SIZE_MIN));
  const toggleMode = (m) => setMode((prev) => (prev === m ? null : m));
  const reset = () => {
    setFontSize(FONT_SIZE_DEFAULT);
    setMode(null);
    document.documentElement.style.fontSize = '';
    localStorage.removeItem('a11y-fontSize');
    localStorage.removeItem('a11y-mode');
  };
  const value = {
    fontSize,
    mode,
    increaseFontSize,
    decreaseFontSize,
    toggleMode,
    reset,
  };
  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}
/**
 * Hook pour accéder au contexte d'accessibilité.
 *
 * @example
 *   const { fontSize, toggleMode, reset } = useAccessibilityStore();
 *
 * @throws Si appelé en dehors d'un `<AccessibilityProvider>`.
 */
// react-refresh préférerait un fichier par export (composant/hook séparés).
// Pour ce store léger, on garde tout dans un seul fichier. Coût : HMR less
// granulaire sur ce module — acceptable pour un contexte d'a11y rarement modifié.
// eslint-disable-next-line react-refresh/only-export-components
export function useAccessibilityStore() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibilityStore doit être utilisé dans <AccessibilityProvider>');
  return ctx;
}
