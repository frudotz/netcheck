import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { AdminUser, AuditLogEntry } from "../domain/types";
import { DataTable, type Column } from "../components/DataTable";
import { FilterBar, type FilterConfig } from "../components/FilterBar";
import { Drawer } from "../components/Drawer";
import { JsonDiff } from "../components/JsonDiff";
import { CopyText } from "../components/CopyText";
import { useI18n } from "../i18n";

export const AuditLogView: React.FC = () => {
  const { t, locale } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);

  // İşlemi yapan filtresinin seçenekleri yönetici listesinden gelir.
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<10 | 25 | 50>(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string | number | boolean | undefined>>({});

  // Diff inspection drawer
  const [inspectEntry, setInspectEntry] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAuditLogs({
        page,
        pageSize,
        search,
        filters,
      });
      setLogs(res.items);
      setTotal(res.total);
    } catch {
      setError(t("errorDesc"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize, search, filters]);

  useEffect(() => {
    api
      .getAdmins()
      .then(setAdmins)
      .catch(() => {
        // Liste alınamazsa filtre seçeneksiz kalır; kayıtların hatası tabloda gösterilir.
        setAdmins([]);
      });
  }, []);

  const filterConfigs: FilterConfig[] = [
    {
      key: "actorId",
      label: t("auditActor"),
      type: "select",
      options: admins.map(a => ({ value: a.id, label: `${a.name} (${a.id})` })),
    },
    {
      key: "action",
      label: t("auditAction"),
      type: "select",
      // Eylem kodları veridir, çevrilmez; yalnız açıklaması olan kodun yanına açıklama eklenir.
      options: [
        { value: "pii.reveal", label: `pii.reveal (${t("auditLogActionPiiReveal")})` },
        { value: "report.disable_sharing", label: "report.disable_sharing" },
        { value: "rule.publish", label: "rule.publish" },
        { value: "rule.save_draft", label: "rule.save_draft" },
        { value: "message.reply", label: "message.reply" },
        { value: "target.update", label: "target.update" },
      ],
    },
    {
      key: "entity",
      label: t("auditEntity"),
      type: "select",
      // Varlık türleri veri modelindeki adlardır (çevrilmez).
      options: [
        { value: "Report", label: "Report" },
        { value: "ScoreRule", label: "ScoreRule" },
        { value: "DiagnosticTarget", label: "DiagnosticTarget" },
        { value: "ContactMessage", label: "ContactMessage" },
        { value: "Device", label: "Device" },
      ],
    },
  ];

  const columns: Column<AuditLogEntry>[] = [
    {
      key: "at",
      header: t("auditDate"),
      sortable: true,
      width: "180px",
      render: l => {
        const d = new Date(l.at);
        return (
          <span className="font-mono text-xs" style={{ color: "var(--yazi)" }}>
            {d.toLocaleDateString(locale, {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        );
      },
    },
    {
      key: "actorId",
      header: t("auditActor"),
      render: l => (
        <span
          className="font-mono text-xs font-semibold px-2 py-0.5 rounded border force-ltr"
          style={{
            backgroundColor: "var(--zemin)",
            borderColor: "var(--kenar)",
            color: "var(--renk-ana)",
          }}
        >
          {l.actorId}
        </span>
      ),
    },
    {
      key: "action",
      header: t("auditAction"),
      render: l => {
        const isPii = l.action === "pii.reveal";
        const isDelete = l.action.includes("delete");
        return (
          <span
            className="font-mono text-xs px-2 py-0.5 rounded-full font-semibold force-ltr"
            style={{
              backgroundColor: isPii
                ? "var(--durum-uyari-zemin)"
                : isDelete
                ? "var(--durum-hata-zemin)"
                : "var(--zemin)",
              color: isPii
                ? "var(--durum-uyari)"
                : isDelete
                ? "var(--durum-hata)"
                : "var(--yazi)",
              border: "1px solid var(--kenar)",
            }}
          >
            {l.action}
          </span>
        );
      },
    },
    {
      key: "entity",
      header: t("auditEntity"),
      render: l => (
        <span className="text-xs font-medium" style={{ color: "var(--yazi)" }}>
          {l.entity}
        </span>
      ),
    },
    {
      key: "entityId",
      header: t("auditEntityId"),
      render: l => (
        <span onClick={e => e.stopPropagation()}>
          <CopyText value={l.entityId} />
        </span>
      ),
    },
    {
      key: "reason",
      header: t("auditReason"),
      render: l => (
        <span className="text-xs truncate max-w-xs block" dir="auto" style={{ color: "var(--yazi-soluk)" }}>
          {l.reason || "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--yazi)" }}>
          {t("auditTitle")}
        </h1>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
          {t("auditLogSubtitle")}
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("auditLogSearchPlaceholder")}
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
      <DataTable<AuditLogEntry>
        columns={columns}
        rows={logs}
        rowKey={l => l.id}
        onRowClick={l => setInspectEntry(l)}
        loading={loading}
        error={error}
        onRetry={fetchLogs}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={ps => {
          setPageSize(ps);
          setPage(1);
        }}
        exportFilename="netcheck-denetim-gunlugu.csv"
        caption={t("auditLogTableCaption")}
      />

      {/* Diff Inspection Drawer */}
      <Drawer
        isOpen={inspectEntry !== null}
        onClose={() => setInspectEntry(null)}
        title={inspectEntry ? t("auditLogDetailTitle", { action: inspectEntry.action }) : t("auditLogDetailFallback")}
        width="lg"
      >
        {inspectEntry && (
          <div className="space-y-6 text-sm">
            {/* Meta summary card */}
            <div
              className="p-4 rounded-xl border grid grid-cols-2 gap-4 text-xs"
              style={{
                backgroundColor: "var(--zemin)",
                borderColor: "var(--kenar)",
              }}
            >
              <div>
                <span style={{ color: "var(--yazi-soluk)" }}>{t("auditDate")}:</span>
                <p className="font-mono font-semibold" style={{ color: "var(--yazi)" }}>
                  {new Date(inspectEntry.at).toLocaleString(locale)}
                </p>
              </div>
              <div>
                <span style={{ color: "var(--yazi-soluk)" }}>{t("auditActor")}:</span>
                <p className="font-mono font-semibold force-ltr" style={{ color: "var(--renk-ana)" }}>
                  {inspectEntry.actorId}
                </p>
              </div>
              <div>
                <span style={{ color: "var(--yazi-soluk)" }}>{t("auditEntity")}:</span>
                <p className="font-semibold" style={{ color: "var(--yazi)" }}>
                  {inspectEntry.entity} <span className="force-ltr">({inspectEntry.entityId})</span>
                </p>
              </div>
              <div>
                <span style={{ color: "var(--yazi-soluk)" }}>{t("auditAction")}:</span>
                <p className="font-mono font-semibold force-ltr" style={{ color: "var(--yazi)" }}>
                  {inspectEntry.action}
                </p>
              </div>
            </div>

            {/* Justification / Reason */}
            <div>
              <span className="text-xs font-semibold block mb-1" style={{ color: "var(--yazi-soluk)" }}>
                {t("auditReason")}:
              </span>
              <p
                className="p-3 rounded-lg border text-xs leading-relaxed"
                dir="auto"
                style={{
                  backgroundColor: "var(--kart)",
                  borderColor: "var(--kenar)",
                  color: "var(--yazi)",
                }}
              >
                {inspectEntry.reason || t("auditLogNoReason")}
              </p>
            </div>

            {/* JSON Diff Inspection */}
            <div>
              <span className="text-xs font-semibold block mb-2" style={{ color: "var(--yazi)" }}>
                {t("auditDiff")}
              </span>
              <JsonDiff before={inspectEntry.before} after={inspectEntry.after} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
