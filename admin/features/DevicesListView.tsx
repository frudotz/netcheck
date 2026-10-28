import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { Device, ReportRecord } from "../domain/types";
import { adres, sorguDegeri } from "../yol";
import { tarihSaat } from "../../src/lib/sozluk";
import { DataTable } from "../components/DataTable";
import type { Column } from "../components/DataTable";
import { FilterBar } from "../components/FilterBar";
import type { FilterConfig } from "../components/FilterBar";
import { Drawer } from "../components/Drawer";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Chart } from "../components/Chart";
import { CopyText } from "../components/CopyText";
import { useI18n } from "../i18n";
import { useToast } from "../context/ToastContext";
import {
  Smartphone,
  Laptop,
  Trash2,
  ArrowRight,
} from "lucide-react";

export const DevicesListView: React.FC = () => {
  const { t, locale } = useI18n();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<10 | 25 | 50>(10);
  const [search, setSearch] = useState(() => sorguDegeri("q") ?? "");
  const [filters, setFilters] = useState<Record<string, string | number | boolean | undefined>>({});

  // Device Detail Drawer
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceReports, setDeviceReports] = useState<ReportRecord[]>([]);
  const [loadingDeviceReports, setLoadingDeviceReports] = useState(false);

  // Delete Action
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDevices({
        page,
        pageSize,
        search,
        filters,
      });
      setDevices(res.items);
      setTotal(res.total);
    } catch {
      setError(t("errorDesc"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [page, pageSize, search, filters]);

  const handleOpenDrawer = async (device: Device) => {
    setSelectedDevice(device);
    setLoadingDeviceReports(true);
    try {
      const allReports = await api.getReports({ pageSize: 50 });
      const filtered = allReports.items.filter(r => r.deviceId === device.id);
      setDeviceReports(filtered);
    } catch {
      addToast(t("devicesReportsLoadError"), "error");
    } finally {
      setLoadingDeviceReports(false);
    }
  };

  const handleDeleteDeviceData = async (reason?: string) => {
    if (!deviceToDelete) return;
    try {
      await api.deleteDeviceData(deviceToDelete.id, reason ?? "");
      addToast(t("devicesDeleted"), "success");
      setDeviceToDelete(null);
      if (selectedDevice?.id === deviceToDelete.id) {
        setSelectedDevice(null);
      }
      fetchDevices();
    } catch {
      addToast(t("toastActionError"), "error");
    }
  };

  const familyLabel = (family: Device["platform"]["family"]) =>
    family === "mobile" ? t("devicesFamilyMobile") : t("devicesFamilyDesktop");

  const filterConfigs: FilterConfig[] = [
    {
      key: "os",
      label: t("deviceOs"),
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

  const columns: Column<Device>[] = [
    {
      key: "id",
      header: t("devicesId"),
      sortable: true,
      render: d => (
        <span onClick={e => e.stopPropagation()}>
          <CopyText value={d.id} />
        </span>
      ),
    },
    {
      key: "family",
      header: t("deviceFamily"),
      render: d => (
        <span className="inline-flex items-center gap-1.5 text-xs">
          {d.platform.family === "mobile" ? (
            <Smartphone className="w-3.5 h-3.5" />
          ) : (
            <Laptop className="w-3.5 h-3.5" />
          )}
          <span>{familyLabel(d.platform.family)}</span>
        </span>
      ),
    },
    {
      key: "os",
      header: t("deviceOs"),
      render: d => (
        <span
          className="font-mono text-xs px-2 py-0.5 rounded font-semibold uppercase"
          style={{
            backgroundColor: "var(--zemin)",
            color: "var(--renk-ana)",
            border: "1px solid var(--kenar)",
          }}
        >
          {d.platform.os}
        </span>
      ),
    },
    {
      key: "icmp",
      header: t("deviceIcmp"),
      render: d => (
        <span className="font-mono text-xs" style={{ color: "var(--yazi-soluk)" }}>
          {d.platform.icmp}
        </span>
      ),
    },
    {
      key: "appVersion",
      header: t("deviceAppVersion"),
      render: d => (
        <span className="font-mono text-xs font-medium">v{d.appVersion}</span>
      ),
    },
    {
      key: "lastSeenAt",
      header: t("deviceLastSeen"),
      sortable: true,
      render: d => (
        <span className="text-xs" style={{ color: "var(--yazi)" }}>
          {tarihSaat(d.lastSeenAt, locale)}
        </span>
      ),
    },
    {
      key: "reportCount",
      header: t("deviceReportCount"),
      sortable: true,
      render: d => (
        <span
          className="font-bold text-xs px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: "var(--zemin)",
            color: "var(--yazi)",
            border: "1px solid var(--kenar)",
          }}
        >
          {t("devicesReportCount", { count: d.reportCount })}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      render: d => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleOpenDrawer(d)}
            className="cursor-pointer text-xs font-semibold px-2.5 py-1 rounded border hover:opacity-80"
            style={{
              backgroundColor: "var(--zemin)",
              borderColor: "var(--kenar)",
              color: "var(--renk-ana)",
            }}
          >
            {t("devicesDetails")}
          </button>
          <button
            type="button"
            onClick={() => setDeviceToDelete(d)}
            className="cursor-pointer p-1 rounded hover:opacity-80 text-hata"
            title={t("deviceDeleteData")}
            aria-label={t("deviceDeleteData")}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Device trend chart points
  const trendData = deviceReports.map((r, i) => ({
    label: `${i + 1}`,
    value: r.score,
  }));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--yazi)" }}>
          {t("navDevices")}
        </h1>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
          {t("devicesSubtitle")}
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("devicesSearchPlaceholder")}
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

      {/* DataTable */}
      <DataTable<Device>
        columns={columns}
        rows={devices}
        rowKey={d => d.id}
        onRowClick={d => handleOpenDrawer(d)}
        loading={loading}
        error={error}
        onRetry={fetchDevices}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={ps => {
          setPageSize(ps);
          setPage(1);
        }}
        exportFilename="netcheck-cihazlar.csv"
        caption={t("devicesTableCaption")}
      />

      {/* Device Detail Drawer */}
      <Drawer
        isOpen={selectedDevice !== null}
        onClose={() => setSelectedDevice(null)}
        title={selectedDevice ? t("devicesDrawerTitle", { id: selectedDevice.id }) : t("devicesDrawerFallback")}
        width="lg"
      >
        {selectedDevice && (
          <div className="space-y-6 text-sm">
            {/* Spec Cards */}
            <div
              className="p-4 rounded-xl border grid grid-cols-2 gap-4"
              style={{
                backgroundColor: "var(--zemin)",
                borderColor: "var(--kenar)",
              }}
            >
              <div>
                <span className="text-xs" style={{ color: "var(--yazi-soluk)" }}>
                  {t("deviceOs")}
                </span>
                <p className="font-semibold" style={{ color: "var(--yazi)" }}>
                  {selectedDevice.platform.os} ({familyLabel(selectedDevice.platform.family)})
                </p>
              </div>
              <div>
                <span className="text-xs" style={{ color: "var(--yazi-soluk)" }}>
                  {t("deviceIcmp")}
                </span>
                <p className="font-mono font-semibold" style={{ color: "var(--yazi)" }}>
                  {selectedDevice.platform.icmp}
                </p>
              </div>
              <div>
                <span className="text-xs" style={{ color: "var(--yazi-soluk)" }}>
                  {t("deviceAppVersion")}
                </span>
                <p className="font-mono font-semibold" style={{ color: "var(--yazi)" }}>
                  v{selectedDevice.appVersion}
                </p>
              </div>
              <div>
                <span className="text-xs" style={{ color: "var(--yazi-soluk)" }}>
                  {t("deviceLocale")}
                </span>
                <p className="font-semibold uppercase" style={{ color: "var(--yazi)" }}>
                  {selectedDevice.locale}
                </p>
              </div>
            </div>

            {/* Score Trend Chart */}
            <div>
              <h3 className="font-semibold text-sm mb-2" style={{ color: "var(--yazi)" }}>
                {t("devicesScoreTrend", { count: deviceReports.length })}
              </h3>
              {trendData.length > 1 ? (
                <Chart
                  type="line"
                  data={trendData}
                  height={160}
                  valueFormatter={v => t("devicesPoints", { value: v })}
                />
              ) : (
                <div
                  className="p-4 rounded-xl text-center text-xs italic"
                  style={{
                    backgroundColor: "var(--zemin)",
                    color: "var(--yazi-soluk)",
                  }}
                >
                  {t("devicesTrendNotEnough")}
                </div>
              )}
            </div>

            {/* Reports List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm" style={{ color: "var(--yazi)" }}>
                {t("devicesReportsTitle")}
              </h3>
              {loadingDeviceReports ? (
                <div className="text-xs py-4 text-center">{t("loading")}</div>
              ) : deviceReports.length > 0 ? (
                <div className="space-y-2">
                  {deviceReports.map(rep => (
                    <div
                      key={rep.id}
                      className="p-3 rounded-lg border flex items-center justify-between text-xs transition-colors hover:bg-yazi/5"
                      style={{
                        backgroundColor: "var(--zemin)",
                        borderColor: "var(--kenar)",
                      }}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono font-semibold force-ltr" style={{ color: "var(--yazi)" }}>
                          {rep.id}
                        </span>
                        <span style={{ color: "var(--yazi-soluk)" }}>
                          {tarihSaat(rep.createdAt, locale)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className="font-bold px-2 py-0.5 rounded"
                          style={{
                            backgroundColor:
                              rep.score >= 80
                                ? "var(--durum-basarili-zemin)"
                                : rep.score >= 50
                                ? "var(--durum-uyari-zemin)"
                                : "var(--durum-hata-zemin)",
                            color:
                              rep.score >= 80
                                ? "var(--durum-basarili)"
                                : rep.score >= 50
                                ? "var(--durum-uyari)"
                                : "var(--durum-hata)",
                          }}
                        >
                          {t("devicesPoints", { value: rep.score })}
                        </span>
                        <a
                          href={adres("rapor", { id: rep.id })}
                          className="p-1 rounded hover:opacity-80"
                          style={{ color: "var(--renk-ana)" }}
                          title={t("view")}
                          aria-label={t("view")}
                        >
                          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-center py-4 italic" style={{ color: "var(--yazi-soluk)" }}>
                  {t("devicesNoReports")}
                </div>
              )}
            </div>

            {/* Delete Device Data Button */}
            <div className="pt-4 border-t" style={{ borderColor: "var(--kenar)" }}>
              <button
                type="button"
                onClick={() => setDeviceToDelete(selectedDevice)}
                className="cursor-pointer w-full py-2.5 px-4 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: "var(--durum-hata)",
                  color: "var(--durum-hata-zemin)",
                  borderRadius: "var(--radius)",
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t("deviceDeleteData")}</span>
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Device Data Confirm Dialog */}
      <ConfirmDialog
        isOpen={deviceToDelete !== null}
        onClose={() => setDeviceToDelete(null)}
        onConfirm={handleDeleteDeviceData}
        title={t("devicesDeleteTitle")}
        message={t("devicesDeleteMessage", { id: deviceToDelete?.id ?? "" })}
        confirmLabel={t("deviceDeleteData")}
        tone="danger"
        requireReason={true}
        reasonPlaceholder={t("devicesDeleteReason")}
      />
    </div>
  );
};
