import React from "react";
import type { ReportRecord, ScoreRule } from "../domain/types";
import { computeScore, scoreLevel } from "../domain/rules";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { useI18n } from "../i18n";
import { sozluk, baglantiTuruEtiketi } from "../../src/lib/sozluk";

export interface ScorePreviewProps {
  sampleReports: ReportRecord[];
  candidateRule: ScoreRule;
}

export const ScorePreview: React.FC<ScorePreviewProps> = ({
  sampleReports,
  candidateRule,
}) => {
  const { t, locale } = useI18n();

  return (
    <div
      className="p-5 rounded-xl border space-y-4"
      style={{
        backgroundColor: "var(--kart)",
        borderColor: "var(--kenar)",
        borderRadius: "var(--radius)",
      }}
    >
      <div className="border-b pb-3" style={{ borderColor: "var(--kenar)" }}>
        <h4 className="font-semibold text-sm sm:text-base" style={{ color: "var(--yazi)" }}>
          {t("rulesPreview")}
        </h4>
        <p className="text-xs mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
          {t("scorePreviewHint")}
        </p>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--kenar)" }}>
        {sampleReports.slice(0, 5).map(report => {
          const newScore = computeScore(report.tests, candidateRule);
          const oldLevel = report.score >= 80 ? "iyi" : report.score >= 50 ? "orta" : "zayif";
          const newLevel = scoreLevel(newScore, candidateRule);
          const diff = newScore - report.score;

          return (
            <div
              key={report.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-mono font-semibold" style={{ color: "var(--yazi)" }}>
                  {report.id}
                </span>
                <span className="text-xs" style={{ color: "var(--yazi-soluk)" }}>
                  {t("scorePreviewPassed", { passed: report.tests.filter(test => test.status === "success").length })}
                  {" · "}
                  {baglantiTuruEtiketi(sozluk[locale], report.network.connectionType)}
                </span>
              </div>

              <div className="flex items-center gap-3 sm:gap-6">
                {/* Old score */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[11px] block" style={{ color: "var(--yazi-soluk)" }}>
                      {t("rulesOldScore")}
                    </span>
                    <span className="font-mono font-bold text-sm" style={{ color: "var(--yazi)" }}>
                      {report.score}
                    </span>
                  </div>
                  <StatusBadge
                    tone={oldLevel === "iyi" ? "success" : oldLevel === "orta" ? "warning" : "danger"}
                    label={oldLevel === "iyi" ? t("scoreGood") : oldLevel === "orta" ? t("scoreMedium") : t("scoreWeak")}
                    size="sm"
                  />
                </div>

                <ArrowRight className="w-4 h-4 opacity-40 flex-shrink-0" />

                {/* New score */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[11px] block font-medium" style={{ color: "var(--renk-ana)" }}>
                      {t("rulesNewScore")}
                    </span>
                    <span className="font-mono font-bold text-sm" style={{ color: "var(--renk-ana)" }}>
                      {newScore}
                    </span>
                  </div>
                  <StatusBadge
                    tone={newLevel === "iyi" ? "success" : newLevel === "orta" ? "warning" : "danger"}
                    label={newLevel === "iyi" ? t("scoreGood") : newLevel === "orta" ? t("scoreMedium") : t("scoreWeak")}
                    size="sm"
                  />
                </div>

                {/* Delta */}
                <div className="w-16 text-right font-mono font-bold text-xs">
                  {diff > 0 ? (
                    <span className="inline-flex items-center gap-0.5" style={{ color: "var(--durum-basarili)" }}>
                      <TrendingUp className="w-3.5 h-3.5" />+{diff}
                    </span>
                  ) : diff < 0 ? (
                    <span className="inline-flex items-center gap-0.5" style={{ color: "var(--durum-hata)" }}>
                      <TrendingDown className="w-3.5 h-3.5" />{diff}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5" style={{ color: "var(--yazi-soluk)" }}>
                      <Minus className="w-3.5 h-3.5" />0
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
