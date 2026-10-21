import React from "react";
import { DiagnosticTest, DiagnosticStatus } from "../domain/types";
import { StatusBadge, StatusTone } from "./StatusBadge";
import { CheckCircle2, AlertCircle, Clock, Loader2, Ban, Gauge } from "lucide-react";
import { useI18n } from "../i18n";

export interface TestCardProps {
  test: DiagnosticTest;
}

export const TestCard: React.FC<TestCardProps> = ({ test }) => {
  const { t } = useI18n();

  let tone: StatusTone = "neutral";
  let statusLabel = t("statusPending");
  let statusIcon = <Clock className="w-3.5 h-3.5" />;

  switch (test.status) {
    case "success":
      tone = "success";
      statusLabel = t("statusSuccess");
      statusIcon = <CheckCircle2 className="w-3.5 h-3.5" />;
      break;
    case "failed":
      tone = "danger";
      statusLabel = t("statusFailed");
      statusIcon = <AlertCircle className="w-3.5 h-3.5" />;
      break;
    case "running":
      tone = "info";
      statusLabel = t("statusRunning");
      statusIcon = <Loader2 className="w-3.5 h-3.5 animate-spin" />;
      break;
    case "unavailable":
      tone = "warning";
      statusLabel = t("statusUnavailable");
      statusIcon = <Ban className="w-3.5 h-3.5" />;
      break;
    case "pending":
    default:
      tone = "neutral";
      statusLabel = t("statusPending");
      statusIcon = <Clock className="w-3.5 h-3.5" />;
      break;
  }

  return (
    <div
      className="p-4 rounded-xl border flex flex-col justify-between transition-all"
      style={{
        backgroundColor: "var(--kart)",
        borderColor: "var(--kenar)",
        borderRadius: "var(--radius)",
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h4 className="font-semibold text-sm sm:text-base" style={{ color: "var(--yazi)" }}>
            {test.name}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5 force-ltr">
            <span className="text-xs" style={{ color: "var(--yazi-soluk)" }}>
              Hedef:
            </span>
            <code
              className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: "var(--zemin)",
                color: "var(--yazi)",
                border: "1px solid var(--kenar)",
              }}
            >
              {test.target ?? t("valNotFound")}
            </code>
          </div>
        </div>

        <StatusBadge tone={tone} label={statusLabel} icon={statusIcon} size="sm" />
      </div>

      <div className="flex items-center justify-between pt-3 mt-2 border-t text-xs" style={{ borderColor: "var(--kenar)" }}>
        <div className="flex items-center gap-1.5 font-mono">
          <Gauge className="w-3.5 h-3.5" style={{ color: "var(--yazi-soluk)" }} />
          <span style={{ color: "var(--yazi-soluk)" }}>Gecikme:</span>
          <span
            className="font-semibold"
            style={{
              color:
                test.latencyMs !== undefined
                  ? test.latencyMs < 50
                    ? "var(--durum-basarili)"
                    : test.latencyMs < 150
                    ? "var(--durum-uyari)"
                    : "var(--durum-hata)"
                  : "var(--yazi-soluk)",
            }}
          >
            {test.latencyMs !== undefined ? `${test.latencyMs} ms` : t("valUnavailable")}
          </span>
        </div>

        {test.code && (
          <span
            className="text-[11px] font-mono px-2 py-0.5 rounded"
            style={{
              backgroundColor: "var(--durum-hata-zemin)",
              color: "var(--durum-hata)",
            }}
          >
            {test.code}
          </span>
        )}
      </div>

      {test.message && (
        <p className="text-xs mt-2 pt-2 border-t leading-relaxed" style={{ borderColor: "var(--kenar)", color: "var(--yazi-soluk)" }}>
          {test.message}
        </p>
      )}
    </div>
  );
};
