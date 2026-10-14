import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "../api/nativeAdapter";
import { ReportRecord } from "../domain/types";
import { ScoreGauge } from "../components/ScoreGauge";
import { TestCard } from "../components/TestCard";
import { NetworkSnapshotView } from "../components/NetworkSnapshotView";
import { CopyText } from "../components/CopyText";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CardSkeleton } from "../components/Skeleton";
import { useI18n } from "../i18n";
import { useToast } from "../context/ToastContext";
import {
  ArrowLeft,
  Share2,
  Lock,
  Printer,
  Trash2,
  Calendar,
  Layers,
  Smartphone,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export const ReportDetailView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") ?? undefined;
  const navigate = useNavigate();
  const { t } = useI18n();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportRecord | null>(null);

  // Actions
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmToggleShare, setConfirmToggleShare] = useState(false);

  const fetchReport = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getReportById(id);
      if (!data) {
        setError("Rapor bulunamadı veya silinmiş olabilir.");
      } else {
        setReport(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorDesc"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleRevealSensitive = async (field: string, _value: string): Promise<string | void> => {
    if (!report) return;
    try {
      const revealed = await api.getReportById(report.id, true);
      if (!revealed) throw new Error("Rapor bulunamadı.");
      setReport(revealed);
      addToast(t("toastPiiRevealed"), "info");
      const dnsMatch = /^dnsServer\[(\d+)\]$/.exec(field);
      if (dnsMatch) return revealed.network.dnsServers[Number(dnsMatch[1])];
      const interfaceMatch = /^(.+)\.(ipv4|mac)$/.exec(field);
      if (interfaceMatch) {
        const iface = revealed.network.interfaces.find(item => item.name === interfaceMatch[1]);
        return interfaceMatch[2] === "ipv4" ? iface?.ipv4 : iface?.mac;
      }
      const fieldValue = Reflect.get(revealed.network, field);
      return typeof fieldValue === "string" ? fieldValue : undefined;
    } catch (err) {
      addToast(err instanceof Error ? err.message : t("toastActionError"), "error");
    }
  };

  const handleToggleShare = async (reason?: string) => {
    if (!report) return;
    try {
      const nextState = !report.shared;
      const updated = await api.updateReportSharing(report.id, nextState, reason);
      setReport(updated);
      setConfirmToggleShare(false);
      addToast(
        nextState ? "Rapor paylaşımı açıldı." : "Rapor paylaşımı kapatıldı.",
        "success"
      );
    } catch (error) {
      addToast(error instanceof Error ? error.message : t("toastActionError"), "error");
    }
  };

  const handleDelete = async (reason?: string) => {
    if (!report) return;
    try {
      await api.deleteReport(report.id, reason || "Yönetici tarafından silindi");
      addToast(t("toastSuccessDelete"), "success");
      navigate("/raporlar");
    } catch (error) {
      addToast(error instanceof Error ? error.message : t("toastActionError"), "error");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-300 dark:bg-slate-700" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <div className="lg:col-span-2">
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div
        className="p-8 rounded-xl border flex flex-col items-center justify-center text-center my-6"
        style={{
          backgroundColor: "var(--kart)",
          borderColor: "var(--kenar)",
          borderRadius: "var(--radius)",
        }}
      >
        <AlertCircle className="w-10 h-10 mb-3" style={{ color: "var(--durum-hata)" }} />
        <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--yazi)" }}>
          {error ?? "Rapor Bulunamadı"}
        </h3>
        <p className="text-sm max-w-md mb-6" style={{ color: "var(--yazi-soluk)" }}>
          Aradığınız rapor kimliği mevcut veri tabanında bulunamadı veya silinmiş olabilir.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/raporlar")}
            className="cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg border hover:opacity-80"
            style={{
              backgroundColor: "var(--zemin)",
              borderColor: "var(--kenar)",
              color: "var(--yazi)",
            }}
          >
            Rapor Listesine Dön
          </button>
          <button
            type="button"
            onClick={fetchReport}
            className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg"
            style={{
              backgroundColor: "var(--renk-ana)",
              color: "var(--renk-ana-yazi)",
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t("retry")}</span>
          </button>
        </div>
      </div>
    );
  }

  const createdDate = new Date(report.createdAt);

  return (
    <div className="space-y-6">
      {/* Back & Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/raporlar"
            className="cursor-pointer p-2 rounded-lg border hover:opacity-80 transition-colors"
            style={{
              backgroundColor: "var(--kart)",
              borderColor: "var(--kenar)",
              color: "var(--yazi)",
            }}
            title="Raporlara Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-mono" style={{ color: "var(--yazi)" }}>
                {report.id}
              </h1>
              <CopyText value={report.id} />
            </div>
            <div className="flex items-center gap-4 text-xs mt-1" style={{ color: "var(--yazi-soluk)" }}>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {createdDate.toLocaleString("tr-TR")}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                {t("reportRuleVersion")}: v{report.ruleVersion}
              </span>
              {report.deviceId ? (
                <Link
                  to={`/cihazlar?q=${report.deviceId}`}
                  className="flex items-center gap-1 font-mono hover:underline"
                  style={{ color: "var(--renk-ana)" }}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  {report.deviceId}
                </Link>
              ) : (
                <span>Cihaz bilgisi bulunamadı</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border hover:opacity-80 transition-opacity"
            style={{
              backgroundColor: "var(--kart)",
              borderColor: "var(--kenar)",
              color: "var(--yazi)",
              borderRadius: "var(--radius)",
            }}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t("exportPdf")}</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmToggleShare(true)}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border hover:opacity-80 transition-opacity"
            style={{
              backgroundColor: report.shared ? "var(--durum-basarili-zemin)" : "var(--zemin)",
              borderColor: report.shared ? "var(--durum-basarili)" : "var(--kenar)",
              color: report.shared ? "var(--durum-basarili)" : "var(--yazi-soluk)",
              borderRadius: "var(--radius)",
            }}
          >
            {report.shared ? <Share2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{report.shared ? "Paylaşım Açık" : "Paylaşım Kapalı"}</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: "var(--durum-hata)",
              color: "#ffffff",
              borderRadius: "var(--radius)",
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t("delete")}</span>
          </button>
        </div>
      </div>

      {/* Top Section: Score Gauge & Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <ScoreGauge score={report.score} size="md" showNote={true} />
        </div>

        <div className="lg:col-span-2">
          <NetworkSnapshotView
            network={report.network}
            onRevealSensitive={handleRevealSensitive}
          />
        </div>
      </div>

      {/* 5 Diagnostic Probe Tests Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold" style={{ color: "var(--yazi)" }}>
            {t("testsSection")}
          </h2>
          <span className="text-xs font-mono font-semibold" style={{ color: "var(--durum-basarili)" }}>
            {report.passed} / 5 Test Başarılı
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.tests.map(test => (
            <TestCard key={test.id} test={test} />
          ))}
        </div>
      </div>

      {/* Toggle Sharing Dialog */}
      <ConfirmDialog
        isOpen={confirmToggleShare}
        onClose={() => setConfirmToggleShare(false)}
        onConfirm={handleToggleShare}
        title={report.shared ? "Rapor Paylaşımını Kapat?" : "Raporu Genel Paylaşıma Aç?"}
        message={
          report.shared
            ? "Paylaşımı kapattığınızda genel bağlantıya sahip kullanıcılar artık rapora erişemeyecektir."
            : "Rapor paylaşıma açıldığında kriptografik kimlikle erişilebilir duruma gelecektir."
        }
        confirmLabel={report.shared ? "Paylaşımı Kapat" : "Paylaşıma Aç"}
        tone={report.shared ? "warning" : "neutral"}
        requireReason={report.shared}
        reasonPlaceholder="Paylaşımı kapatma nedeni..."
      />

      {/* Delete Report Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Raporu Kalıcı Olarak Sil?"
        message={`"${report.id}" kimlikli rapor sistemden kalıcı olarak silinecektir. Bu işlem geri alınamaz ve denetim kütüğüne kaydedilir.`}
        confirmLabel="Raporu Kalıcı Olarak Sil"
        tone="danger"
        requireReason={true}
        reasonPlaceholder="Bu tanılama raporunun silinme gerekçesi..."
      />
    </div>
  );
};
