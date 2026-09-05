import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Language,
  Translations,
  translations,
  translateCategory,
  translateUnit,
} from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof Translations) => string;
  transCategory: (cat: string) => string;
  transUnit: (unit: string) => string;
  formatCurrency: (amount: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('smartsavdo_lang');
    if (saved === 'uz-cyrl' || saved === 'uz-latn') {
      return saved;
    }
    return 'uz-latn';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('smartsavdo_lang', lang);
  };

  const toggleLanguage = () => {
    const nextLang: Language = language === 'uz-latn' ? 'uz-cyrl' : 'uz-latn';
    setLanguage(nextLang);
  };

  const t = (key: keyof Translations): string => {
    const dict = translations[language] || translations['uz-latn'];
    return dict[key] || translations['uz-latn'][key] || String(key);
  };

  const transCategory = (cat: string) => {
    return translateCategory(cat, language);
  };

  const transUnit = (unit: string) => {
    return translateUnit(unit, language);
  };

  const formatCurrency = (amount: number): string => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return language === 'uz-cyrl' ? '0 сўм' : "0 so'm";
    }
    const formatted = Math.round(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const suffix = language === 'uz-cyrl' ? 'сўм' : "so'm";
    return `${formatted} ${suffix}`;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        transCategory,
        transUnit,
        formatCurrency,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

/**
 * Reusable Language Switcher component with dual-pill or single-pill toggle design
 */
export const LanguageSwitcher: React.FC<{
  className?: string;
  variant?: 'compact' | 'full' | 'toggle';
}> = ({ className = '', variant = 'compact' }) => {
  const { language, setLanguage } = useLanguage();

  if (variant === 'toggle') {
    const isLatn = language === 'uz-latn';
    return (
      <button
        type="button"
        id="btn-lang-toggle-compact"
        onClick={() => setLanguage(isLatn ? 'uz-cyrl' : 'uz-latn')}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all shrink-0 whitespace-nowrap shadow-xs ${className}`}
        title={isLatn ? "Кирилл алифбосига ўтиш (Ўзбекча)" : "Lotin alifbosiga o'tish (O'zbekcha)"}
      >
        <span className="text-emerald-400 font-bold text-xs">🌐</span>
        <span className="font-bold text-emerald-400">{isLatn ? "O'zb" : "Ўзб"}</span>
      </button>
    );
  }

  return (
    <div
      id="language-switcher-pill"
      className={`inline-flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-800 shadow-inner shrink-0 whitespace-nowrap ${className}`}
      role="group"
      aria-label="Til tanlash"
    >
      <button
        type="button"
        id="btn-lang-latn"
        onClick={() => setLanguage('uz-latn')}
        className={`px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 whitespace-nowrap ${
          language === 'uz-latn'
            ? 'bg-emerald-500 text-slate-950 shadow-xs font-bold'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
        title="O'zbekcha (Lotin)"
      >
        {variant === 'full' ? "O'zbekcha" : 'Lotin'}
      </button>

      <button
        type="button"
        id="btn-lang-cyrl"
        onClick={() => setLanguage('uz-cyrl')}
        className={`px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 whitespace-nowrap ${
          language === 'uz-cyrl'
            ? 'bg-emerald-500 text-slate-950 shadow-xs font-bold'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
        title="Ўзбекча (Кирилл)"
      >
        {variant === 'full' ? 'Ўзбекча' : 'Кирилл'}
      </button>
    </div>
  );
};
