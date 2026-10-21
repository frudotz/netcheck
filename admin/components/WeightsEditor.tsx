import React from "react";
import type { DiagnosticKind } from "../domain/types";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useI18n } from "../i18n";
import type { Translations } from "../i18n/tr";
import { sozluk, testAdi } from "../../src/lib/sozluk";

export interface WeightsEditorProps {
  weights: Record<DiagnosticKind, number>;
  onChange: (weights: Record<DiagnosticKind, number>) => void;
  disabled?: boolean;
}

// Hedef adresleri veri olarak gösterilir (çevrilmez); test adları uygulamanın sözlüğünden (testAdi),
// açıklamalar panel sözlüğünden gelir.
const testList: { id: DiagnosticKind; host?: string; desc: keyof Translations }[] = [
  { id: "internet", desc: "weightsDescInternet" },
  { id: "dns", desc: "weightsDescDns" },
  { id: "gateway", desc: "weightsDescGateway" },
  { id: "cloudflare", host: "1.1.1.1", desc: "weightsDescCloudflare" },
  { id: "google", host: "8.8.8.8", desc: "weightsDescGoogle" },
];

export const WeightsEditor: React.FC<WeightsEditorProps> = ({
  weights,
  onChange,
  disabled = false,
}) => {
  const { t, locale } = useI18n();

  const total = Object.values(weights).reduce((a, b) => a + (Number(b) || 0), 0);
  const isValid = total === 90;

  const handleChange = (id: DiagnosticKind, value: number) => {
    const clamped = Math.max(0, Math.min(90, value));
    onChange({
      ...weights,
      [id]: clamped,
    });
  };

  return (
    <div
      className="p-5 rounded-xl border space-y-5"
      style={{
        backgroundColor: "var(--kart)",
        borderColor: "var(--kenar)",
        borderRadius: "var(--radius)",
      }}
    >
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--kenar)" }}>
        <div>
          <h4 className="font-semibold text-sm sm:text-base" style={{ color: "var(--yazi)" }}>
            {t("rulesWeights")}
          </h4>
          <p className="text-xs mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
            {t("weightsHint")}
          </p>
        </div>

        {/* Sum indicator badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs border"
          style={{
            backgroundColor: isValid ? "var(--durum-basarili-zemin)" : "var(--durum-hata-zemin)",
            borderColor: isValid ? "var(--durum-basarili)" : "var(--durum-hata)",
            color: isValid ? "var(--durum-basarili)" : "var(--durum-hata)",
          }}
        >
          {isValid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{t("weightsTotal", { total })}</span>
        </div>
      </div>

      {!isValid && (
        <div
          className="p-3 rounded-lg flex items-center gap-2 text-xs font-medium"
          style={{
            backgroundColor: "var(--durum-hata-zemin)",
            color: "var(--durum-hata)",
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            {t("rulesWeightsMustTotal90", { sum: total })}.{" "}
            {total < 90
              ? t("weightsAddMore", { points: 90 - total })
              : t("weightsRemoveSome", { points: total - 90 })}
          </span>
        </div>
      )}

      {/* Sliders list */}
      <div className="space-y-4">
        {testList.map(item => {
          const val = weights[item.id] ?? 0;
          const ad = testAdi(sozluk[locale], item.id);
          const name = item.host ? `${ad} (${item.host})` : ad;
          return (
            <div
              key={item.id}
              className="p-3 rounded-lg border flex flex-col gap-2.5 transition-colors"
              style={{
                backgroundColor: "var(--zemin)",
                borderColor: "var(--kenar)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs sm:text-sm" style={{ color: "var(--yazi)" }}>
                    {name}
                  </span>
                  <p className="text-xs hidden sm:block" style={{ color: "var(--yazi-soluk)" }}>
                    {t(item.desc)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={val}
                    disabled={disabled}
                    onChange={e => handleChange(item.id, Number(e.target.value))}
                    aria-label={name}
                    className="w-16 p-1 text-center font-mono font-bold text-sm rounded border bg-transparent"
                    style={{
                      borderColor: "var(--kenar)",
                      color: "var(--yazi)",
                    }}
                  />
                  <span className="text-xs font-semibold" style={{ color: "var(--yazi-soluk)" }}>
                    {t("scoreRulesPoints")}
                  </span>
                </div>
              </div>

              {/* Slider track */}
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={90}
                  value={val}
                  disabled={disabled}
                  onChange={e => handleChange(item.id, Number(e.target.value))}
                  aria-label={name}
                  className="flex-1 cursor-pointer accent-ana"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
