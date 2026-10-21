import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/nativeAdapter";
import { ReportRecord } from "../domain/types";
import { DataTable, Column } from "../components/DataTable";
import { FilterBar, FilterConfig } from "../components/FilterBar";
import { StatusBadge, StatusTone } from "../components/StatusBadge";
import { CopyText } from "../components/CopyText";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useI18n } from "../i18n";
import { useToast } from "../context/ToastContext";
import {
  FileText,
  Share2,
  Lock,
  Wifi,
  Network,
  Smartphone,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban,
} from "lucide-react";

export const ReportsListView: React.FC = () => {
  const { t } = useI18n();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [scoreThresholds, setScoreThresholds] = useState({ iyi: 80, orta: 50 });

  // Pagination & Sort & Filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<10 | 25 | 50>(10);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({
    key: "createdAt",
    dir: "desc",
  });
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [filters, setFilters] = useState<Record<string, string | number | boolean | undefined>>({});

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulkDisableShare, setConfirmBulkDisableShare] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, thresholds] = await Promise.all([
        api.getReports({ page, pageSize, sort, search, filters }),
        api.getScoreThresholds(),
      ]);
      setReports(res.items);
      setTotal(res.total);
      setScoreThresholds(thresholds);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorDesc"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, pageSize, sort, search, filters]);

  const handleBulkDisableSharing = async (reason?: string) => {
    try {
      for (const id of selectedIds) {
        await api.updateReportSharing(id, false, reason);
      }
      addToast(`${selectedIds.length} raporun paylaşımı kapatıldı.`, "success");
      setSelectedIds([]);
      setConfirmBulkDisableShare(false);
      fetchReports();
    } catch (error) {
      addToast(error instanceof Error ? error.message : t("toastActionError"), "error");
    }
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: "scoreLevel",
      label: "Skor Seviyesi",
      type: "select",
      options: [
        { value: "iyi", label: `${t("scoreGood")} (≥ ${scoreThresholds.iyi})` },
        { value: "orta", label: `${t("scoreMedium")} (${scoreThresholds.orta}-${scoreThresholds.iyi - 1})` },
        { value: "zayif", label: `${t("scoreWeak")} (< ${scoreThresholds.orta})` },
      ],
    },
    {
      key: "connectionType",
      label: t("reportConnectionType"),
      type: "select",
      options: [
        { value: "wifi", label: "Wi-Fi" },
        { value: "ethernet", label: "Ethernet" },
        { value: "cellular", label: "Hücresel" },
      ],
    },
    {
      key: "testStatus",
      label: "Test Durumu",
      type: "select",
      options: [
        { value: "success", label: "Başarılı" },
        { value: "failed", label: "Başarısız" },
        { value: "unavailable", label: "Kullanılamıyor" },
      ],
    },
    {
      key: "shared",
      label: "Paylaşım",
      type: "select",
      options: [
        { value: "true", label: "Açık (Public)" },
        { value: "false", label: "Kapalı (Private)" },
      ],
    },
  ];

  const columns: Column<ReportRecord>[] = [
    {
      key: "id",
      header: t("reportId"),
      sortable: true,
      width: "220px",
      render: r => (
        <span onClick={e => e.stopPropagation()}>
          <CopyText value={r.id} />
        </span>
      ),
    },
    {
      key: "createdAt",
      header: t("reportDate"),
      sortable: true,
      render: r => {
        const d = new Date(r.createdAt);
        return (
          <span className="font-mono text-xs" style={{ color: "var(--yazi)" }}>
            {d.toLocaleDateString("tr-TR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        );
      },
    },
    {
      key: "score",
      header: t("reportScore"),
      sortable: true,
      render: r => {
        let tone: StatusTone = "success";
        let label = `${r.score} · ${t("scoreGood")}`;
        if (r.score < 50) {
          tone = "danger";
          label = `${r.score} · ${t("scoreWeak")}`;
        } else if (r.score < 80) {
          tone = "warning";
          label = `${r.score} · ${t("scoreMedium")}`;
        }
        return <StatusBadge tone={tone} label={label} size="sm" />;
      },
    },
    {
      key: "passed",
      header: t("reportTestsPassed"),
      render: r => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="font-semibold" style={{ color: "var(--durum-basarili)" }}>
            {r.passed} Başarılı
          </span>
          <span style={{ color: "var(--yazi-soluk)" }}>/</span>
          <span
            className="font-semibold"
            style={{
              color: r.failed > 0 ? "var(--durum-hata)" : "var(--yazi-soluk)",
            }}
          >
            {r.failed} Başarısız
          </span>
        </div>
      ),
    },
    {
      key: "connectionType",
      header: t("reportConnectionType"),
      render: r => {
        const type = r.network.connectionType;
        const icon =
          type === "wifi" ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : type === "ethernet" ? (
            <Network className="w-3.5 h-3.5" />
          ) : (
            <Smartphone className="w-3.5 h-3.5" />
          );
        return (
          <span className="inline-flex items-center gap-1.5 capitalize text-xs">
            {icon}
            <span>{type}</span>
          </span>
        );
      },
    },
    {
      key: "shared",
      header: t("reportSharedStatus"),
      sortable: true,
      render: r => {
        return r.shared ? (
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "var(--durum-basarili-zemin)",
              color: "var(--durum-basarili)",
            }}
          >
            <Share2 className="w-3 h-3" />
            <span>{t("reportSharedOn")}</span>
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "var(--zemin)",
              color: "var(--yazi-soluk)",
              border: "1px solid var(--kenar)",
            }}
          >
            <Lock className="w-3 h-3" />
            <span>{t("reportSharedOff")}</span>
          </span>
        );
      },
    },
    {
      key: "ruleVersion",
      header: t("reportRuleVersion"),
      render: r => (
        <span
          className="font-mono text-xs px-1.5 py-0.5 rounded border"
          style={{
            backgroundColor: "var(--zemin)",
            borderColor: "var(--kenar)",
            color: "var(--yazi-soluk)",
          }}
        >
          v{r.ruleVersion}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Bulk Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--yazi)" }}>
            {t("navReports")}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
            Kullanıcı cihazlarından gelen ağ tanılama ve skorlama raporları
          </p>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in">
            <button
              type="button"
              onClick={() => setConfirmBulkDisableShare(true)}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: "var(--durum-uyari)",
                color: "#ffffff",
                borderRadius: "var(--radius)",
              }}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Seçilenlerin Paylaşımını Kapat ({selectedIds.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rapor ID, Cihaz veya IP ara (örn: NCHK-2026-3F9A0C71)..."
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={(key, val) => {
          setFilters(prev => ({ ...prev, [key]: val }));
          setPage(1);
        }}
        onClear={() => {
          setSearch("");
          setFilters({});
          setPage(1);
        }}
      />

      {/* Data Table */}
      <DataTable<ReportRecord>
        columns={columns}
        rows={reports}
        rowKey={r => r.id}
        onRowClick={r => navigate(`/raporlar?id=${encodeURIComponent(r.id)}`)}
        loading={loading}
        error={error}
        onRetry={fetchReports}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={ps => {
          setPageSize(ps);
          setPage(1);
        }}
        sort={sort}
        onSortChange={setSort}
        selectedKeys={selectedIds}
        onSelectChange={setSelectedIds}
        exportFilename="netcheck-raporlar.csv"
        caption="Ağ Tanılama Raporları Listesi"
      />

      {/* Bulk Disable Share Confirmation */}
      <ConfirmDialog
        isOpen={confirmBulkDisableShare}
        onClose={() => setConfirmBulkDisableShare(false)}
        onConfirm={handleBulkDisableSharing}
        title="Seçilen Raporların Paylaşımını Kapat?"
        message={`Seçili ${selectedIds.length} raporun genel internet erişim bağlantısı derhal sonlandırılacaktır. Bu işlem denetim günlüğüne kaydedilecektir.`}
        confirmLabel="Paylaşımları Kapat"
        tone="warning"
        requireReason={true}
        reasonPlaceholder="Örn: Kullanıcı talebi veya güvenlik denetimi nedeniyle kapatıldı..."
      />
    </div>
  );
};
