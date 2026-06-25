// ============================================================
// useMotionPresets.js — Presets framer-motion partagés
//
// Fournit des variants standards pour :
//   - sectionReveal  : fondu + slide up des sections au scroll
//   - staggerParent  : conteneur qui orchestre les enfants
//   - staggerChild   : enfants qui apparaissent en cascade
//   - modalBackdrop  : fond de modale (fondu)
//   - modalContent   : contenu de modale (spring scale)
//   - heroSlide      : transition entre slides du Hero
//   - bubbleHover    : micro-interaction au hover sur les CTAs
//
// Tous respectent prefers-reduced-motion automatiquement via useReducedMotion.
// ============================================================
import { useReducedMotion } from 'framer-motion';
// Tuple cubic-bezier signature CSC (ease-out smooth). Typé explicitement
// pour que framer-motion l'accepte comme BezierDefinition et non `number[]`.
const EASE_CSC = [0.16, 1, 0.3, 1];
export default function useMotionPresets() {
  const reduceMotion = useReducedMotion();
  // ─── Section reveal au scroll (fondu + slide up doux) ───────────
  const sectionReveal = reduceMotion
    ? {
        initial: { opacity: 1 },
        whileInView: { opacity: 1 },
        viewport: { once: true, margin: '-80px' },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-80px' },
        transition: { duration: 0.55, ease: EASE_CSC },
      };
  // ─── Parent stagger (conteneur grid/list) ────────────────────────
  const staggerParent = reduceMotion
    ? { initial: 'visible', whileInView: 'visible', viewport: { once: true } }
    : {
        initial: 'hidden',
        whileInView: 'visible',
        viewport: { once: true, margin: '-80px' },
        variants: {
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.08, delayChildren: 0.1 },
          },
        },
      };
  // ─── Child stagger (cards individuelles) ─────────────────────────
  const staggerChild = reduceMotion
    ? { variants: { hidden: { opacity: 1 }, visible: { opacity: 1 } } }
    : {
        variants: {
          hidden: { opacity: 0, y: 24 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: EASE_CSC },
          },
        },
      };
  // ─── Modal (backdrop fade + content spring) ──────────────────────
  const modalBackdrop = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.25 },
      };
  const modalContent = reduceMotion
    ? {
        initial: { opacity: 1, scale: 1 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 1, scale: 1 },
      }
    : {
        initial: { opacity: 0, scale: 0.92, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.96, y: 10 },
        transition: { type: 'spring', stiffness: 300, damping: 28 },
      };
  // ─── Hero slide transition (crossfade vertical) ──────────────────
  const heroSlide = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
        transition: { duration: 0.45, ease: EASE_CSC },
      };
  // ─── Bubble hover micro-interaction (CTA) ────────────────────────
  const bubbleHover = reduceMotion
    ? {}
    : {
        whileHover: { y: -3, scale: 1.03, rotate: -1 },
        whileTap: { y: 0, scale: 0.98, rotate: 0 },
        transition: { type: 'spring', stiffness: 400, damping: 25 },
      };
  return {
    reduceMotion,
    sectionReveal,
    staggerParent,
    staggerChild,
    modalBackdrop,
    modalContent,
    heroSlide,
    bubbleHover,
  };
}
