import React from "react";
import { Unplug, Settings, ArrowLeft } from "lucide-react";
import { useI18n } from "../i18n";
import type { Translations } from "../i18n/tr";
import { adres, type Gorunum } from "../yol";

// Panel bir veri kaynağına bağlı değilken veri ekranlarının yerine gösterilir: ekranın ne işe
// yarayacağını ve neden boş olduğunu söyler. Çalışmayan liste, form ya da düğme gösterilmez.

export const EKRAN_BASLIGI: Record<Gorunum, keyof Translations> = {
  ozet: "navDashboard",
  raporlar: "navReports",
  rapor: "shellReportDetail",
  cihazlar: "navDevices",
  mesajlar: "navMessages",
  "skor-kurallari": "navRules",
  hedefler: "navTargets",
  icerik: "navContent",
  yoneticiler: "navAdmins",
  denetim: "navAudit",
  ayarlar: "navSettings",
};

const EKRAN_ACIKLAMASI: Record<Exclude<Gorunum, "ayarlar">, keyof Translations> = {
  ozet: "shellDescDashboard",
  raporlar: "shellDescReports",
  rapor: "shellDescReportDetail",
  cihazlar: "shellDescDevices",
  mesajlar: "shellDescMessages",
  "skor-kurallari": "shellDescRules",
  hedefler: "shellDescTargets",
  icerik: "shellDescContent",
  yoneticiler: "shellDescAdmins",
  denetim: "shellDescAudit",
};

export const BagliDegil: React.FC<{ gorunum: Gorunum }> = ({ gorunum }) => {
  const { t } = useI18n();
  const aciklama = gorunum === "ayarlar" ? null : EKRAN_ACIKLAMASI[gorunum];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-yazi">{t(EKRAN_BASLIGI[gorunum])}</h1>
        {aciklama && <p className="text-xs sm:text-sm mt-1 text-yazi-soluk">{t(aciklama)}</p>}
      </div>

      <section
        aria-labelledby="bagli-degil-baslik"
        className="p-5 sm:p-6 border space-y-3 bg-kart border-kenar"
        style={{ borderRadius: "var(--radius)" }}
      >
        <div className="flex items-start gap-3">
          <span
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-bilgi-zemin text-bilgi"
            aria-hidden="true"
          >
            <Unplug className="w-5 h-5" />
          </span>
          <div className="space-y-2">
            <h2 id="bagli-degil-baslik" className="text-base font-semibold text-yazi">
              {t("shellNotConnectedTitle")}
            </h2>
            <p className="text-sm leading-relaxed text-yazi-soluk">{t("shellNotConnectedBody")}</p>
            <p className="text-sm leading-relaxed text-yazi-soluk">{t("shellNotConnectedNext")}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <a
            href={adres("ayarlar")}
            className="inline-flex items-center gap-2 min-h-11 px-4 text-sm font-semibold bg-ana text-ana-yazi hover:opacity-90"
            style={{ borderRadius: "var(--radius)" }}
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
            <span>{t("shellOpenSettings")}</span>
          </a>
          <a
            href="/"
            className="inline-flex items-center gap-2 min-h-11 px-4 text-sm font-semibold border border-kenar text-yazi hover:bg-yazi/5"
            style={{ borderRadius: "var(--radius)" }}
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
            <span>{t("shellBackToApp")}</span>
          </a>
        </div>
      </section>
    </div>
  );
};
