import React, { useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { TableSkeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { useI18n } from "../i18n";
import { useDensity } from "../context/DensityContext";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  hideable?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };

  // Sorting
  sort?: { key: string; dir: "asc" | "desc" };
  onSortChange?: (sort: { key: string; dir: "asc" | "desc" }) => void;

  // Pagination
  page?: number;
  pageSize?: 10 | 25 | 50;
  total?: number;
  onPageChange?: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: 10 | 25 | 50) => void;

  // Optional selection
  selectedKeys?: string[];
  onSelectChange?: (selected: string[]) => void;

  // Export
  exportFilename?: string;
  caption?: string;
  className?: string;
}

export function DataTable<T extends object>({
  columns,
  rows,
  rowKey,
  onRowClick,
  loading = false,
  error = null,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  sort,
  onSortChange,
  page = 1,
  pageSize = 10,
  total = rows.length,
  onPageChange,
  onPageSizeChange,
  selectedKeys,
  onSelectChange,
  exportFilename = "export.csv",
  caption = "Veri Tablosu",
  className = "",
}: DataTableProps<T>) {
  const { t } = useI18n();
  const { density } = useDensity();
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [showColMenu, setShowColMenu] = useState(false);

  // Density padding classes
  const densityPadding =
    density === "compact"
      ? "py-2 px-3 text-xs"
      : density === "comfortable"
      ? "py-4 px-4 text-sm"
      : "py-3 px-3.5 text-xs sm:text-sm";

  // Visible columns
  const visibleColumns = columns.filter(c => !hiddenCols.has(c.key));

  // CSV Export handler
  const handleExportCsv = () => {
    if (rows.length === 0) return;
    const headers = visibleColumns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(",");
    const csvRows = rows.map(row => {
      return visibleColumns
        .map(c => {
          const val = (row as any)[c.key];
          if (val === undefined || val === null) return '""';
          const str = typeof val === "object" ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",");
    });
    const blob = new Blob(["\uFEFF" + [headers, ...csvRows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportFilename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Sort click
  const handleSort = (colKey: string) => {
    if (!onSortChange) return;
    if (sort?.key === colKey) {
      onSortChange({
        key: colKey,
        dir: sort.dir === "asc" ? "desc" : "asc",
      });
    } else {
      onSortChange({ key: colKey, dir: "asc" });
    }
  };

  // Toggle selection
  const isAllSelected = rows.length > 0 && rows.every(r => selectedKeys?.includes(rowKey(r)));
  const handleSelectAll = () => {
    if (!onSelectChange) return;
    if (isAllSelected) {
      onSelectChange([]);
    } else {
      onSelectChange(rows.map(r => rowKey(r)));
    }
  };

  const handleSelectRow = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectChange || !selectedKeys) return;
    if (selectedKeys.includes(key)) {
      onSelectChange(selectedKeys.filter(k => k !== key));
    } else {
      onSelectChange([...selectedKeys, key]);
    }
  };

  // Error state
  if (error) {
    return (
      <div
        className="p-8 rounded-xl flex flex-col items-center justify-center text-center my-4"
        style={{
          backgroundColor: "var(--durum-hata-zemin)",
          border: "1px solid var(--durum-hata)",
          borderRadius: "var(--radius)",
        }}
      >
        <AlertCircle className="w-8 h-8 mb-3" style={{ color: "var(--durum-hata)" }} />
        <h4 className="font-semibold text-base mb-1" style={{ color: "var(--durum-hata)" }}>
          {t("errorTitle")}
        </h4>
        <p className="text-xs sm:text-sm mb-4 max-w-md" style={{ color: "var(--yazi)" }}>
          {error}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: "var(--durum-hata)",
              color: "#ffffff",
              borderRadius: "var(--radius)",
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t("retry")}</span>
          </button>
        )}
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div
        className="rounded-xl overflow-hidden border my-4"
        style={{
          backgroundColor: "var(--kart)",
          borderColor: "var(--kenar)",
          borderRadius: "var(--radius)",
        }}
      >
        <TableSkeleton rows={pageSize > 10 ? 8 : 5} cols={columns.length} />
      </div>
    );
  }

  // Empty state
  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? t("emptyTitle")}
        description={emptyDescription ?? t("emptyDesc")}
        action={emptyAction}
      />
    );
  }

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div
      className={`rounded-xl flex flex-col border shadow-xs ${className}`}
      style={{
        backgroundColor: "var(--kart)",
        borderColor: "var(--kenar)",
        borderRadius: "var(--radius)",
      }}
    >
      {/* Table Toolbar (Export, Column visibility, Selection count) */}
      <div
        className="flex items-center justify-between px-4 py-3 text-xs gap-3 flex-wrap"
        style={{
          borderBottom: "1px solid var(--kenar)",
          backgroundColor: "var(--zemin)",
        }}
      >
        <div className="flex items-center gap-2 font-medium" style={{ color: "var(--yazi-soluk)" }}>
          {selectedKeys && selectedKeys.length > 0 ? (
            <span
              className="px-2.5 py-1 rounded-full font-semibold"
              style={{
                backgroundColor: "var(--durum-basarili-zemin)",
                color: "var(--durum-basarili)",
              }}
            >
              {t("selectedCount", { count: selectedKeys.length })}
            </span>
          ) : (
            <span>Toplam {total} kayıt</span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Column visibility toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColMenu(!showColMenu)}
              className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border hover:opacity-80 transition-colors focus-visible:outline-none"
              style={{
                backgroundColor: "var(--kart)",
                borderColor: "var(--kenar)",
                color: "var(--yazi)",
              }}
              title="Sütunları Göster / Gizle"
              aria-expanded={showColMenu}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sütunlar</span>
            </button>

            {showColMenu && (
              <div
                className="absolute right-0 top-full mt-1.5 w-48 p-2 rounded-lg shadow-xl border z-30 flex flex-col gap-1.5"
                style={{
                  backgroundColor: "var(--kart)",
                  borderColor: "var(--kenar)",
                }}
              >
                <div
                  className="text-xs font-semibold px-2 py-1 border-b"
                  style={{ borderColor: "var(--kenar)", color: "var(--yazi)" }}
                >
                  Sütun Tercihleri
                </div>
                {columns.map(col => {
                  const isVisible = !hiddenCols.has(col.key);
                  return (
                    <label
                      key={col.key}
                      className="cursor-pointer flex items-center gap-2 px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-xs"
                      style={{ color: "var(--yazi)" }}
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => {
                          const next = new Set(hiddenCols);
                          if (isVisible) {
                            if (visibleColumns.length > 1) next.add(col.key);
                          } else {
                            next.delete(col.key);
                          }
                          setHiddenCols(next);
                        }}
                        className="rounded"
                      />
                      <span>{col.header}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* CSV Export */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border hover:opacity-80 transition-colors focus-visible:outline-none"
            style={{
              backgroundColor: "var(--kart)",
              borderColor: "var(--kenar)",
              color: "var(--yazi)",
            }}
            title={t("exportCsv")}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("exportCsv")}</span>
          </button>
        </div>
      </div>

      {/* Desktop / Tablet View (Table) */}
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--kenar)",
                backgroundColor: "var(--zemin)",
              }}
            >
              {onSelectChange && (
                <th scope="col" className="w-10 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    aria-label={t("selectAll")}
                    className="cursor-pointer rounded"
                  />
                </th>
              )}

              {visibleColumns.map(col => {
                const isSorted = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={{ width: col.width }}
                    className={`${densityPadding} font-semibold`}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="cursor-pointer inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity font-semibold focus-visible:outline-none"
                        style={{ color: isSorted ? "var(--renk-ana)" : "var(--yazi)" }}
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sort.dir === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      <span style={{ color: "var(--yazi)" }}>{col.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const key = rowKey(row);
              const isSelected = selectedKeys?.includes(key);
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors border-b last:border-b-0 ${
                    onRowClick ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : ""
                  }`}
                  style={{
                    borderColor: "var(--kenar)",
                    backgroundColor: isSelected ? "var(--durum-basarili-zemin)" : "transparent",
                  }}
                >
                  {onSelectChange && (
                    <td className="w-10 px-3 py-3 text-center" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => handleSelectRow(key, e as unknown as React.MouseEvent)}
                        aria-label={`Seç: ${key}`}
                        className="cursor-pointer rounded"
                      />
                    </td>
                  )}

                  {visibleColumns.map((col, cIdx) => (
                    <td
                      key={col.key}
                      className={densityPadding}
                      style={{ color: "var(--yazi)" }}
                    >
                      {col.render ? col.render(row, idx) : ((row as any)[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (Strictly active on narrow screens < 768px as requested in §A.1 and §H) */}
      <div className="block md:hidden divide-y divide-solid" style={{ borderColor: "var(--kenar)" }}>
        {rows.map((row, idx) => {
          const key = rowKey(row);
          const isSelected = selectedKeys?.includes(key);

          return (
            <div
              key={key}
              onClick={() => onRowClick?.(row)}
              className={`p-4 transition-colors ${
                onRowClick ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : ""
              }`}
              style={{
                backgroundColor: isSelected ? "var(--durum-basarili-zemin)" : "transparent",
              }}
            >
              {onSelectChange && (
                <div className="flex items-center justify-between pb-2 mb-2 border-b" style={{ borderColor: "var(--kenar)" }}>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => handleSelectRow(key, e as unknown as React.MouseEvent)}
                      className="rounded"
                    />
                    <span>Kaydı Seç</span>
                  </label>
                  <span className="font-mono text-xs" style={{ color: "var(--yazi-soluk)" }}>
                    #{idx + 1}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                {visibleColumns.map(col => (
                  <div key={col.key} className="flex items-start justify-between gap-3 text-xs">
                    <span className="font-semibold text-xs flex-shrink-0" style={{ color: "var(--yazi-soluk)" }}>
                      {col.header}:
                    </span>
                    <div className="text-right flex-1 break-words font-medium" style={{ color: "var(--yazi)" }}>
                      {col.render ? col.render(row, idx) : ((row as any)[col.key] as React.ReactNode)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      {(onPageChange || onPageSizeChange) && (
        <div
          className="flex items-center justify-between px-4 py-3 text-xs gap-3 flex-wrap"
          style={{
            borderTop: "1px solid var(--kenar)",
            backgroundColor: "var(--zemin)",
          }}
        >
          {/* Page size selector */}
          {onPageSizeChange && (
            <div className="flex items-center gap-2">
              <span style={{ color: "var(--yazi-soluk)" }}>Sayfa boyutu:</span>
              <select
                value={pageSize}
                onChange={e => onPageSizeChange(Number(e.target.value) as 10 | 25 | 50)}
                className="cursor-pointer text-xs py-1 px-2 rounded border appearance-none focus-visible:outline-none"
                style={{
                  backgroundColor: "var(--kart)",
                  borderColor: "var(--kenar)",
                  color: "var(--yazi)",
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          )}

          {/* Page indicator & buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <span style={{ color: "var(--yazi-soluk)" }}>
              Sayfa <span className="font-semibold" style={{ color: "var(--yazi)" }}>{page}</span> / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange?.(page - 1)}
                className="cursor-pointer p-1.5 rounded border disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity focus-visible:outline-none"
                style={{
                  backgroundColor: "var(--kart)",
                  borderColor: "var(--kenar)",
                  color: "var(--yazi)",
                }}
                aria-label="Önceki Sayfa"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => onPageChange?.(page + 1)}
                className="cursor-pointer p-1.5 rounded border disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity focus-visible:outline-none"
                style={{
                  backgroundColor: "var(--kart)",
                  borderColor: "var(--kenar)",
                  color: "var(--yazi)",
                }}
                aria-label="Sonraki Sayfa"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
