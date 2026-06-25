// ============================================================
// i18n.js — Configuration du système de traduction (i18next)
//
// 5 langues supportées : fr (défaut), en, ar, tr, ru
// La langue est détectée automatiquement depuis localStorage
// puis depuis les préférences du navigateur (navigator.language).
// fallbackLng: 'fr' → utilisé si la langue détectée n'est pas dans supportedLngs.
// ============================================================
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
// resolveJsonModule + vite : les imports JSON sont typés automatiquement.
// Le payload est un Record<string, unknown> imbriqué — utilisé via les clés
// `form.benevole.DOMAINES`, etc., dans les composants.
import fr from './locales/fr/translation.json';
import en from './locales/en/translation.json';
import ar from './locales/ar/translation.json';
import tr from './locales/tr/translation.json';
import ru from './locales/ru/translation.json';
void i18n
  // Utilise le détecteur de langue (localStorage → navigator → fallback)
  .use(LanguageDetector)
  // Connecte i18next à React (active useTranslation, Trans, etc.)
  .use(initReactI18next)
  .init({
    // Toutes les traductions regroupées par langue
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      ar: { translation: ar },
      tr: { translation: tr },
      ru: { translation: ru },
    },
    // Langue utilisée si la langue détectée n'est pas disponible
    fallbackLng: 'fr',
    // Seules ces langues sont acceptées (évite les tentatives avec 'fr-FR', etc.)
    supportedLngs: ['fr', 'en', 'ar', 'tr', 'ru'],
    // escapeValue: false → React échappe déjà les valeurs, pas besoin de double-échappement
    interpolation: { escapeValue: false },
    // Ordre de détection : localStorage d'abord, puis langue du navigateur
    // caches: ['localStorage'] → sauvegarde la langue choisie entre les sessions
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  });
export default i18n;
