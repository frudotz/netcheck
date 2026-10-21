import React from "react";
import { Globe } from "lucide-react";
import { useI18n } from "../i18n";
import { LOCALES, localeName } from "../../src/lib/i18n";
import type { Locale } from "../domain/types";

export const LangSwitch: React.FC = () => {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="relative inline-flex items-center">
      <label htmlFor="lang-selector" className="sr-only">
        {t("language")}
      </label>
      <div className="relative flex items-center">
        <Globe
          className="absolute start-2.5 w-3.5 h-3.5 pointer-events-none text-yazi-soluk"
          aria-hidden="true"
        />
        {/* Dil adları her dilde kendi yazımıyla gösterilir (src/lib/i18n.ts). */}
        <select
          id="lang-selector"
          value={locale}
          onChange={e => setLocale(e.target.value as Locale)}
          className="cursor-pointer text-xs font-medium ps-8 pe-3 py-1.5 rounded-lg border appearance-none transition-colors bg-zemin border-kenar text-yazi"
        >
          {LOCALES.map(code => (
            <option key={code} value={code} lang={code}>
              {localeName[code]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
