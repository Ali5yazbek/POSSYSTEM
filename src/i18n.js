// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Inline resources (your files)
import enTranslation from './components/locales/en/translation.json';
import arTranslation from './components/locales/ar/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      ar: { translation: arTranslation }
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    // Map en-US → en, ar-SA → ar, etc.
    nonExplicitSupportedLngs: true,
    // or: load: 'languageOnly',

    debug: false, // set true only while debugging

    detection: {
      // Persist user choice and prefer it on next load
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    },

    interpolation: { escapeValue: false },

    // Important: prevents “Loading…” lockups on refresh
    react: { useSuspense: false }
  });

// Keep <html> in sync for proper RTL/LTR + accessibility
i18n.on('languageChanged', (lng) => {
  const isRTL = lng === 'ar';
  document.documentElement.lang = lng;
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
});

export default i18n;
