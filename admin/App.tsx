import React from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { I18nProvider } from "./i18n";
import { DensityProvider } from "./context/DensityContext";
import { ToastProvider } from "./context/ToastContext";
import { AppShell } from "./components/AppShell";
import { BagliDegil } from "./components/BagliDegil";
import { bagli } from "./api";
import { YEREL_GORUNUMLER, type Gorunum } from "./yol";

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

export default function App({ gorunum }: AppProps) {
  const Ekran = EKRANLAR[gorunum];
  // Bağlı olmayan panelde veri ekranlarının denetimleri çalışmaz; onların yerine durum açıklaması gösterilir.
  const calisir = bagli || YEREL_GORUNUMLER.includes(gorunum);

  return (
    <ThemeProvider>
      <I18nProvider>
        <DensityProvider>
          <ToastProvider>
            <AppShell gorunum={gorunum}>
              {calisir ? <Ekran /> : <BagliDegil gorunum={gorunum} />}
            </AppShell>
          </ToastProvider>
        </DensityProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
