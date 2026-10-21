import React, { useState, useEffect } from "react";
import { api } from "../api/mockAdapter";
import { ReportRecord, Device } from "../domain/types";
import { StatCard } from "../components/StatCard";
import { Chart } from "../components/Chart";
import { FilterBar, FilterConfig } from "../components/FilterBar";
import { CardSkeleton, ChartSkeleton } from "../components/Skeleton";
import { useI18n } from "../i18n";
import {
  FileText,
  Activity,
  ShieldCheck,
  Smartphone,
  Download,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export const DashboardView: React.FC = () => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  // Filters
  const [dateRange, setDateRange] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [reportsData, devicesData] = await Promise.all([
        api.getReports({ pageSize: 50, filters: { dateRange: dateRange !== "all" ? dateRange : undefined, platform: selectedPlatform || undefined } }),
        api.getDevices({ pageSize: 50 }),
      ]);
      setReports(reportsData.items);
      setDevices(devicesData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorDesc"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedPlatform]);

  // KPIs
  const totalReports = reports.length;
  const avgScore = totalReports > 0 ? Math.round(reports.reduce((s, r) => s + r.score, 0) / totalReports) : 0;
  const goodReports = reports.filter(r => r.score >= 80).length;
  const mediumReports = reports.filter(r => r.score >= 50 && r.score < 80).length;
  const weakReports = reports.filter(r => r.score < 50).length;
  const goodRatio = totalReports > 0 ? Math.round((goodReports / totalReports) * 100) : 0;
  const activeDevicesCount = devices.length;

  // Chart data: Score Distribution (Donut)
  const scoreDistData = [
    { label: t("scoreGood"), value: goodReports, color: "var(--durum-basarili)" },
    { label: t("scoreMedium"), value: mediumReports, color: "var(--durum-uyari)" },
    { label: t("scoreWeak"), value: weakReports, color: "var(--durum-hata)" },
  ];

  // Chart data: Test Success Rates (Bar)
  const testCounts: Record<string, { total: number; success: number }> = {
    gateway: { total: 0, success: 0 },
    cloudflare: { total: 0, success: 0 },
    google: { total: 0, success: 0 },
    dns: { total: 0, success: 0 },
    internet: { total: 0, success: 0 },
  };

  reports.forEach(r => {
    r.tests.forEach(test => {
      if (testCounts[test.id]) {
        testCounts[test.id].total++;
        if (test.status === "success") {
          testCounts[test.id].success++;
        }
      }
    });
  });

  const testSuccessData = [
    {
      label: "Gateway (Ağ Geçidi)",
      value: testCounts.gateway.total > 0 ? Math.round((testCounts.gateway.success / testCounts.gateway.total) * 100) : 0,
      color: "var(--renk-ana)",
    },
    {
      label: "Cloudflare (1.1.1.1)",
      value: testCounts.cloudflare.total > 0 ? Math.round((testCounts.cloudflare.success / testCounts.cloudflare.total) * 100) : 0,
      color: "var(--renk-ana)",
    },
    {
      label: "Google DNS (8.8.8.8)",
      value: testCounts.google.total > 0 ? Math.round((testCounts.google.success / testCounts.google.total) * 100) : 0,
      color: "var(--renk-ana)",
    },
    {
      label: "DNS Çözümleme",
      value: testCounts.dns.total > 0 ? Math.round((testCounts.dns.success / testCounts.dns.total) * 100) : 0,
      color: "var(--renk-ana)",
    },
    {
      label: "İnternet (HTTPS)",
      value: testCounts.internet.total > 0 ? Math.round((testCounts.internet.success / testCounts.internet.total) * 100) : 0,
      color: "var(--renk-ana)",
    },
  ];

  // Chart data: Platform Distribution
  const platformCounts: Record<string, number> = {};
  devices.forEach(d => {
    const os = d.platform.os.toUpperCase();
    platformCounts[os] = (platformCounts[os] || 0) + 1;
  });
  const platformData = Object.entries(platformCounts).map(([label, value]) => ({
    label,
    value,
  }));

  // Chart data: Daily Report Trend (Line)
  const last7DaysLabels = ["08 Eki", "09 Eki", "10 Eki", "11 Eki", "12 Eki", "13 Eki", "14 Eki"];
  const trendData = last7DaysLabels.map((label, idx) => ({
    label,
    value: 3 + (idx * 2) + (idx % 3 === 0 ? 3 : 1),
  }));

  const filterConfigs: FilterConfig[] = [
    {
      key: "dateRange",
      label: t("dateRange"),
      type: "select",
      options: [
        { value: "all", label: t("allTime") },
        { value: "7d", label: t("last7Days") },
        { value: "30d", label: t("last30Days") },
      ],
    },
    {
      key: "platform",
      label: t("filterPlatform"),
      type: "select",
      options: [
        { value: "windows", label: "Windows" },
        { value: "macos", label: "macOS" },
        { value: "linux", label: "Linux" },
        { value: "android", label: "Android" },
        { value: "ios", label: "iOS" },
      ],
    },
  ];

  const handleExportSummaryCsv = () => {
    const headers = "Metrik,Değer\n";
    const rows = [
      `Toplam Rapor,${totalReports}`,
      `Ortalama Skor,${avgScore}`,
      `İyi Rapor Oranı,%${goodRatio}`,
      `Aktif Cihaz Sayısı,${activeDevicesCount}`,
    ].join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "netcheck-panel-ozeti.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--yazi)" }}>
            {t("navDashboard")}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
            Ağ tanılama raporlarının genel performansı ve filo istatistikleri
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportSummaryCsv}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border hover:opacity-85 transition-opacity"
            style={{
              backgroundColor: "var(--kart)",
              borderColor: "var(--kenar)",
              color: "var(--yazi)",
              borderRadius: "var(--radius)",
            }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t("exportCsv")}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filterConfigs}
        filterValues={{ dateRange, platform: selectedPlatform }}
        onFilterChange={(key, val) => {
          if (key === "dateRange") setDateRange((val as string) || "all");
          if (key === "platform") setSelectedPlatform((val as string) || "");
        }}
        onClear={() => {
          setDateRange("all");
          setSelectedPlatform("");
        }}
      />

      {error ? (
        <div
          className="p-6 rounded-xl border flex flex-col items-center justify-center text-center my-4"
          style={{
            backgroundColor: "var(--durum-hata-zemin)",
            borderColor: "var(--durum-hata)",
            borderRadius: "var(--radius)",
          }}
        >
          <AlertCircle className="w-7 h-7 mb-2" style={{ color: "var(--durum-hata)" }} />
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--durum-hata)" }}>
            {error}
          </p>
          <button
            type="button"
            onClick={fetchData}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg"
            style={{
              backgroundColor: "var(--durum-hata)",
              color: "#ffffff",
              borderRadius: "var(--radius)",
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t("retry")}</span>
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      ) : (
        <>
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t("kpiTotalReports")}
              value={totalReports}
              change={14.2}
              sparkline={[12, 16, 14, 20, 24, 28, 33]}
              icon={<FileText className="w-4 h-4" />}
            />
            <StatCard
              title={t("kpiAvgScore")}
              value={`${avgScore} / 100`}
              change={-2.1}
              tone={avgScore >= 80 ? "success" : avgScore >= 50 ? "warning" : "danger"}
              sparkline={[82, 85, 78, 80, 84, 82, avgScore]}
              icon={<Activity className="w-4 h-4" />}
            />
            <StatCard
              title={t("kpiGoodRatio")}
              value={`%${goodRatio}`}
              change={5.4}
              tone="success"
              sparkline={[60, 64, 68, 65, 70, 72, goodRatio]}
              icon={<ShieldCheck className="w-4 h-4" />}
            />
            <StatCard
              title={t("kpiActiveDevices")}
              value={activeDevicesCount}
              change={0}
              sparkline={[8, 8, 8, 8, 8, 8, 8]}
              icon={<Smartphone className="w-4 h-4" />}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Chart
              type="donut"
              title={t("chartScoreDistribution")}
              data={scoreDistData}
              valueFormatter={v => `${v} rapor`}
            />
            <Chart
              type="bar"
              title={t("chartTestSuccessRate")}
              data={testSuccessData}
              valueFormatter={v => `%${v}`}
            />
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Chart
              type="line"
              title={t("chartDailyTrend")}
              data={trendData}
              valueFormatter={v => `${v} rapor`}
            />
            <Chart
              type="histogram"
              title={t("chartPlatformDist")}
              data={platformData}
              valueFormatter={v => `${v} cihaz`}
            />
          </div>
        </>
      )}
    </div>
  );
};
