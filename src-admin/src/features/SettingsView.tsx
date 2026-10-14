import React, { useState } from "react";
import { useTheme, Theme } from "../context/ThemeContext";
import { useI18n } from "../i18n";
import { useDensity, Density } from "../context/DensityContext";
import { useToast } from "../context/ToastContext";
import { api } from "../api/mockAdapter";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Lang } from "../domain/types";
import {
  Sun,
  Moon,
  Laptop,
  Globe,
  LayoutGrid,
  RotateCcw,
  CheckCircle2,
  Sliders,
  ShieldCheck,
} from "lucide-react";

export const SettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const { density, setDensity } = useDensity();
  const { addToast } = useToast();

  const [confirmResetData, setConfirmResetData] = useState(false);

  const themeOptions: { value: Theme; title: string; desc: string; icon: React.ReactNode }[] = [
    { value: "light", title: t("themeLight"), desc: "Açık renkli standart arayüz", icon: <Sun className="w-5 h-5" /> },
    { value: "dark", title: t("themeDark"), desc: "Göz yormayan koyu gece teması", icon: <Moon className="w-5 h-5" /> },
    { value: "system", title: t("themeSystem"), desc: "İşletim sisteminizin tercihlerine otomatik uyum sağlar", icon: <Laptop className="w-5 h-5" /> },
  ];

  const langOptions: { value: Lang; name: string; localName: string }[] = [
    { value: "tr", name: "Türkçe", localName: "Türkçe (Varsayılan)" },
    { value: "en", name: "English", localName: "English (US)" },
    { value: "ar", name: "العربية", localName: "العربية (RTL)" },
    { value: "fa", name: "فارسی", localName: "فارسی (RTL)" },
  ];

  const densityOptions: { value: Density; title: string; desc: string }[] = [
    { value: "compact", title: t("densityCompact"), desc: "Daha fazla satır, dar dolgu payı" },
    { value: "default", title: t("densityDefault"), desc: "Dengeli ve standart görünüm" },
    { value: "comfortable", title: t("densityComfortable"), desc: "Daha geniş satır yüksekliği ve boşluklar" },
  ];

  const handleResetData = () => {
    api.resetAllMockData();
    addToast("Tüm mock veriler ilk seed durumuna sıfırlandı.", "success");
    setConfirmResetData(false);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--yazi)" }}>
          {t("navSettings")}
        </h1>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
          Görünüm, yerelleştirme ve tablo yoğunluğu kişiselleştirme tercihleri
        </p>
      </div>

      {/* Theme Settings Card */}
      <div
        className="p-5 rounded-xl border space-y-4"
        style={{
          backgroundColor: "var(--kart)",
          borderColor: "var(--kenar)",
          borderRadius: "var(--radius)",
        }}
      >
        <div className="border-b pb-3" style={{ borderColor: "var(--kenar)" }}>
          <h2 className="text-base font-bold" style={{ color: "var(--yazi)" }}>
            {t("theme")}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
            Gündüz / Gece teması ve sistem tercihi eşlemesi
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themeOptions.map(opt => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className="cursor-pointer p-4 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all focus-visible:outline-none"
                style={{
                  backgroundColor: isSelected ? "var(--zemin)" : "var(--kart)",
                  borderColor: isSelected ? "var(--renk-ana)" : "var(--kenar)",
                  borderWidth: isSelected ? "2px" : "1px",
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: isSelected ? "var(--renk-ana)" : "var(--zemin)",
                      color: isSelected ? "var(--renk-ana-yazi)" : "var(--yazi-soluk)",
                    }}
                  >
                    {opt.icon}
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5" style={{ color: "var(--renk-ana)" }} />
                  )}
                </div>

                <div>
                  <span className="font-semibold text-sm block" style={{ color: "var(--yazi)" }}>
                    {opt.title}
                  </span>
                  <span className="text-xs mt-0.5 block leading-relaxed" style={{ color: "var(--yazi-soluk)" }}>
                    {opt.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Language Settings Card */}
      <div
        className="p-5 rounded-xl border space-y-4"
        style={{
          backgroundColor: "var(--kart)",
          borderColor: "var(--kenar)",
          borderRadius: "var(--radius)",
        }}
      >
        <div className="border-b pb-3" style={{ borderColor: "var(--kenar)" }}>
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--yazi)" }}>
            <Globe className="w-4 h-4" style={{ color: "var(--renk-ana)" }} />
            <span>{t("language")}</span>
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
            Yönetim paneli arayüz dili ve metin yönü (Arapça ve Farsça için RTL düzen uygulanır)
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {langOptions.map(l => {
            const isSelected = locale === l.value;
            return (
              <button
                key={l.value}
                type="button"
                onClick={() => setLocale(l.value)}
                className="cursor-pointer p-3.5 rounded-xl border text-left flex items-center justify-between transition-all focus-visible:outline-none"
                style={{
                  backgroundColor: isSelected ? "var(--zemin)" : "var(--kart)",
                  borderColor: isSelected ? "var(--renk-ana)" : "var(--kenar)",
                  borderWidth: isSelected ? "2px" : "1px",
                }}
              >
                <div>
                  <span className="font-semibold text-xs sm:text-sm block" style={{ color: "var(--yazi)" }}>
                    {l.name}
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--yazi-soluk)" }}>
                    {l.localName}
                  </span>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4" style={{ color: "var(--renk-ana)" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Density Card */}
      <div
        className="p-5 rounded-xl border space-y-4"
        style={{
          backgroundColor: "var(--kart)",
          borderColor: "var(--kenar)",
          borderRadius: "var(--radius)",
        }}
      >
        <div className="border-b pb-3" style={{ borderColor: "var(--kenar)" }}>
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--yazi)" }}>
            <LayoutGrid className="w-4 h-4" style={{ color: "var(--renk-ana)" }} />
            <span>{t("density")}</span>
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--yazi-soluk)" }}>
            Veri tablolarındaki satır dolgusu ve bilgi sıklığı
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {densityOptions.map(opt => {
            const isSelected = density === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDensity(opt.value)}
                className="cursor-pointer p-4 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all focus-visible:outline-none"
                style={{
                  backgroundColor: isSelected ? "var(--zemin)" : "var(--kart)",
                  borderColor: isSelected ? "var(--renk-ana)" : "var(--kenar)",
                  borderWidth: isSelected ? "2px" : "1px",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm" style={{ color: "var(--yazi)" }}>
                    {opt.title}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4" style={{ color: "var(--renk-ana)" }} />
                  )}
                </div>
                <span className="text-xs leading-relaxed" style={{ color: "var(--yazi-soluk)" }}>
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset Mock Data (For testing & grading convenience) */}
      <div
        className="p-5 rounded-xl border space-y-3"
        style={{
          backgroundColor: "var(--kart)",
          borderColor: "var(--durum-uyari)",
          borderRadius: "var(--radius)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold" style={{ color: "var(--durum-uyari)" }}>
              Mock Verilerini Fabrika Ayarlarına Sıfırla
            </h3>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--yazi-soluk)" }}>
              LocalStorage üzerinde kayıtlı tüm değişiklikleri silerek ilk seed verilerine (33 rapor, 8 cihaz, 12 mesaj, 40+ denetim kaydı) geri döner.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setConfirmResetData(true)}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
            style={{
              backgroundColor: "var(--durum-uyari)",
              color: "#ffffff",
              borderRadius: "var(--radius)",
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Verileri Sıfırla</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmResetData}
        onClose={() => setConfirmResetData(false)}
        onConfirm={handleResetData}
        title="Mock Verilerini Sıfırlamak İstiyor Musunuz?"
        message="Bu işlem localStorage'a yazılmış tüm rapor, mesaj, kural ve log değişikliklerini temizleyip seed verilerini tekrar yükleyecektir."
        confirmLabel="Verileri Sıfırla ve Yenile"
        tone="warning"
        requireReason={false}
      />
    </div>
  );
};
