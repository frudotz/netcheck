import React, { useState, useEffect } from "react";
import { api } from "../api/nativeAdapter";
import { DiagnosticTarget } from "../domain/types";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusBadge } from "../components/StatusBadge";
import { useI18n } from "../i18n";
import { useToast } from "../context/ToastContext";
import {
  Target,
  RotateCcw,
  Save,
  Check,
  AlertCircle,
  HelpCircle,
  Clock,
} from "lucide-react";

export const DiagnosticTargetsView: React.FC = () => {
  const { t } = useI18n();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targets, setTargets] = useState<DiagnosticTarget[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  const testDisplayNames: Record<string, { title: string; desc: string }> = {
    gateway: {
      title: "Varsayılan Ağ Geçidi (Gateway)",
      desc: "İstemcinin bağlı olduğu yerel router/modem IP adresi ('auto' otomatik algılar).",
    },
    cloudflare: {
      title: "Cloudflare DNS (1.1.1.1)",
      desc: "Cloudflare global anycast resolver ping testi.",
    },
    google: {
      title: "Google DNS (8.8.8.8)",
      desc: "Google global resolver ping ve rota erişim testi.",
    },
    dns: {
      title: "DNS Çözümleme (Hostname Resolution)",
      desc: "Alan adının IP adresine çevrilme testi.",
    },
    internet: {
      title: "İnternet Dış Dünya Erişimi (HTTPS)",
      desc: "Dış web sunucusuna HTTP/TLS el sıkışması ve yanıt alma testi.",
    },
  };

  const fetchTargets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTargets();
      setTargets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorDesc"));
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
      addToast(`${target.kind} hedefi başarıyla güncellendi.`, "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : t("toastActionError"), "error");
    } finally {
      setSavingIndex(null);
    }
  };

  const handleResetDefaults = async () => {
    try {
      const reset = await api.resetTargetsToDefault();
      setTargets(reset);
      setConfirmReset(false);
      addToast("Tanılama hedefleri varsayılan değerlere sıfırlandı.", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : t("toastActionError"), "error");
    }
  };

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
          const info = testDisplayNames[tgt.kind] || {
            title: tgt.kind,
            desc: "Tanılama hedefi",
          };

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
                    {info.title}
                  </h3>
                  <StatusBadge
                    tone={tgt.enabled ? "success" : "neutral"}
                    label={tgt.enabled ? "Etkin" : "Devre Dışı"}
                    size="sm"
                  />
                </div>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--yazi-soluk)" }}>
                  {info.desc}
                </p>
              </div>

              {/* Right: Controls (Target address, Timeout, Toggle, Save) */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Target Address Input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium" style={{ color: "var(--yazi-soluk)" }}>
                    {t("targetAddress")}
                  </label>
                  <input
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
                    className="p-1.5 px-3 rounded-lg border font-mono text-xs sm:text-sm transition-colors focus-visible:outline-none"
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
                  <label className="text-[11px] font-medium" style={{ color: "var(--yazi-soluk)" }}>
                    {t("targetTimeout")}
                  </label>
                  <div className="flex items-center gap-1">
                    <input
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
                      className="p-1.5 text-center rounded-lg border font-mono text-xs sm:text-sm font-semibold focus-visible:outline-none"
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
                  <label className="text-[11px] font-medium" style={{ color: "var(--yazi-soluk)" }}>
                    Durum
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tgt.enabled}
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
                      className="w-9 h-5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"
                      style={{
                        backgroundColor: tgt.enabled ? "var(--renk-ana)" : "var(--kenar)",
                      }}
                    />
                  </label>
                </div>

                {/* Save Button */}
                <div className="flex flex-col gap-1 justify-end">
                  <label className="text-[11px] opacity-0 select-none">Kaydet</label>
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
        title="Tanılama Hedeflerini Varsayılanlara Sıfırla?"
        message="Yapılan tüm özel hedef adres ve zaman aşımı değişiklikleri iptal edilerek NetCheck standart fabrika değerleri yüklenecektir."
        confirmLabel="Varsayılanlara Sıfırla"
        tone="warning"
        requireReason={false}
      />
    </div>
  );
};
