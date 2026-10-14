import React from "react";
import { SCORE_NOTE } from "../domain/rules";
import { useI18n } from "../i18n";
import { ShieldCheck, AlertTriangle, AlertCircle, Info } from "lucide-react";

export interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showNote?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = "md",
  showNote = true,
}) => {
  const { t } = useI18n();

  // Score levels: İyi >= 80, Orta 50-79, Zayıf < 50
  let levelText = t("scoreGood");
  let levelColor = "var(--durum-basarili)";
  let levelIcon = <ShieldCheck className="w-4 h-4" />;

  if (score < 50) {
    levelText = t("scoreWeak");
    levelColor = "var(--durum-hata)";
    levelIcon = <AlertCircle className="w-4 h-4" />;
  } else if (score < 80) {
    levelText = t("scoreMedium");
    levelColor = "var(--durum-uyari)";
    levelIcon = <AlertTriangle className="w-4 h-4" />;
  }

  // Semi circle parameters
  // Angle from 180 to 0 degrees (left to right)
  const radius = 70;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // Half-circle arc length ~219.9
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const svgWidth = size === "sm" ? 160 : size === "lg" ? 260 : 200;
  const svgHeight = size === "sm" ? 95 : size === "lg" ? 150 : 115;

  return (
    <div
      className="flex flex-col items-center text-center p-5 rounded-xl border"
      style={{
        backgroundColor: "var(--kart)",
        borderColor: "var(--kenar)",
        borderRadius: "var(--radius)",
      }}
    >
      <div className="relative flex flex-col items-center justify-center">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox="0 0 160 90"
          className="overflow-visible"
        >
          {/* Background track arc */}
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke="var(--kenar)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active score arc */}
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke={levelColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Score display centered in gauge */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <span
            className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono"
            style={{ color: "var(--yazi)" }}
          >
            {score}
          </span>
          <div
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5"
            style={{
              backgroundColor: "var(--zemin)",
              color: levelColor,
              border: `1px solid ${levelColor}`,
            }}
          >
            {levelIcon}
            <span>{levelText}</span>
          </div>
        </div>
      </div>

      {showNote && (
        <div
          className="flex items-start gap-1.5 max-w-sm mt-4 p-2.5 rounded-lg text-xs leading-relaxed text-left"
          style={{
            backgroundColor: "var(--zemin)",
            color: "var(--yazi-soluk)",
            border: "1px solid var(--kenar)",
          }}
        >
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--renk-ana)" }} />
          <span>{SCORE_NOTE}</span>
        </div>
      )}
    </div>
  );
};
