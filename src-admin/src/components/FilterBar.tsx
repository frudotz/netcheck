import React from "react";
import { Search, X, Filter } from "lucide-react";
import { useI18n } from "../i18n";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "toggle" | "date-range" | "range";
  options?: FilterOption[];
  min?: number;
  max?: number;
}

export interface FilterBarProps {
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  filterValues: Record<string, string | number | boolean | undefined>;
  onFilterChange: (key: string, val: string | number | boolean | undefined) => void;
  onClear: () => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  searchPlaceholder,
  filters = [],
  filterValues,
  onFilterChange,
  onClear,
  className = "",
}) => {
  const { t } = useI18n();

  // Active filter chips
  const activeChips: { key: string; label: string; displayValue: string }[] = [];

  filters.forEach(f => {
    const val = filterValues[f.key];
    if (val !== undefined && val !== "" && val !== "all") {
      let display = String(val);
      if (f.options) {
        const match = f.options.find(o => o.value === String(val));
        if (match) display = match.label;
      }
      activeChips.push({
        key: f.key,
        label: f.label,
        displayValue: display,
      });
    }
  });

  const hasActiveFilters = activeChips.length > 0 || (search !== undefined && search !== "");

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Top search & dropdowns bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {onSearchChange !== undefined && (
          <div className="relative flex-1 min-w-[240px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "var(--yazi-soluk)" }}
              aria-hidden="true"
            />
            <input
              type="text"
              value={search ?? ""}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder ?? t("searchPlaceholder")}
              className="w-full text-xs sm:text-sm pl-9 pr-8 py-2 rounded-lg border transition-colors focus-visible:outline-none"
              style={{
                backgroundColor: "var(--kart)",
                borderColor: "var(--kenar)",
                color: "var(--yazi)",
                borderRadius: "var(--radius)",
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:opacity-75 focus-visible:outline-none"
                style={{ color: "var(--yazi-soluk)" }}
                aria-label="Aramayı temizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Dynamic Filters */}
        {filters.map(f => {
          if (f.type === "select" || f.type === "date-range") {
            return (
              <div key={f.key} className="min-w-[130px]">
                <label htmlFor={`filter-${f.key}`} className="sr-only">
                  {f.label}
                </label>
                <select
                  id={`filter-${f.key}`}
                  value={(filterValues[f.key] as string) ?? ""}
                  onChange={e => onFilterChange(f.key, e.target.value || undefined)}
                  className="cursor-pointer text-xs sm:text-sm py-2 px-3 rounded-lg border appearance-none transition-colors w-full focus-visible:outline-none"
                  style={{
                    backgroundColor: "var(--kart)",
                    borderColor: "var(--kenar)",
                    color: "var(--yazi)",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <option value="">{f.label}: Tümü</option>
                  {f.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }
          return null;
        })}

        {/* Clear all button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border hover:opacity-80 transition-colors focus-visible:outline-none ml-auto"
            style={{
              backgroundColor: "var(--zemin)",
              borderColor: "var(--kenar)",
              color: "var(--durum-hata)",
              borderRadius: "var(--radius)",
            }}
          >
            <X className="w-3.5 h-3.5" />
            <span>{t("clearFilters")}</span>
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--yazi-soluk)" }}>
            <Filter className="w-3 h-3" />
            <span>Aktif Filtreler:</span>
          </span>
          {activeChips.map(chip => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: "var(--zemin)",
                border: "1px solid var(--kenar)",
                color: "var(--yazi)",
              }}
            >
              <span style={{ color: "var(--yazi-soluk)" }}>{chip.label}:</span>
              <span className="font-semibold">{chip.displayValue}</span>
              <button
                type="button"
                onClick={() => onFilterChange(chip.key, undefined)}
                className="cursor-pointer ml-1 hover:opacity-75 focus-visible:outline-none"
                style={{ color: "var(--yazi-soluk)" }}
                aria-label={`${chip.label} filtresini kaldır`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
