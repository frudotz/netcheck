import React from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { useI18n } from "../i18n";

export interface LatencyBand {
  maxMs: number | null;
  bonus: number;
}

export interface LatencyBandsEditorProps {
  bands: LatencyBand[];
  onChange: (bands: LatencyBand[]) => void;
  disabled?: boolean;
}

export const LatencyBandsEditor: React.FC<LatencyBandsEditorProps> = ({
  bands,
  onChange,
  disabled = false,
}) => {
  const { t } = useI18n();

  // Validate ascending order
  let isOrderValid = true;
  for (let i = 0; i < bands.length - 1; i++) {
    const curr = bands[i].maxMs;
    const next = bands[i + 1].maxMs;
    if (curr === null) {
      isOrderValid = false;
      break;
    }
    if (next !== null && curr >= next) {
      isOrderValid = false;
      break;
    }
  }
  // Last row must be null
  if (bands.length > 0 && bands[bands.length - 1].maxMs !== null) {
    isOrderValid = false;
  }

  const handleMaxMsChange = (idx: number, val: string) => {
    const updated = [...bands];
    updated[idx] = {
      ...updated[idx],
      maxMs: val === "" ? null : Math.max(1, Number(val)),
    };
    onChange(updated);
  };

  const handleBonusChange = (idx: number, val: number) => {
    const updated = [...bands];
    updated[idx] = {
      ...updated[idx],
      bonus: Math.max(0, Math.min(10, val)),
    };
    onChange(updated);
  };

  const handleAddBand = () => {
    if (bands.length === 0) {
      onChange([{ maxMs: null, bonus: 1 }]);
      return;
    }
    const updated = [...bands];
    // Insert new band before the last null band
    const lastBand = updated[updated.length - 1];
    const prevMax = updated.length > 1 ? updated[updated.length - 2].maxMs ?? 100 : 50;
    const newMax = prevMax + 50;

    updated.splice(updated.length - 1, 0, {
      maxMs: newMax,
      bonus: Math.max(1, lastBand.bonus + 2),
    });
    onChange(updated);
  };

  const handleRemoveBand = (idx: number) => {
    if (bands.length <= 1) return; // Keep at least one fallback band
    const updated = bands.filter((_, i) => i !== idx);
    // Ensure last band is null
    if (updated[updated.length - 1].maxMs !== null) {
      updated[updated.length - 1].maxMs = null;
    }
    onChange(updated);
  };

  return (
    <div
      className="p-5 rounded-xl border space-y-4"
      style={{
        backgroundColor: "var(--kart)",
        borderColor: "var(--kenar)",
        borderRadius: "var(--radius)",
      }}
    >
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--kenar)" }}>
        <div>
          <h4 className="font-semibold text-sm sm:text-base" style={{ color: "var(--yazi)" }}>
            {t("rulesLatencyBands")}
          </h4>
          <p className="text-xs mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
            Ortalama Cloudflare ve Google DNS gecikmesine göre eklenecek bonus puanlar.
          </p>
        </div>

        {!disabled && (
          <button
            type="button"
            onClick={handleAddBand}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg hover:opacity-80 transition-opacity"
            style={{
              backgroundColor: "var(--renk-ana)",
              color: "var(--renk-ana-yazi)",
              borderRadius: "var(--radius)",
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kademe Ekle</span>
          </button>
        )}
      </div>

      {!isOrderValid && (
        <div
          className="p-3 rounded-lg flex items-center gap-2 text-xs font-medium"
          style={{
            backgroundColor: "var(--durum-uyari-zemin)",
            color: "var(--durum-uyari)",
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Gecikme üst sınırları kesinlikle artan sırada olmalı ve en son kademe sınırsız (null) kalmalıdır.</span>
        </div>
      )}

      <div className="space-y-2">
        {bands.map((band, idx) => {
          const isLast = idx === bands.length - 1;
          return (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-lg border text-xs sm:text-sm"
              style={{
                backgroundColor: "var(--zemin)",
                borderColor: "var(--kenar)",
              }}
            >
              <span className="w-6 font-mono font-bold text-center" style={{ color: "var(--yazi-soluk)" }}>
                #{idx + 1}
              </span>

              <div className="flex items-center gap-2 flex-1">
                <span style={{ color: "var(--yazi-soluk)" }}>Ortalama &lt;</span>
                {isLast ? (
                  <span
                    className="font-mono font-semibold px-2 py-1 rounded border text-xs"
                    style={{
                      backgroundColor: "var(--kart)",
                      borderColor: "var(--kenar)",
                      color: "var(--yazi)",
                    }}
                  >
                    Üst Sınırsız (Kalan)
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      disabled={disabled}
                      value={band.maxMs ?? ""}
                      onChange={e => handleMaxMsChange(idx, e.target.value)}
                      className="w-20 p-1.5 text-center font-mono rounded border bg-transparent focus-visible:outline-none text-xs sm:text-sm font-semibold"
                      style={{
                        borderColor: "var(--kenar)",
                        color: "var(--yazi)",
                      }}
                    />
                    <span className="font-mono text-xs" style={{ color: "var(--yazi-soluk)" }}>
                      ms
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span style={{ color: "var(--yazi-soluk)" }}>Bonus:</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  disabled={disabled}
                  value={band.bonus}
                  onChange={e => handleBonusChange(idx, Number(e.target.value))}
                  className="w-16 p-1.5 text-center font-mono font-bold rounded border bg-transparent focus-visible:outline-none text-xs sm:text-sm"
                  style={{
                    borderColor: "var(--kenar)",
                    color: "var(--yazi)",
                  }}
                />
                <span className="font-semibold text-xs" style={{ color: "var(--yazi-soluk)" }}>
                  Puan
                </span>
              </div>

              {!disabled && bands.length > 1 && !isLast && (
                <button
                  type="button"
                  onClick={() => handleRemoveBand(idx)}
                  className="cursor-pointer p-1.5 rounded hover:opacity-75 focus-visible:outline-none ml-2"
                  style={{ color: "var(--durum-hata)" }}
                  title="Kademeyi Sil"
                  aria-label="Kademeyi Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
