// ============================================================
// Hero.jsx — Carrousel plein écran de la page d'accueil.
//
// Chaque slide (titre + sous-titre + fond optionnel) provient de la
// table `hero_slide`, éditable depuis /admin/hero. Tant que la requête
// charge — ou si la base est vide / l'API indisponible — on retombe sur
// les 2 slides historiques traduites via i18n : le Hero est l'élément
// LCP de la page, il ne doit JAMAIS s'afficher vide.
//
// Fond de slide : image, vidéo, ou rien (le dégradé orange de Hero.scss
// `.hero::before` sert alors de fond — et de repli si un média ne charge
// pas). Le fond vidéo respecte la pause manuelle et prefers-reduced-motion.
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiPause, FiPlay } from 'react-icons/fi';
import { m, AnimatePresence, useReducedMotion } from 'framer-motion';
import useMotionPresets from '@hooks/useMotionPresets';
import { usePublicHero } from '@features/hero';
import { resolveStaticUrl } from '@api/client';
import CSCBadge from '@components/ui/CSCBadge';
import SectionTitle from '@components/ui/SectionTitle';
import AmbientBubbles from '@components/ui/AmbientBubbles';
import Magnetic from '@components/ui/Magnetic';
import GradientMesh from '@components/ui/GradientMesh';
import GrainTexture from '@components/ui/GrainTexture';
import useParallax from '@hooks/useParallax';
import useDeferredMount from '@hooks/useDeferredMount';
import './Hero.scss';

export default function Hero() {
  const { t } = useTranslation();
  const { heroSlide, bubbleHover } = useMotionPresets();
  const reduceMotion = useReducedMotion();
  // showDecor : false pendant ~50-200ms après le premier paint, puis true.
  // Garantit que Lighthouse mesure un LCP stable (le titre Hero) avant
  // que GradientMesh/AmbientBubbles/GrainTexture n'apparaissent.
  const showDecor = useDeferredMount();
  // Parallax : le bloc bubbles/CTAs se déplace légèrement avec le scroll
  // pour créer une sensation de profondeur. Force = 50px max → subtil.
  const { ref: parallaxRef, y: parallaxY } = useParallax(50);
  // Index de la slide actuellement affichée.
  const [current, setCurrent] = useState(0);
  // Pause manuelle (WCAG 2.2.2 Pause, Stop, Hide) — fige le carrousel
  // auto-avançant ET le fond vidéo.
  const [paused, setPaused] = useState(false);
  // Référence vers l'élément <video> de la slide courante (s'il y en a un),
  // pour piloter play/pause depuis l'effet ci-dessous.
  const videoRef = useRef(null);

  // Slides du carrousel — éditées depuis /admin/hero (table hero_slide).
  // Repli sur les 2 slides historiques (clés i18n `hero.slide*`) tant que
  // la requête charge, si la base est vide, ou si l'API est indisponible.
  const { data: heroData } = usePublicHero();
  const fallbackSlides = [
    { id: 'fallback-1', title: t('hero.slide1Title'), subtitle: t('hero.slide1Subtitle') },
    { id: 'fallback-2', title: t('hero.slide2Title'), subtitle: t('hero.slide2Subtitle') },
  ];
  const slides = Array.isArray(heroData) && heroData.length > 0 ? heroData : fallbackSlides;
  const slideCount = slides.length;

  // Avance automatiquement toutes les 8 secondes — SAUF si :
  //   1) prefers-reduced-motion est activé,
  //   2) l'utilisateur a mis le carrousel en pause,
  //   3) il n'y a qu'une seule slide.
  // WCAG 2.2.2 Niveau A : le bouton pause de .hero__dots couvre le critère
  // « contenu auto-avançant > 5 s ».
  useEffect(() => {
    if (reduceMotion || paused || slideCount <= 1) return;
    const timer = window.setInterval(() => {
      setCurrent((c) => (c + 1) % slideCount);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [reduceMotion, paused, slideCount]);

  // Index sûr : si `current` dépasse le nombre de slides (admin qui en
  // supprime, ou bascule du repli i18n vers des données DB plus courtes),
  // on retombe sur 0 — calculé au render, sans effet ni setState.
  const safeCurrent = current < slideCount ? current : 0;
  const slide = slides[safeCurrent];
  const slideHasVideo = slide.media_type === 'video' && Boolean(slide.media_url);
  const slideHasImage = slide.media_type === 'image' && Boolean(slide.media_url);

  // Pilote la lecture du fond vidéo : on ne s'appuie pas uniquement sur
  // l'attribut `autoplay` afin qu'un clic sur pause (ou prefers-reduced-
  // motion) fige aussi la vidéo — WCAG 2.2.2.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused || reduceMotion) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [paused, reduceMotion, safeCurrent]);

  // Change la slide active. framer-motion s'occupe de l'animation crossfade.
  const goToSlide = (index) => {
    if (index === safeCurrent) return;
    setCurrent(index);
  };

  // Les points de navigation n'ont de sens qu'à partir de 2 slides. Le
  // bouton pause, lui, doit aussi apparaître pour une slide unique dotée
  // d'un fond vidéo (WCAG 2.2.2 — contenu vidéo en lecture automatique).
  const showDots = slideCount > 1;
  const showPause = !reduceMotion && (slideCount > 1 || slideHasVideo);

  return (
    // Section principale accessible, identifiable par l'ancre #accueil.
    // `ref` sert au useParallax pour calculer la progression du scroll local.
    <section className="hero" id="accueil" aria-label="Section principale" ref={parallaxRef}>
      {/* Décors atmosphériques : montés UNIQUEMENT après le premier paint,
            pour ne pas perturber la mesure LCP de Lighthouse. Masqués
            visuellement quand la slide a un fond média plein cadre. */}
      {showDecor && (
        <>
          <GradientMesh variant="warm" />
          <AmbientBubbles count={8} seed={42} />
          <GrainTexture opacity={0.06} />
        </>
      )}

      {/* Fond de la slide courante : image ou vidéo, derrière l'overlay.
            Le dégradé orange (Hero.scss .hero::before) reste le repli quand
            le type est « none » ou si le média ne charge pas. La clé inclut
            l'index pour forcer le rechargement / redémarrage à chaque slide. */}
      {slideHasImage && (
        <img
          key={`media-${safeCurrent}`}
          className="hero__media"
          src={resolveStaticUrl(slide.media_url)}
          alt=""
          aria-hidden="true"
        />
      )}
      {slideHasVideo && (
        <video
          key={`media-${safeCurrent}`}
          ref={videoRef}
          className="hero__media"
          src={resolveStaticUrl(slide.media_url)}
          autoPlay={!reduceMotion}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      )}

      {/* Overlay sombre pour améliorer la lisibilité du texte sur le fond. */}
      <div className="hero__overlay" aria-hidden="true" />

      {/* AnimatePresence crossfade entre slides.
            key={safeCurrent} (l'index, pas l'id) : le passage du repli i18n
            aux données DB conserve le même index → pas de crossfade parasite
            au chargement ; seul un vrai changement de slide anime. */}
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={safeCurrent}
          className="hero__content"
          {...heroSlide}
          // Parallax léger : le contenu monte/descend de ±50px avec le scroll
          // pendant que le fond reste fixe → effet de profondeur (depth).
          style={{ y: parallaxY }}
        >
          <div className="csc-bubble-stack hero__bubbles">
            <SectionTitle level={1} variant="orange" size="xl" className="hero__title">
              {slide.title}
            </SectionTitle>
            <CSCBadge variant="blue" size="lg" tab="top" shadow className="hero__subtitle">
              {slide.subtitle}
            </CSCBadge>
          </div>

          {/* Deux CTA en bubble : wrappés Magnetic pour effet d'attraction
            curseur. Cibles fixes (structure du site) — non éditables. */}
          <div className="hero__actions">
            <Magnetic strength={0.3}>
              <m.a
                href="#agenda"
                className="btn-bubble btn-bubble--orange csc-bubble--shadow hero__btn"
                {...bubbleHover}
              >
                {t('hero.voirEvenements')}
              </m.a>
            </Magnetic>
            <Magnetic strength={0.3}>
              <Link
                to="/contact"
                className="btn-bubble btn-bubble--blue csc-bubble--shadow hero__btn"
              >
                {t('hero.nousContacter')}
              </Link>
            </Magnetic>
          </div>
        </m.div>
      </AnimatePresence>

      {/* Points de navigation (dots) + bouton pause/play (WCAG 2.2.2). */}
      {(showDots || showPause) && (
        <div className="hero__dots" role="group" aria-label="Diapositives">
          {showDots &&
            slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                id={`hero-dot-${i}`}
                className={`hero__dot ${i === safeCurrent ? 'hero__dot--active' : ''}`}
                onClick={() => goToSlide(i)}
                aria-current={i === safeCurrent ? 'true' : undefined}
                aria-label={`${t('hero.diapositive', { defaultValue: 'Diapositive' })} ${i + 1}`}
              />
            ))}
          {showPause && (
            <button
              type="button"
              className="hero__pause"
              onClick={() => setPaused((p) => !p)}
              aria-label={
                paused
                  ? t('hero.lirePause', { defaultValue: 'Reprendre' })
                  : t('hero.pause', { defaultValue: 'Mettre en pause' })
              }
              aria-pressed={paused}
            >
              {paused ? <FiPlay aria-hidden="true" /> : <FiPause aria-hidden="true" />}
            </button>
          )}
        </div>
      )}

      {/* Indicateur « scroll » : chevron animé en bas du hero qui invite à
            continuer la découverte. Pointe vers #agenda (la section suivante). */}
      <a href="#agenda" className="hero__scroll-hint" aria-label={t('hero.voirEvenements')}>
        <span className="hero__scroll-hint-dot" aria-hidden="true" />
      </a>
    </section>
  );
}
