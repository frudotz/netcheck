import React from "react";
import { useTheme, type Theme } from "../context/ThemeContext";
import { useI18n } from "../i18n";
import { useDensity, type Density } from "../context/DensityContext";
import { LOCALES, localeName, dirOf } from "../../src/lib/i18n";
import { bagli } from "../api";
import { Sun, Moon, Laptop, Globe, LayoutGrid, CheckCircle2, Unplug } from "lucide-react";

// Panelin yerel tercihleri. Tema ve dil uygulamayla ortaktır (aynı localStorage anahtarları);
// tablo yoğunluğu yalnız panele aittir. Veri kaynağı gerektiren bir ayar burada yoktur.
export const SettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const { density, setDensity } = useDensity();

  const themeOptions: { value: Theme; title: string; desc: string; icon: React.ReactNode }[] = [
    { value: "light", title: t("themeLight"), desc: t("settingsThemeLightDesc"), icon: <Sun className="w-5 h-5" /> },
    { value: "dark", title: t("themeDark"), desc: t("settingsThemeDarkDesc"), icon: <Moon className="w-5 h-5" /> },
    { value: "system", title: t("themeSystem"), desc: t("settingsThemeSystemDesc"), icon: <Laptop className="w-5 h-5" /> },
  ];

  const densityOptions: { value: Density; title: string; desc: string }[] = [
    { value: "compact", title: t("densityCompact"), desc: t("settingsDensityCompactDesc") },
    { value: "default", title: t("densityDefault"), desc: t("settingsDensityDefaultDesc") },
    { value: "comfortable", title: t("densityComfortable"), desc: t("settingsDensityComfortableDesc") },
  ];

  const secenekSinifi = (secili: boolean) =>
    `cursor-pointer rounded-xl text-start transition-all ${
      secili ? "bg-zemin border-2 border-ana" : "bg-kart border border-kenar"
    }`;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-yazi">{t("navSettings")}</h1>
        <p className="text-xs sm:text-sm mt-0.5 text-yazi-soluk">{t("settingsSubtitle")}</p>
      </div>

      <section
        aria-labelledby="ayar-tema"
        className="p-5 border space-y-4 bg-kart border-kenar"
        style={{ borderRadius: "var(--radius)" }}
      >
        <div className="border-b pb-3 border-kenar">
          <h2 id="ayar-tema" className="text-base font-bold text-yazi">
            {t("theme")}
          </h2>
          <p className="text-xs mt-0.5 text-yazi-soluk">{t("settingsThemeDesc")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-labelledby="ayar-tema">
          {themeOptions.map(opt => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setTheme(opt.value)}
                className={`${secenekSinifi(isSelected)} p-4 flex flex-col justify-between gap-3`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${isSelected ? "bg-ana text-ana-yazi" : "bg-zemin text-yazi-soluk"}`}>
                    {opt.icon}
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-ana" aria-hidden="true" />}
                </div>
                <div>
                  <span className="font-semibold text-sm block text-yazi">{opt.title}</span>
                  <span className="text-xs mt-0.5 block leading-relaxed text-yazi-soluk">{opt.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="ayar-dil"
        className="p-5 border space-y-4 bg-kart border-kenar"
        style={{ borderRadius: "var(--radius)" }}
      >
        <div className="border-b pb-3 border-kenar">
          <h2 id="ayar-dil" className="text-base font-bold flex items-center gap-2 text-yazi">
            <Globe className="w-4 h-4 text-ana" aria-hidden="true" />
            <span>{t("language")}</span>
          </h2>
          <p className="text-xs mt-0.5 text-yazi-soluk">{t("settingsLanguageDesc")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" role="radiogroup" aria-labelledby="ayar-dil">
          {LOCALES.map(code => {
            const isSelected = locale === code;
            return (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setLocale(code)}
                className={`${secenekSinifi(isSelected)} p-3.5 flex items-center justify-between`}
              >
                <div>
                  <span className="font-semibold text-xs sm:text-sm block text-yazi" lang={code}>
                    {localeName[code]}
                  </span>
                  <span className="text-[11px] text-yazi-soluk">
                    {dirOf(code) === "rtl" ? t("settingsDirRtl") : t("settingsDirLtr")}
                  </span>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-ana" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="ayar-yogunluk"
        className="p-5 border space-y-4 bg-kart border-kenar"
        style={{ borderRadius: "var(--radius)" }}
      >
        <div className="border-b pb-3 border-kenar">
          <h2 id="ayar-yogunluk" className="text-base font-bold flex items-center gap-2 text-yazi">
            <LayoutGrid className="w-4 h-4 text-ana" aria-hidden="true" />
            <span>{t("density")}</span>
          </h2>
          <p className="text-xs mt-0.5 text-yazi-soluk">{t("settingsDensityDesc")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-labelledby="ayar-yogunluk">
          {densityOptions.map(opt => {
            const isSelected = density === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setDensity(opt.value)}
                className={`${secenekSinifi(isSelected)} p-4 flex flex-col justify-between gap-2`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-yazi">{opt.title}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-ana" aria-hidden="true" />}
                </div>
                <span className="text-xs leading-relaxed text-yazi-soluk">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="ayar-kaynak"
        className="p-5 border space-y-2 bg-kart border-kenar"
        style={{ borderRadius: "var(--radius)" }}
      >
        <h2 id="ayar-kaynak" className="text-base font-bold flex items-center gap-2 text-yazi">
          <Unplug className="w-4 h-4 text-bilgi" aria-hidden="true" />
          <span>{t("settingsDataSource")}</span>
        </h2>
        <p className="text-sm text-yazi">{bagli ? t("settingsDataSourceSqlite") : t("settingsDataSourceNone")}</p>
        {!bagli && <p className="text-xs leading-relaxed text-yazi-soluk">{t("shellNotConnectedNext")}</p>}
      </section>
    </div>
  );
};
