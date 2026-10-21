import React, { useState, useEffect } from "react";
import { api } from "../api/mockAdapter";
import { ScoreRule, ReportRecord } from "../domain/types";
import { WeightsEditor } from "../components/WeightsEditor";
import { LatencyBandsEditor } from "../components/LatencyBandsEditor";
import { ScorePreview } from "../components/ScorePreview";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusBadge } from "../components/StatusBadge";
import { useI18n } from "../i18n";
import { useToast } from "../context/ToastContext";
import {
  Sliders,
  Save,
  Send,
  RotateCcw,
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export const ScoreRulesView: React.FC = () => {
  const { t } = useI18n();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rulesList, setRulesList] = useState<ScoreRule[]>([]);
  const [sampleReports, setSampleReports] = useState<ReportRecord[]>([]);

  // Active working candidate rule
  const [activeRule, setActiveRule] = useState<ScoreRule>({
    version: 1,
    status: "draft",
    weights: { internet: 35, dns: 20, gateway: 15, cloudflare: 10, google: 10 },
    latencyBands: [
      { maxMs: 50, bonus: 10 },
      { maxMs: 100, bonus: 7 },
      { maxMs: 200, bonus: 4 },
      { maxMs: null, bonus: 1 },
    ],
    levels: { iyi: 80, orta: 50 },
  });

  // Dialogs
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [rollbackTargetVersion, setRollbackTargetVersion] = useState<number | null>(null);

  const fetchRulesAndSamples = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rules, reportsData] = await Promise.all([
        api.getScoreRules(),
        api.getReports({ pageSize: 10 }),
      ]);
      setRulesList(rules);
      setSampleReports(reportsData.items);

      // Load latest published or draft rule
      const latest = rules[rules.length - 1];
      if (latest) {
        setActiveRule(JSON.parse(JSON.stringify(latest)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorDesc"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRulesAndSamples();
  }, []);

  // Validation
  const weightsTotal = Object.values(activeRule.weights).reduce((a, b) => a + (Number(b) || 0), 0);
  const isWeightsValid = weightsTotal === 90;

  // Latency bands valid
  let isBandsValid = true;
  for (let i = 0; i < activeRule.latencyBands.length - 1; i++) {
    const curr = activeRule.latencyBands[i].maxMs;
    const next = activeRule.latencyBands[i + 1].maxMs;
    if (curr === null || (next !== null && curr >= next)) {
      isBandsValid = false;
      break;
    }
  }
  if (activeRule.latencyBands.length === 0 || activeRule.latencyBands[activeRule.latencyBands.length - 1].maxMs !== null) {
    isBandsValid = false;
  }

  const canPublish = isWeightsValid && isBandsValid;

  const handleSaveDraft = async () => {
    try {
      const saved = await api.saveDraftScoreRule(activeRule);
      addToast(t("toastRuleDraftSaved"), "info");
      fetchRulesAndSamples();
    } catch {
      addToast(t("toastActionError"), "error");
    }
  };

  const handlePublish = async (reason?: string) => {
    try {
      await api.publishScoreRule(activeRule, reason);
      addToast(t("toastRulePublished"), "success");
      setConfirmPublish(false);
      fetchRulesAndSamples();
    } catch {
      addToast(t("toastActionError"), "error");
    }
  };

  const handleRollback = async (reason?: string) => {
    if (!rollbackTargetVersion) return;
    try {
      await api.rollbackScoreRule(rollbackTargetVersion, reason);
      addToast(`v${rollbackTargetVersion} sürümüne başarıyla geri dönüldü.`, "success");
      setRollbackTargetVersion(null);
      fetchRulesAndSamples();
    } catch {
      addToast(t("toastActionError"), "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--yazi)" }}>
            {t("rulesTitle")}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
            {t("rulesDesc")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border hover:opacity-85 transition-opacity"
            style={{
              backgroundColor: "var(--kart)",
              borderColor: "var(--kenar)",
              color: "var(--yazi)",
              borderRadius: "var(--radius)",
            }}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{t("rulesSaveDraft")}</span>
          </button>

          <button
            type="button"
            disabled={!canPublish}
            onClick={() => setConfirmPublish(true)}
            className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: "var(--renk-ana)",
              color: "var(--renk-ana-yazi)",
              borderRadius: "var(--radius)",
            }}
            title={!canPublish ? t("rulesCannotPublishNote") : undefined}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t("rulesPublish")}</span>
          </button>
        </div>
      </div>

      {!canPublish && (
        <div
          className="p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium"
          style={{
            backgroundColor: "var(--durum-uyari-zemin)",
            borderColor: "var(--durum-uyari)",
            color: "var(--durum-uyari)",
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{t("rulesCannotPublishNote")}</span>
        </div>
      )}

      {/* Main Grid: Editors + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Weights + Latency Bands + Thresholds */}
        <div className="space-y-6">
          <WeightsEditor
            weights={activeRule.weights}
            onChange={w => setActiveRule(prev => ({ ...prev, weights: w }))}
          />

          <LatencyBandsEditor
            bands={activeRule.latencyBands}
            onChange={b => setActiveRule(prev => ({ ...prev, latencyBands: b }))}
          />

          {/* Level Thresholds */}
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
                {t("rulesThresholds")}
              </h4>
              <p className="text-xs mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
                Hesaplanan nihai 0-100 skorunun İyi, Orta ve Zayıf sınıflandırma alt sınırları.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div
                className="p-3 rounded-lg border flex flex-col gap-1.5"
                style={{ backgroundColor: "var(--zemin)", borderColor: "var(--kenar)" }}
              >
                <label className="font-semibold" style={{ color: "var(--durum-basarili)" }}>
                  {t("rulesGoodMin")}
                </label>
                <input
                  type="number"
                  min={activeRule.levels.orta + 1}
                  max={100}
                  value={activeRule.levels.iyi}
                  onChange={e =>
                    setActiveRule(prev => ({
                      ...prev,
                      levels: { ...prev.levels, iyi: Number(e.target.value) },
                    }))
                  }
                  className="p-2 rounded border bg-transparent font-mono font-bold text-sm"
                  style={{ borderColor: "var(--kenar)", color: "var(--yazi)" }}
                />
              </div>

              <div
                className="p-3 rounded-lg border flex flex-col gap-1.5"
                style={{ backgroundColor: "var(--zemin)", borderColor: "var(--kenar)" }}
              >
                <label className="font-semibold" style={{ color: "var(--durum-uyari)" }}>
                  {t("rulesMediumMin")}
                </label>
                <input
                  type="number"
                  min={1}
                  max={activeRule.levels.iyi - 1}
                  value={activeRule.levels.orta}
                  onChange={e =>
                    setActiveRule(prev => ({
                      ...prev,
                      levels: { ...prev.levels, orta: Number(e.target.value) },
                    }))
                  }
                  className="p-2 rounded border bg-transparent font-mono font-bold text-sm"
                  style={{ borderColor: "var(--kenar)", color: "var(--yazi)" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Score Preview + Version History */}
        <div className="space-y-6">
          <ScorePreview
            sampleReports={sampleReports}
            candidateRule={activeRule}
          />

          {/* Rule Versions History */}
          <div
            className="p-5 rounded-xl border space-y-4"
            style={{
              backgroundColor: "var(--kart)",
              borderColor: "var(--kenar)",
              borderRadius: "var(--radius)",
            }}
          >
            <div className="border-b pb-3 flex items-center justify-between" style={{ borderColor: "var(--kenar)" }}>
              <div>
                <h4 className="font-semibold text-sm sm:text-base flex items-center gap-2" style={{ color: "var(--yazi)" }}>
                  <History className="w-4 h-4" />
                  <span>{t("rulesVersions")}</span>
                </h4>
                <p className="text-xs mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
                  Önceki kural sürümleri ve canlı yayın geçmişi
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {rulesList.map(rule => {
                const isCurrentActive = activeRule.version === rule.version;
                const isPublished = rule.status === "published";

                return (
                  <div
                    key={rule.version}
                    className="p-3.5 rounded-lg border flex items-center justify-between text-xs transition-colors"
                    style={{
                      backgroundColor: isCurrentActive ? "var(--zemin)" : "var(--kart)",
                      borderColor: isCurrentActive ? "var(--renk-ana)" : "var(--kenar)",
                    }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm" style={{ color: "var(--yazi)" }}>
                          Sürüm v{rule.version}
                        </span>
                        <StatusBadge
                          tone={isPublished ? "success" : "neutral"}
                          label={isPublished ? t("rulesStatusPublished") : t("rulesStatusDraft")}
                          size="sm"
                        />
                      </div>
                      <span className="text-[11px]" style={{ color: "var(--yazi-soluk)" }}>
                        {rule.publishedAt
                          ? `Yayınlanma: ${new Date(rule.publishedAt).toLocaleDateString("tr-TR")}`
                          : "Taslak çalışma sürümü"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveRule(JSON.parse(JSON.stringify(rule)))}
                        className="cursor-pointer px-2.5 py-1 text-xs font-semibold rounded border hover:opacity-80"
                        style={{
                          backgroundColor: "var(--zemin)",
                          borderColor: "var(--kenar)",
                          color: "var(--yazi)",
                        }}
                      >
                        İncele
                      </button>

                      {isPublished && (
                        <button
                          type="button"
                          onClick={() => setRollbackTargetVersion(rule.version)}
                          className="cursor-pointer px-2.5 py-1 text-xs font-semibold rounded border hover:opacity-80 flex items-center gap-1"
                          style={{
                            backgroundColor: "var(--durum-uyari-zemin)",
                            borderColor: "var(--durum-uyari)",
                            color: "var(--durum-uyari)",
                          }}
                          title={t("rulesRollback")}
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Geri Dön</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Publish Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmPublish}
        onClose={() => setConfirmPublish(false)}
        onConfirm={handlePublish}
        title={t("confirmPublishTitle")}
        message={t("confirmPublishMessage")}
        confirmLabel="Kuralı Yayınla ve Canlıya Al"
        tone="warning"
        requireReason={true}
        reasonPlaceholder="Bu kural değişikliğinin gerekçesini belirtin (örn: Fiber hatlar için gecikme eşikleri iyileştirildi)..."
      />

      {/* Rollback Confirmation Dialog */}
      <ConfirmDialog
        isOpen={rollbackTargetVersion !== null}
        onClose={() => setRollbackTargetVersion(null)}
        onConfirm={handleRollback}
        title={`v${rollbackTargetVersion} Sürümüne Geri Dönmek İstiyor Musunuz?`}
        message={`v${rollbackTargetVersion} sürümündeki test ağırlıkları ve kademeleri kopyalanarak yeni bir yayınlanmış sürüm olarak kaydedilecektir.`}
        confirmLabel="Eski Sürüme Dön"
        tone="danger"
        requireReason={true}
        reasonPlaceholder="Geri dönüş gerekçesi..."
      />
    </div>
  );
};
