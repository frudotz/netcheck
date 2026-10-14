import React from "react";
import { Globe } from "lucide-react";
import { useI18n } from "../i18n";
import { Lang } from "../domain/types";

export const LangSwitch: React.FC = () => {
  const { locale, setLocale, t } = useI18n();

  const languages: { code: Lang; name: string }[] = [
    { code: "tr", name: "Türkçe" },
    { code: "en", name: "English" },
    { code: "ar", name: "العربية" },
    { code: "fa", name: "فارسی" },
  ];

  return (
    <div className="relative inline-flex items-center">
      <label htmlFor="lang-selector" className="sr-only">
        {t("language")}
      </label>
      <div className="relative flex items-center">
        <Globe
          className="absolute left-2.5 w-3.5 h-3.5 pointer-events-none"
          style={{ color: "var(--yazi-soluk)" }}
          aria-hidden="true"
        />
        <select
          id="lang-selector"
          value={locale}
          onChange={e => setLocale(e.target.value as Lang)}
          className="cursor-pointer text-xs font-medium pl-8 pr-3 py-1.5 rounded-lg border appearance-none transition-colors focus-visible:outline-none"
          style={{
            backgroundColor: "var(--zemin)",
            borderColor: "var(--kenar)",
            color: "var(--yazi)",
          }}
        >
          {languages.map(l => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
