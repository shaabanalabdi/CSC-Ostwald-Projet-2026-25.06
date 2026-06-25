// ============================================================
// Projets.jsx — Page "Projets" du CSC Ostwald
//
// Guide les visiteurs qui veulent monter un projet au centre.
// Structure en 5 sections :
//   1. Hero         → titre + accroche
//   2. Idée projet  → 4 catégories de projets possibles (avec images)
//   3. Étapes       → comment ça se passe (4 étapes numérotées)
//   4. Premiers pas → 3 questions de démarrage
//   5. CTA final    → phrase d'accroche finale
// ============================================================
import PageSEO from '@components/layout/PageSEO';
import SectionTitle from '@components/ui/SectionTitle';
import CSCCard from '@components/ui/CSCCard';
import TextReveal from '@components/ui/TextReveal';
import { useTranslation } from 'react-i18next';
import './Projets.scss';
// TODO: remplacer ces imports par les vraies images de chaque catégorie.
// `event-jeunes.webp` est réutilisé pour Sport et Digital en attendant des
// photos dédiées — un seul import suffit (no-duplicate-imports).
import imgJeunes from '@assets/images/event-jeunes.webp';
import imgCulture from '@assets/images/event-enfants.webp';
import imgLoisirs from '@assets/images/ostwald-ville.png';
// 4 catégories de projets — chaque 'key' correspond aux clés i18n projets.{key} et projets.{key}Desc
const categories = [
  { key: 'sport', img: imgJeunes },
  { key: 'culture', img: imgCulture },
  { key: 'loisirs', img: imgLoisirs },
  { key: 'digital', img: imgJeunes },
];
// 4 étapes du processus de projet — les clés i18n suivent le schéma projets.{key} / projets.{key}Desc
const etapes = ['pitch', 'organisation', 'coupDePouce', 'realisation'];
// 3 informations pratiques (Où ? Quand ? Avec qui ?)
// label → clé de la question | val → clé de la réponse
const infos = [
  { label: 'ou', val: 'ouVal' },
  { label: 'quand', val: 'quandVal' },
  { label: 'avecQui', val: 'avecQuiVal' },
];
/** Palette des bulles de questions « Tes premiers pas » (couleurs visuelles
 *  internes à .projets__question--*, indépendantes du système CSCBadge). */
const QUESTION_COLORS = ['green', 'navy', 'orange'];
export default function Projets() {
  const { t } = useTranslation();
  return (
    <>
      {/* Balises SEO pour cette page */}
      <PageSEO title={t('projets.pageTitle')} description={t('projets.heroIntro')} url="/projets" />

      {/* ── 1. HERO ── */}
      <section className="projets__hero">
        <h1 className="projets__hero-title">{t('projets.heroTitle')}</h1>
        <TextReveal text={t('projets.heroIntro')} as="p" className="projets__hero-intro" />
      </section>

      {/* ── 2. C'EST QUOI UNE IDÉE PROJET ? ── */}
      <section className="projets__idee">
        <div className="container">
          <SectionTitle variant="orange" className="projets__section-title">
            {t('projets.ideeTitre')}
          </SectionTitle>
          <p className="projets__section-intro">{t('projets.ideeIntro')}</p>

          {/* Grille des 4 catégories — utilise <CSCCard> unifié + tilt 3D */}
          <div className="projets__categories">
            {categories.map(({ key, img }) => (
              <CSCCard
                key={key}
                variant="elevated"
                interactive
                tilt3D
                className="projets__categorie-card"
              >
                <CSCCard.Image src={img} alt="" width="400" height="300" />
                <CSCCard.Body>
                  <CSCCard.Title as="strong" className="projets__categorie-titre">
                    {t(`projets.${key}`)}
                  </CSCCard.Title>
                  <CSCCard.Description className="projets__categorie-desc">
                    {t(`projets.${key}Desc`)}
                  </CSCCard.Description>
                </CSCCard.Body>
              </CSCCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. COMMENT ÇA SE PASSE ? — 4 étapes numérotées ── */}
      <section className="projets__etapes">
        <div className="container">
          <SectionTitle variant="green" className="projets__section-title">
            {t('projets.etapesTitre')}
          </SectionTitle>
          <p className="projets__section-intro">{t('projets.etapesIntro')}</p>

          <div className="projets__steps">
            {etapes.map((key, i) => (
              <div key={key} className="projets__step spotlight-card">
                {/* Numéro d'étape (1, 2, 3, 4) */}
                <span className="projets__step-num">{i + 1}</span>
                <strong className="projets__step-titre">{t(`projets.${key}`)}</strong>
                <p className="projets__step-desc">{t(`projets.${key}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. TES PREMIERS PAS — 3 questions d'auto-réflexion ── */}
      <section className="projets__premiers-pas">
        <div className="container">
          <SectionTitle variant="blue" className="projets__section-title">
            {t('projets.premiersTitre')}
          </SectionTitle>
          {/* Citation d'accroche */}
          <p className="projets__quote">{t('projets.quote')}</p>
          <p className="projets__section-intro">{t('projets.premiersIntro')}</p>

          {/* 3 bulles de questions colorées (vert, bleu marine, orange) */}
          <div className="projets__questions">
            {['q1', 'q2', 'q3'].map((k, i) => (
              <div
                key={k}
                // La couleur et le décalage vertical varient selon l'index
                className={`projets__question projets__question--${QUESTION_COLORS[i]} projets__question--step-${i}`}
              >
                {t(`projets.${k}`)}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. PRÊT(E) À PASSER À L'ACTION ? — infos pratiques ── */}
      <section className="projets__action">
        <div className="container">
          <SectionTitle variant="blue" className="projets__section-title">
            {t('projets.actionTitre')}
          </SectionTitle>
          <p className="projets__section-intro">{t('projets.actionIntro')}</p>

          {/* Paires question/réponse : Où ? / Au centre · Quand ? / Sur RDV... */}
          <div className="projets__infos">
            {infos.map(({ label, val }) => (
              <div key={label} className="projets__info-pair">
                <span className="projets__info-label">{t(`projets.${label}`)}</span>
                <span className="projets__info-value">{t(`projets.${val}`)}</span>
              </div>
            ))}
          </div>

          <p className="projets__cta-text">{t('projets.ctaFinal')}</p>
        </div>
      </section>
    </>
  );
}
