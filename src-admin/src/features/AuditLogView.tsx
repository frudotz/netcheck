import React, { useState, useEffect } from "react";
import { api } from "../api/nativeAdapter";
import { AdminUser, AuditLogEntry } from "../domain/types";
import { DataTable, Column } from "../components/DataTable";
import { FilterBar, FilterConfig } from "../components/FilterBar";
import { Drawer } from "../components/Drawer";
import { JsonDiff } from "../components/JsonDiff";
import { CopyText } from "../components/CopyText";
import { useI18n } from "../i18n";
import {
  ShieldAlert,
  Calendar,
  User,
  Activity,
  FileSearch,
} from "lucide-react";

export const AuditLogView: React.FC = () => {
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);

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
      const [res, users] = await Promise.all([
        api.getAuditLogs({ page, pageSize, search, filters }),
        api.getAdmins(),
      ]);
      setLogs(res.items);
      setTotal(res.total);
      setAdmins(users);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorDesc"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize, search, filters]);

  const filterConfigs: FilterConfig[] = [
    {
      key: "actorId",
      label: t("auditActor"),
      type: "select",
      options: admins.map(admin => ({
        value: admin.id,
        label: `${admin.id} (${admin.name})`,
      })),
    },
    {
      key: "action",
      label: t("auditAction"),
      type: "select",
      options: Array.from(new Set(logs.map(log => log.action)))
        .sort()
        .map(action => ({ value: action, label: action })),
    },
    {
      key: "entity",
      label: t("auditEntity"),
      type: "select",
      options: Array.from(new Set(logs.map(log => log.entity)))
        .sort()
        .map(entity => ({ value: entity, label: entity })),
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
            {d.toLocaleDateString("tr-TR", {
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
          className="font-mono text-xs font-semibold px-2 py-0.5 rounded border"
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
            className="font-mono text-xs px-2 py-0.5 rounded-full font-semibold"
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
        <span className="text-xs truncate max-w-xs block" style={{ color: "var(--yazi-soluk)" }}>
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
          Güvenlik, yetkilendirme ve hassas veri ifşa (PII) işlemlerinin değiştirilemez kayıtları
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Eylem, kullanıcı, varlık veya gerekçe ara..."
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
        caption="Denetim Günlüğü Kayıtları"
      />

      {/* Diff Inspection Drawer */}
      <Drawer
        isOpen={inspectEntry !== null}
        onClose={() => setInspectEntry(null)}
        title={inspectEntry ? `Denetim Detayı: ${inspectEntry.action}` : "Kayıt Detayı"}
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
                <span style={{ color: "var(--yazi-soluk)" }}>Tarih / Saat:</span>
                <p className="font-mono font-semibold" style={{ color: "var(--yazi)" }}>
                  {new Date(inspectEntry.at).toLocaleString("tr-TR")}
                </p>
              </div>
              <div>
                <span style={{ color: "var(--yazi-soluk)" }}>İşlemi Yapan (Aktör):</span>
                <p className="font-mono font-semibold" style={{ color: "var(--renk-ana)" }}>
                  {inspectEntry.actorId}
                </p>
              </div>
              <div>
                <span style={{ color: "var(--yazi-soluk)" }}>İlgili Varlık:</span>
                <p className="font-semibold" style={{ color: "var(--yazi)" }}>
                  {inspectEntry.entity} ({inspectEntry.entityId})
                </p>
              </div>
              <div>
                <span style={{ color: "var(--yazi-soluk)" }}>Eylem Kodu:</span>
                <p className="font-mono font-semibold" style={{ color: "var(--yazi)" }}>
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
                style={{
                  backgroundColor: "var(--kart)",
                  borderColor: "var(--kenar)",
                  color: "var(--yazi)",
                }}
              >
                {inspectEntry.reason || "Herhangi bir gerekçe girilmedi."}
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
