import React from "react";
import { DiagnosticKind } from "../domain/types";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useI18n } from "../i18n";

export interface WeightsEditorProps {
  weights: Record<DiagnosticKind, number>;
  onChange: (weights: Record<DiagnosticKind, number>) => void;
  disabled?: boolean;
}

export const WeightsEditor: React.FC<WeightsEditorProps> = ({
  weights,
  onChange,
  disabled = false,
}) => {
  const { t } = useI18n();

  const testList: { id: DiagnosticKind; name: string; desc: string }[] = [
    { id: "internet", name: "İnternet (HTTPS)", desc: "Dış web sunucusuna TLS el sıkışma ve erişim testi" },
    { id: "dns", name: "DNS Çözümleme", desc: "Domain adını IP adresine dönüştürme performansı" },
    { id: "gateway", name: "Varsayılan Ağ Geçidi (Gateway)", desc: "Yerel yönlendiriciye (router/modem) doğrudan erişim" },
    { id: "cloudflare", name: "Cloudflare (1.1.1.1)", desc: "Anycast genel DNS sunucusuna gidiş-dönüş süresi" },
    { id: "google", name: "Google DNS (8.8.8.8)", desc: "Genel DNS ve rota stabilitesi testi" },
  ];

  const total = Object.values(weights).reduce((a, b) => a + (Number(b) || 0), 0);
  const isValid = total === 90;

  const handleChange = (id: DiagnosticKind, value: number) => {
    const clamped = Math.max(0, Math.min(90, value));
    onChange({
      ...weights,
      [id]: clamped,
    });
  };

  return (
    <div
      className="p-5 rounded-xl border space-y-5"
      style={{
        backgroundColor: "var(--kart)",
        borderColor: "var(--kenar)",
        borderRadius: "var(--radius)",
      }}
    >
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--kenar)" }}>
        <div>
          <h4 className="font-semibold text-sm sm:text-base" style={{ color: "var(--yazi)" }}>
            {t("rulesWeights")}
          </h4>
          <p className="text-xs mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
            5 temel testin toplam ağırlığı tam 90 puan olmalıdır (kalan 10 puan gecikme bonusudur).
          </p>
        </div>

        {/* Sum indicator badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs border"
          style={{
            backgroundColor: isValid ? "var(--durum-basarili-zemin)" : "var(--durum-hata-zemin)",
            borderColor: isValid ? "var(--durum-basarili)" : "var(--durum-hata)",
            color: isValid ? "var(--durum-basarili)" : "var(--durum-hata)",
          }}
        >
          {isValid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>Toplam: {total} / 90</span>
        </div>
      </div>

      {!isValid && (
        <div
          className="p-3 rounded-lg flex items-center gap-2 text-xs font-medium"
          style={{
            backgroundColor: "var(--durum-hata-zemin)",
            color: "var(--durum-hata)",
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            {t("rulesWeightsMustTotal90", { sum: total })}.{" "}
            {total < 90 ? `${90 - total} puan daha eklemelisiniz.` : `${total - 90} puan eksiltmelisiniz.`}
          </span>
        </div>
      )}

      {/* Sliders list */}
      <div className="space-y-4">
        {testList.map(item => {
          const val = weights[item.id] ?? 0;
          return (
            <div
              key={item.id}
              className="p-3 rounded-lg border flex flex-col gap-2.5 transition-colors"
              style={{
                backgroundColor: "var(--zemin)",
                borderColor: "var(--kenar)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs sm:text-sm" style={{ color: "var(--yazi)" }}>
                    {item.name}
                  </span>
                  <p className="text-xs hidden sm:block" style={{ color: "var(--yazi-soluk)" }}>
                    {item.desc}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={val}
                    disabled={disabled}
                    onChange={e => handleChange(item.id, Number(e.target.value))}
                    className="w-16 p-1 text-center font-mono font-bold text-sm rounded border bg-transparent focus-visible:outline-none"
                    style={{
                      borderColor: "var(--kenar)",
                      color: "var(--yazi)",
                    }}
                  />
                  <span className="text-xs font-semibold" style={{ color: "var(--yazi-soluk)" }}>
                    Puan
                  </span>
                </div>
              </div>

              {/* Slider track */}
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={90}
                  value={val}
                  disabled={disabled}
                  onChange={e => handleChange(item.id, Number(e.target.value))}
                  className="flex-1 cursor-pointer accent-cyan-600 dark:accent-cyan-400"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
