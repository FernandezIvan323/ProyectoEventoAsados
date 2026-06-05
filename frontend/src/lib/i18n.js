import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es.json';
import en from './locales/en.json';

const STORAGE_KEY = 'asamapp_locale';

function detectLocale() {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (stored) return stored;
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'es';
  return nav.toLowerCase().startsWith('en') ? 'en' : 'es';
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng: detectLocale(),
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
    returnNull: false,
  });

export function setLocale(locale) {
  i18n.changeLanguage(locale);
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, locale);
}

export function getLocale() {
  return i18n.language || 'es';
}

export default i18n;
