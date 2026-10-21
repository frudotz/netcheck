import React from "react";
import { useI18n } from "../i18n";

export interface JsonDiffProps {
  before?: unknown;
  after?: unknown;
}

export const JsonDiff: React.FC<JsonDiffProps> = ({ before, after }) => {
  const { t } = useI18n();

  const format = (data: unknown) => {
    if (data === undefined) return "—";
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
      <div
        className="p-3.5 rounded-lg border flex flex-col"
        style={{
          backgroundColor: "var(--zemin)",
          borderColor: "var(--kenar)",
        }}
      >
        <span
          className="text-xs font-semibold mb-2 flex items-center gap-1.5"
          style={{ color: "var(--durum-hata)" }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--durum-hata)" }} />
          {t("auditBefore")}
        </span>
        <pre dir="ltr" className="overflow-x-auto whitespace-pre-wrap flex-1 p-2 rounded bg-yazi/5">
          {format(before)}
        </pre>
      </div>

      <div
        className="p-3.5 rounded-lg border flex flex-col"
        style={{
          backgroundColor: "var(--zemin)",
          borderColor: "var(--kenar)",
        }}
      >
        <span
          className="text-xs font-semibold mb-2 flex items-center gap-1.5"
          style={{ color: "var(--durum-basarili)" }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--durum-basarili)" }} />
          {t("auditAfter")}
        </span>
        <pre dir="ltr" className="overflow-x-auto whitespace-pre-wrap flex-1 p-2 rounded bg-yazi/5">
          {format(after)}
        </pre>
      </div>
    </div>
  );
};
