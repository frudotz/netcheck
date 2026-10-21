import React from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme, type Theme } from "../context/ThemeContext";
import { useI18n } from "../i18n";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: t("themeLight"), icon: <Sun className="w-3.5 h-3.5" /> },
    { value: "dark", label: t("themeDark"), icon: <Moon className="w-3.5 h-3.5" /> },
    { value: "system", label: t("themeSystem"), icon: <Laptop className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className="inline-flex items-center p-0.5 rounded-lg border text-xs bg-zemin border-kenar"
      role="radiogroup"
      aria-label={t("theme")}
    >
      {options.map(opt => {
        const isSelected = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={opt.label}
            onClick={() => setTheme(opt.value)}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
              isSelected ? "bg-kart text-yazi shadow-xs" : "text-yazi-soluk"
            }`}
            title={opt.label}
          >
            {opt.icon}
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
