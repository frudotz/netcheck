import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { DiagnosticKind, DiagnosticTarget } from "../domain/types";
import { StatusBadge } from "../components/StatusBadge";
import { CardSkeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { useI18n } from "../i18n";
import type { Translations } from "../i18n/tr";
import { sozluk, testAdi } from "../../src/lib/sozluk";
import { AlertCircle, Lock } from "lucide-react";

// Salt okunur ekran: tanılama hedefleri Rust'ta sabittir ve uygulama bu tabloyu okumaz (AGENTS.md §6).
// Arka uç `DiagnosticTarget` kaynağını `readonly` tutar; bu yüzden burada düzenleme denetimi yoktur.
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targets, setTargets] = useState<DiagnosticTarget[]>([]);

  const testTitle = (kind: DiagnosticKind): string => {
    const info = testDisplayNames[kind];
    const ad = testAdi(sozluk[locale], kind);
    return info.host ? `${ad} (${info.host})` : ad;
  };

  const fetchTargets = async () => {
    try {
      setLoading(true);
      setError(null);
      setTargets(await api.getTargets());
    } catch {
      setError(t("errorDesc"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

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
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-yazi">{t("targetsTitle")}</h1>
        <p className="text-xs sm:text-sm mt-0.5 text-yazi-soluk">{t("targetsDesc")}</p>
      </div>

      <p className="flex items-start gap-2 p-3 text-sm rounded-lg border bg-bilgi-zemin border-kenar text-yazi" role="note">
        <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-bilgi" aria-hidden="true" />
        <span>{t("targetsReadOnlyNote")}</span>
      </p>

      <div className="space-y-4">
        {targets.map(tgt => {
          const title = testTitle(tgt.kind);
          return (
            <div
              key={tgt.kind}
              className="p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-kart border-kenar"
              style={{ borderRadius: "var(--radius)" }}
            >
              <div className="max-w-md">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-sm sm:text-base text-yazi">{title}</h2>
                  <StatusBadge
                    tone={tgt.enabled ? "success" : "neutral"}
                    label={tgt.enabled ? t("targetStatus") : t("targetsDisabled")}
                    size="sm"
                  />
                </div>
                <p className="text-xs mt-1 leading-relaxed text-yazi-soluk">{t(testDisplayNames[tgt.kind].desc)}</p>
              </div>

              <dl className="flex flex-wrap items-center gap-6 text-xs sm:text-sm">
                <div className="flex flex-col gap-1">
                  <dt className="text-[11px] font-medium text-yazi-soluk">{t("targetAddress")}</dt>
                  <dd className="force-ltr font-mono text-yazi">{tgt.target}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-[11px] font-medium text-yazi-soluk">{t("targetTimeout")}</dt>
                  <dd className="font-mono text-yazi">{tgt.timeoutMs} ms</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
};
