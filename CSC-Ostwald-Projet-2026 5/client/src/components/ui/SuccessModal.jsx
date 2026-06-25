// ============================================================
// SuccessModal.jsx — Modale de confirmation réutilisable (3 formulaires)
//
// Pattern : overlay sombre + content centré + AnimatePresence (mount/unmount).
// Accessibilité : role="dialog", aria-modal, focus trap, Escape close,
// restauration du focus sur l'élément déclencheur au close.
// ============================================================
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
import useMotionPresets from '@hooks/useMotionPresets';
import AnimatedCheckmark from './AnimatedCheckmark';
import './SuccessModal.scss';
/** Sélecteur des éléments focusables à l'intérieur de la modale (focus trap). */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
export default function SuccessModal({
  show,
  onClose,
  titleId,
  title,
  children,
  returnTo,
  returnLabel,
  variant = 'green',
}) {
  // Mémorise l'élément qui avait le focus avant ouverture (restauré au close).
  // `document.activeElement` retourne `Element | null` ; on accepte tout type
  // d'élément focusable via le test `'focus' in current`.
  const previousFocus = useRef(null);
  const dialogRef = useRef(null);
  const { modalBackdrop, modalContent } = useMotionPresets();
  // Focus management : mémo + Escape + focus trap (Tab cyclé dans la modale).
  useEffect(() => {
    if (!show) return;
    // 1) Mémorise l'élément qui avait le focus avant ouverture
    previousFocus.current = document.activeElement;
    // 2) Met le focus sur le 1er élément focusable de la modale.
    //    setTimeout(0) attend que le DOM/animation soit rendu avant de focus.
    const focusFirstElement = window.setTimeout(() => {
      const focusable = dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
      focusable?.[0]?.focus();
    }, 0);
    // 3) Échap ferme la modale + Tab cyclé dans la modale (focus trap WCAG 2.4.3)
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      // Shift+Tab sur 1er → boucle au dernier ; Tab sur dernier → boucle au 1er
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusFirstElement);
      document.removeEventListener('keydown', handleKeyDown);
      // Restaure le focus sur l'élément déclencheur (e.g. le bouton submit).
      // Cast via type guard : Element n'a pas .focus(), HTMLElement oui.
      const prev = previousFocus.current;
      if (prev && prev instanceof HTMLElement) prev.focus();
    };
  }, [show, onClose]);
  return (
    <AnimatePresence>
      {show && (
        <m.div
          className={`success-modal__overlay success-modal__overlay--${variant}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={onClose}
          {...modalBackdrop}
        >
          <m.div
            ref={dialogRef}
            className={`success-modal success-modal--${variant}`}
            onClick={(e) => e.stopPropagation()}
            {...modalContent}
          >
            <div className="success-modal__icon" aria-hidden="true">
              <AnimatedCheckmark
                className={`success-modal__checkmark success-modal__checkmark--${variant}`}
              />
            </div>
            <h2 id={titleId}>{title}</h2>
            {children}
            <Link to={returnTo} className={`success-modal__btn success-modal__btn--${variant}`}>
              {returnLabel}
            </Link>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
