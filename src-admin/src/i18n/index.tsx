import React, { createContext, useContext, useState, useEffect } from "react";
import { Lang } from "../domain/types";
import { tr, Translations } from "./tr";
import { en } from "./en";
import { ar } from "./ar";
import { fa } from "./fa";

const dictionaries: Record<Lang, Translations> = {
  tr,
  en,
  ar,
  fa,
  de: en, // fallback
};

interface I18nContextType {
  locale: Lang;
  setLocale: (lang: Lang) => void;
  isRtl: boolean;
  t: (key: keyof Translations, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "netcheck-admin:locale";

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === "tr" || saved === "en" || saved === "ar" || saved === "fa")) {
      return saved as Lang;
    }
    return "tr";
  });

  const isRtl = locale === "ar" || locale === "fa";

  const setLocale = (lang: Lang) => {
    setLocaleState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
  }, [locale, isRtl]);

  const t = (key: keyof Translations, params?: Record<string, string | number>): string => {
    const dict = dictionaries[locale] || dictionaries.tr;
    let text = (dict[key] as string) || (dictionaries.tr[key] as string) || (key as string);
    if (params) {
      Object.entries(params).forEach(([k, val]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(val));
      });
    }
    return text;
  };

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
