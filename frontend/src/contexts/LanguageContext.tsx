import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '@/i18n/translations';

export type Language = 'en' | 'vi' | 'zh' | 'ko' | 'ja';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_KEY = 'englishskill-lang';
const SUPPORTED_LANGS: Language[] = ['en', 'vi', 'zh', 'ko', 'ja'];

function getBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language.split('-')[0].toLowerCase();
  
  if (SUPPORTED_LANGS.includes(browserLang as Language)) {
    return browserLang as Language;
  }
  
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LANG_KEY) as Language;
      if (stored && SUPPORTED_LANGS.includes(stored)) {
        return stored;
      }
    }
    return getBrowserLanguage();
  });

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (newLang: Language) => {
    if (SUPPORTED_LANGS.includes(newLang)) {
      setLangState(newLang);
    }
  };

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const langTranslations = translations[lang];
    let template = "";

    if (langTranslations && key in langTranslations) {
      const val = langTranslations[key as keyof typeof langTranslations];
      if (typeof val === 'string') template = val;
    } else {
      // Fallback to English
      const enTranslations = translations['en'];
      if (enTranslations && key in enTranslations) {
        const val = enTranslations[key as keyof typeof enTranslations];
        if (typeof val === 'string') template = val;
      } else {
        // Return key if no translation found
        return key;
      }
    }

    if (!variables) return template;

    // Replace {variable} with value
    return Object.entries(variables).reduce((acc, [key, value]) => {
      return acc.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }, template);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
