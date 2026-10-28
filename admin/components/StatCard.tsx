import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useI18n } from "../i18n";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number; // e.g. +12.5 or -4.2
  changeLabel?: string;
  icon?: React.ReactNode;
  sparkline?: number[];
  tone?: "default" | "success" | "warning" | "danger";
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  sparkline,
  tone = "default",
}) => {
  const { t } = useI18n();
  let accentColor = "var(--renk-ana)";
  if (tone === "success") accentColor = "var(--durum-basarili)";
  if (tone === "warning") accentColor = "var(--durum-uyari)";
  if (tone === "danger") accentColor = "var(--durum-hata)";

  // Render SVG sparkline if provided
  let sparklineSvg = null;
  if (sparkline && sparkline.length > 1) {
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;
    const width = 80;
    const height = 28;
    const points = sparkline
      .map((val, i) => {
        const x = (i / (sparkline.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    sparklineSvg = (
      <svg
        width={width}
        height={height}
        className="overflow-visible"
        aria-hidden="true"
        focusable="false"
      >
        <polyline
          fill="none"
          stroke={accentColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  }

  return (
    <div
      className="p-5 flex flex-col justify-between transition-all shadow-xs hover:shadow-md"
      style={{
        backgroundColor: "var(--kart)",
        border: "1px solid var(--kenar)",
        borderRadius: "var(--radius)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs sm:text-sm font-medium" style={{ color: "var(--yazi-soluk)" }}>
          {title}
        </span>
        {icon && (
          <div
            className="p-2 rounded-lg"
            style={{
              backgroundColor: "var(--zemin)",
              color: accentColor,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--yazi)" }}>
          {value}
        </div>
        {sparklineSvg}
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-1.5 mt-3 text-xs">
          {change > 0 ? (
            <span
              className="inline-flex items-center gap-0.5 font-semibold"
              style={{ color: "var(--durum-basarili)" }}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              +{change}%
            </span>
          ) : change < 0 ? (
            <span
              className="inline-flex items-center gap-0.5 font-semibold"
              style={{ color: "var(--durum-hata)" }}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              {change}%
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-0.5 font-semibold"
              style={{ color: "var(--yazi-soluk)" }}
            >
              <Minus className="w-3.5 h-3.5" />
              0%
            </span>
          )}
          <span style={{ color: "var(--yazi-soluk)" }}>{changeLabel ?? t("statCardVsPrevious")}</span>
        </div>
      )}
    </div>
  );
};
