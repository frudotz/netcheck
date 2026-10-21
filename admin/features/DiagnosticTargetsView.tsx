import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { DiagnosticKind, DiagnosticTarget } from "../domain/types";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusBadge } from "../components/StatusBadge";
import { CardSkeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { useI18n } from "../i18n";
import type { Translations } from "../i18n/tr";
import { sozluk, testAdi } from "../../src/lib/sozluk";
import { useToast } from "../context/ToastContext";
import { RotateCcw, Save, AlertCircle } from "lucide-react";

// Hedef adresleri veri olarak gösterilir (çevrilmez); test adları uygulamanın sözlüğünden (testAdi),
// açıklamalar panel sözlüğünden gelir.
const testDisplayNames: Record<DiagnosticKind, { host?: string; desc: keyof Translations }> = {
  gateway: { desc: "targetsInfoGateway" },
  cloudflare: { host: "1.1.1.1", desc: "targetsInfoCloudflare" },
  google: { host: "8.8.8.8", desc: "targetsInfoGoogle" },
  dns: { desc: "targetsInfoDns" },
  internet: { desc: "targetsInfoInternet" },
};

export const DiagnosticTargetsView: React.FC = () => {
  const { t, locale } = useI18n();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targets, setTargets] = useState<DiagnosticTarget[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  const testTitle = (kind: DiagnosticKind): string => {
    const info = testDisplayNames[kind];
    const ad = testAdi(sozluk[locale], kind);
    return info.host ? `${ad} (${info.host})` : ad;
  };

  const fetchTargets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTargets();
      setTargets(data);
    } catch (err) {
      setError(t("errorDesc"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleUpdate = async (index: number) => {
    const target = targets[index];
    try {
      setSavingIndex(index);
      await api.updateTarget(target);
      addToast(t("targetsUpdated", { name: testTitle(target.kind) }), "success");
    } catch {
      addToast(t("toastActionError"), "error");
    } finally {
      setSavingIndex(null);
    }
  };

  const handleResetDefaults = async () => {
    try {
      const reset = await api.resetTargetsToDefault();
      setTargets(reset);
      setConfirmReset(false);
      addToast(t("targetsResetDone"), "success");
    } catch {
      addToast(t("toastActionError"), "error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <span className="sr-only">{t("loading")}</span>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-6 h-6" />}
        title={t("errorTitle")}
        description={error}
        action={{ label: t("retry"), onClick: fetchTargets }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--yazi)" }}>
            {t("targetsTitle")}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
            {t("targetsDesc")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border hover:opacity-85 transition-opacity"
          style={{
            backgroundColor: "var(--kart)",
            borderColor: "var(--kenar)",
            color: "var(--yazi)",
            borderRadius: "var(--radius)",
          }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t("targetResetDefaults")}</span>
        </button>
      </div>

      {/* Target Rows */}
      <div className="space-y-4">
        {targets.map((tgt, idx) => {
          const title = testTitle(tgt.kind);

          return (
            <div
              key={tgt.kind}
              className="p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              style={{
                backgroundColor: "var(--kart)",
                borderColor: "var(--kenar)",
                borderRadius: "var(--radius)",
              }}
            >
              {/* Left: Info */}
              <div className="max-w-md">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm sm:text-base" style={{ color: "var(--yazi)" }}>
                    {title}
                  </h3>
                  <StatusBadge
                    tone={tgt.enabled ? "success" : "neutral"}
                    label={tgt.enabled ? t("targetStatus") : t("targetsDisabled")}
                    size="sm"
                  />
                </div>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--yazi-soluk)" }}>
                  {t(testDisplayNames[tgt.kind].desc)}
                </p>
              </div>

              {/* Right: Controls (Target address, Timeout, Toggle, Save) */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Target Address Input */}
                <div className="flex flex-col gap-1">
                  <label htmlFor={`hedef-${tgt.kind}`} className="text-[11px] font-medium" style={{ color: "var(--yazi-soluk)" }}>
                    {t("targetAddress")}
                  </label>
                  <input
                    id={`hedef-${tgt.kind}`}
                    type="text"
                    value={tgt.target}
                    onChange={e => {
                      const val = e.target.value;
                      setTargets(prev => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], target: val };
                        return copy;
                      });
                    }}
                    className="force-ltr p-1.5 px-3 rounded-lg border font-mono text-xs sm:text-sm transition-colors"
                    style={{
                      backgroundColor: "var(--zemin)",
                      borderColor: "var(--kenar)",
                      color: "var(--yazi)",
                      width: "180px",
                    }}
                  />
                </div>

                {/* Timeout Input */}
                <div className="flex flex-col gap-1">
                  <label htmlFor={`zaman-asimi-${tgt.kind}`} className="text-[11px] font-medium" style={{ color: "var(--yazi-soluk)" }}>
                    {t("targetTimeout")}
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      id={`zaman-asimi-${tgt.kind}`}
                      type="number"
                      step={500}
                      min={500}
                      max={15000}
                      value={tgt.timeoutMs}
                      onChange={e => {
                        const val = Math.max(500, Number(e.target.value));
                        setTargets(prev => {
                          const copy = [...prev];
                          copy[idx] = { ...copy[idx], timeoutMs: val };
                          return copy;
                        });
                      }}
                      className="p-1.5 text-center rounded-lg border font-mono text-xs sm:text-sm font-semibold"
                      style={{
                        backgroundColor: "var(--zemin)",
                        borderColor: "var(--kenar)",
                        color: "var(--yazi)",
                        width: "80px",
                      }}
                    />
                    <span className="text-xs font-mono" style={{ color: "var(--yazi-soluk)" }}>
                      ms
                    </span>
                  </div>
                </div>

                {/* Enabled Toggle */}
                <div className="flex flex-col gap-1 items-center">
                  <span className="text-[11px] font-medium" style={{ color: "var(--yazi-soluk)" }} aria-hidden="true">
                    {t("targetStatus")}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tgt.enabled}
                      aria-label={`${title}: ${t("targetStatus")}`}
                      onChange={e => {
                        const val = e.target.checked;
                        setTargets(prev => {
                          const copy = [...prev];
                          copy[idx] = { ...copy[idx], enabled: val };
                          return copy;
                        });
                      }}
                      className="sr-only peer"
                    />
                    <div
                      className="w-9 h-5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-kart after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-kart after:border-kenar after:border after:rounded-full after:h-4 after:w-4 after:transition-all"
                      style={{
                        backgroundColor: tgt.enabled ? "var(--renk-ana)" : "var(--kenar)",
                      }}
                    />
                  </label>
                </div>

                {/* Save Button */}
                <div className="flex flex-col gap-1 justify-end">
                  <span className="text-[11px] opacity-0 select-none" aria-hidden="true">
                    {t("save")}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdate(idx)}
                    disabled={savingIndex === idx}
                    className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                    style={{
                      backgroundColor: "var(--renk-ana)",
                      color: "var(--renk-ana-yazi)",
                      borderRadius: "var(--radius)",
                    }}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingIndex === idx ? "..." : t("save")}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleResetDefaults}
        title={t("targetsResetTitle")}
        message={t("targetsResetMessage")}
        confirmLabel={t("targetsResetConfirm")}
        tone="warning"
        requireReason={false}
      />
    </div>
  );
};
