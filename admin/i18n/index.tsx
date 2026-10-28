import React, { createContext, useContext, useState, useEffect } from "react";
import type { Locale } from "../../src/lib/types";
import { dirOf, LOCALES } from "../../src/lib/i18n";
import { bicim } from "../../src/lib/sozluk";
import { tr, type Translations } from "./tr";
import { en } from "./en";
import { ar } from "./ar";
import { fa } from "./fa";

// Panel metinlerinin tek kaynağı tr.ts; diğer diller aynı anahtarları taşır (Translations tipi zorunlu kılar).
const dictionaries: Record<Locale, Translations> = { tr, en, ar, fa };

interface I18nContextType {
  locale: Locale;
  setLocale: (lang: Locale) => void;
  isRtl: boolean;
  t: (key: keyof Translations, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

// Uygulamanın dil seçimiyle aynı anahtar (src/lib/dil.svelte.ts): panelde seçilen dil uygulamada da geçerli.
const STORAGE_KEY = "dil";

function savedLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LOCALES.find(l => l === saved) ?? "tr";
  } catch {
    return "tr";
  }
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(savedLocale);

  const isRtl = dirOf(locale) === "rtl";

  const setLocale = (lang: Locale) => {
    setLocaleState(lang);
    try {
      if (lang === "tr") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Depolama kullanılamıyorsa seçim yalnızca bu oturumda geçerlidir.
    }
  };

  // Yer tutucular uygulamanın `bicim` işleviyle doldurulur: değer içindeki `$&` gibi diziler bozulmaz.
  const t = (key: keyof Translations, params?: Record<string, string | number>): string => {
    const text = dictionaries[locale][key];
    return params ? bicim(text, params) : text;
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirOf(locale);
    document.title = `${dictionaries[locale].adminPanel} · NetCheck`;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, isRtl, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
};
