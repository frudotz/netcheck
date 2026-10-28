import React, { useState } from "react";
import { Table, BarChart2 } from "lucide-react";
import { useI18n } from "../i18n";

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  secondaryLabel?: string;
}

export interface ChartProps {
  type: "donut" | "bar" | "line" | "histogram";
  title?: string;
  data: ChartDataPoint[];
  height?: number;
  showTableToggle?: boolean;
  valueFormatter?: (val: number) => string;
}

export const Chart: React.FC<ChartProps> = ({
  type,
  title,
  data,
  height = 220,
  showTableToggle = true,
  valueFormatter = val => String(val),
}) => {
  const [showTable, setShowTable] = useState(false);
  const { t } = useI18n();

  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const maxValue = Math.max(...data.map(d => d.value), 1);

  // Table view alternative for accessibility
  if (showTable) {
    return (
      <div
        className="p-4 rounded-xl flex flex-col gap-3"
        style={{
          backgroundColor: "var(--kart)",
          border: "1px solid var(--kenar)",
          borderRadius: "var(--radius)",
        }}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold" style={{ color: "var(--yazi)" }}>
            {title}
          </h4>
          <button
            type="button"
            onClick={() => setShowTable(false)}
            className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded border hover:opacity-80"
            style={{
              backgroundColor: "var(--zemin)",
              borderColor: "var(--kenar)",
              color: "var(--yazi)",
            }}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{t("chartGraphView")}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <caption className="sr-only">{title ?? t("chartDataTable")}</caption>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--kenar)" }}>
                <th scope="col" className="py-2 px-3 font-semibold" style={{ color: "var(--yazi-soluk)" }}>
                  {t("chartCategory")}
                </th>
                <th scope="col" className="py-2 px-3 font-semibold text-right" style={{ color: "var(--yazi-soluk)" }}>
                  {t("chartValue")}
                </th>
                <th scope="col" className="py-2 px-3 font-semibold text-right" style={{ color: "var(--yazi-soluk)" }}>
                  {t("chartPercent")}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--kenar)" }}>
                  <td className="py-2 px-3 font-medium" style={{ color: "var(--yazi)" }}>
                    {item.label}
                  </td>
                  <td className="py-2 px-3 text-right font-mono" style={{ color: "var(--yazi)" }}>
                    {valueFormatter(item.value)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono" style={{ color: "var(--yazi-soluk)" }}>
                    {t("chartPercentValue", { value: ((item.value / total) * 100).toFixed(1) })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Render SVG Charts
  return (
    <div
      className="p-4 sm:p-5 rounded-xl flex flex-col justify-between"
      style={{
        backgroundColor: "var(--kart)",
        border: "1px solid var(--kenar)",
        borderRadius: "var(--radius)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {title && (
          <h4 className="text-sm font-semibold" style={{ color: "var(--yazi)" }}>
            {title}
          </h4>
        )}
        {showTableToggle && (
          <button
            type="button"
            onClick={() => setShowTable(true)}
            className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded border hover:opacity-80 transition-colors"
            style={{
              backgroundColor: "var(--zemin)",
              borderColor: "var(--kenar)",
              color: "var(--yazi-soluk)",
            }}
            title={t("viewTableData")}
          >
            <Table className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("viewTableData")}</span>
          </button>
        )}
      </div>

      {/* SVG Container */}
      <div className="w-full flex items-center justify-center" style={{ minHeight: height }}>
        {type === "donut" && (
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 w-full">
            <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90 transform">
              {(() => {
                let accumulatedPercent = 0;
                return data.map((item, index) => {
                  const percent = item.value / total;
                  const strokeDasharray = `${percent * 282.7} ${282.7}`;
                  const strokeDashoffset = -accumulatedPercent * 282.7;
                  accumulatedPercent += percent;

                  const color =
                    item.color ??
                    (index === 0
                      ? "var(--durum-basarili)"
                      : index === 1
                      ? "var(--durum-uyari)"
                      : "var(--durum-hata)");

                  return (
                    <circle
                      key={index}
                      cx="50"
                      cy="50"
                      r="45"
                      fill="transparent"
                      stroke={color}
                      strokeWidth="10"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    >
                      <title>{`${item.label}: ${valueFormatter(item.value)} (${t("chartPercentValue", { value: (percent * 100).toFixed(0) })})`}</title>
                    </circle>
                  );
                });
              })()}
            </svg>

            {/* Legend */}
            <div className="flex flex-col gap-2 text-xs">
              {data.map((item, idx) => {
                const color =
                  item.color ??
                  (idx === 0
                    ? "var(--durum-basarili)"
                    : idx === 1
                    ? "var(--durum-uyari)"
                    : "var(--durum-hata)");
                const pct = ((item.value / total) * 100).toFixed(1);
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-medium" style={{ color: "var(--yazi)" }}>
                      {item.label}
                    </span>
                    <span className="font-mono text-xs ml-auto" style={{ color: "var(--yazi-soluk)" }}>
                      {valueFormatter(item.value)} ({t("chartPercentValue", { value: pct })})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {type === "bar" && (
          <div className="w-full flex flex-col gap-3">
            {data.map((item, idx) => {
              const pct = (item.value / maxValue) * 100;
              const barColor = item.color ?? "var(--renk-ana)";
              return (
                <div key={idx} className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-medium" style={{ color: "var(--yazi)" }}>
                      {item.label}
                    </span>
                    <span className="font-mono" style={{ color: "var(--yazi-soluk)" }}>
                      {valueFormatter(item.value)}
                    </span>
                  </div>
                  <div
                    className="w-full h-3 rounded-full overflow-hidden"
                    style={{ backgroundColor: "var(--zemin)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {type === "line" && (
          <div className="w-full h-full flex flex-col">
            <svg
              viewBox="0 0 320 120"
              className="w-full h-36 overflow-visible"
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              <line x1="0" y1="20" x2="320" y2="20" stroke="var(--kenar)" strokeDasharray="3 3" />
              <line x1="0" y1="60" x2="320" y2="60" stroke="var(--kenar)" strokeDasharray="3 3" />
              <line x1="0" y1="100" x2="320" y2="100" stroke="var(--kenar)" strokeDasharray="3 3" />

              {/* Area gradient */}
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--renk-ana)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--renk-ana)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Polyline and Area */}
              {(() => {
                if (data.length === 0) return null;
                const points = data.map((d, i) => {
                  const x = (i / (data.length - 1 || 1)) * 320;
                  const y = 110 - (d.value / maxValue) * 90;
                  return { x, y };
                });
                const pointsStr = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
                const areaStr = `0,120 ${pointsStr} 320,120`;

                return (
                  <>
                    <polygon fill="url(#lineGrad)" points={areaStr} />
                    <polyline
                      fill="none"
                      stroke="var(--renk-ana)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={pointsStr}
                    />
                    {points.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        fill="var(--kart)"
                        stroke="var(--renk-ana)"
                        strokeWidth="2"
                      >
                        <title>{`${data[idx].label}: ${data[idx].value}`}</title>
                      </circle>
                    ))}
                  </>
                );
              })()}
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between text-[11px] mt-2 font-mono" style={{ color: "var(--yazi-soluk)" }}>
              {data.map((d, i) => (
                <span key={i}>{d.label}</span>
              ))}
            </div>
          </div>
        )}

        {type === "histogram" && (
          <div className="w-full flex items-end justify-between gap-2 h-36 pt-4">
            {data.map((item, idx) => {
              const heightPct = (item.value / maxValue) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[10px] font-mono" style={{ color: "var(--yazi-soluk)" }}>
                    {item.value}
                  </span>
                  <div
                    className="w-full rounded-t-sm transition-all"
                    style={{
                      height: `${Math.max(4, heightPct)}%`,
                      backgroundColor: item.color ?? "var(--renk-ana)",
                    }}
                  />
                  <span className="text-[10px] truncate max-w-[40px] text-center" style={{ color: "var(--yazi)" }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
