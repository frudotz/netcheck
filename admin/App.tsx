import React from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { I18nProvider } from "./i18n";
import { DensityProvider } from "./context/DensityContext";
import { ToastProvider } from "./context/ToastContext";
import { AppShell } from "./components/AppShell";
import { BagliDegil } from "./components/BagliDegil";
import { AdminAuthProvider, AdminAuthBoundary, YetkiYok, useAdminAuth } from "./context/AdminAuthContext";
import { bagli } from "./api";
import { EKRAN_IZNI, YEREL_GORUNUMLER, type Gorunum } from "./yol";

// Feature Views
import { DashboardView } from "./features/DashboardView";
import { ReportsListView } from "./features/ReportsListView";
import { ReportDetailView } from "./features/ReportDetailView";
import { DevicesListView } from "./features/DevicesListView";
import { MessagesView } from "./features/MessagesView";
import { ScoreRulesView } from "./features/ScoreRulesView";
import { DiagnosticTargetsView } from "./features/DiagnosticTargetsView";
import { ContentPagesView } from "./features/ContentPagesView";
import { AdminUsersView } from "./features/AdminUsersView";
import { AuditLogView } from "./features/AuditLogView";
import { SettingsView } from "./features/SettingsView";

const EKRANLAR: Record<Gorunum, React.FC> = {
  ozet: DashboardView,
  raporlar: ReportsListView,
  rapor: ReportDetailView,
  cihazlar: DevicesListView,
  mesajlar: MessagesView,
  "skor-kurallari": ScoreRulesView,
  hedefler: DiagnosticTargetsView,
  icerik: ContentPagesView,
  yoneticiler: AdminUsersView,
  denetim: AuditLogView,
  ayarlar: SettingsView,
};

interface AppProps {
  gorunum: Gorunum;
}

/** Oturum izni olmayan ekran yerine açıklama (UX); arka uç aynı isteği zaten `forbidden` ile reddeder. */
const IzinliEkran: React.FC<{ gorunum: Gorunum }> = ({ gorunum }) => {
  const { can } = useAdminAuth();
  const Ekran = EKRANLAR[gorunum];
  return can(EKRAN_IZNI[gorunum]) ? <Ekran /> : <YetkiYok />;
};

export default function App({ gorunum }: AppProps) {
  const Ekran = EKRANLAR[gorunum];
  // Yerel ekranlar (Ayarlar) IPC ve oturum istemez. Veri ekranları yalnız Tauri içinde (bagli) ve
  // oturum açıkken çizilir; tarayıcı önizlemesinde durum açıklaması gösterilir.
  const yerel = YEREL_GORUNUMLER.includes(gorunum);

  return (
    <ThemeProvider>
      <I18nProvider>
        <DensityProvider>
          <ToastProvider>
            <AdminAuthProvider>
              <AppShell gorunum={gorunum}>
                {yerel ? (
                  <Ekran />
                ) : !bagli ? (
                  <BagliDegil gorunum={gorunum} />
                ) : (
                  <AdminAuthBoundary>
                    <IzinliEkran gorunum={gorunum} />
                  </AdminAuthBoundary>
                )}
              </AppShell>
            </AdminAuthProvider>
          </ToastProvider>
        </DensityProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
