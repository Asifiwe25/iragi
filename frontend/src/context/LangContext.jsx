// context/LangContext.jsx
import { createContext, useContext, useState } from 'react';
import { translations, defaultLang } from '../i18n/translations';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('iragi_lang') || defaultLang);
  const t = (key) => translations[lang]?.[key] || translations['fr']?.[key] || key;
  const changeLang = (l) => { setLang(l); localStorage.setItem('iragi_lang', l); };
  return (
    <LangContext.Provider value={{ lang, t, changeLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
