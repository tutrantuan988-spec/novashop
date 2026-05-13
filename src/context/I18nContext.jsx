import { createContext, useContext, useEffect, useState } from 'react';
import translations from '../i18n/translations';

const I18nContext = createContext(null);
const LANG_KEY = 'trongdinhstore:lang';

function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window === 'undefined') return 'vi';
    return window.localStorage.getItem(LANG_KEY) || 'vi';
  });

  const t = translations[lang] || translations.vi;

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    window.localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  const toggleLang = () => setLang((prev) => (prev === 'vi' ? 'en' : 'vi'));

  return (
    <I18nContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export { I18nProvider, I18nContext };
