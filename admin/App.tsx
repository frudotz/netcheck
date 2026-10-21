import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { I18nProvider } from "./i18n";
import { DensityProvider } from "./context/DensityContext";
import { ToastProvider } from "./context/ToastContext";
import { AppShell } from "./components/AppShell";

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
import { NotFoundView } from "./features/NotFoundView";

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <DensityProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppShell>
                <Routes>
                  <Route path="/" element={<DashboardView />} />
                  <Route path="/raporlar" element={<ReportsListView />} />
                  <Route path="/raporlar/:id" element={<ReportDetailView />} />
                  <Route path="/cihazlar" element={<DevicesListView />} />
                  <Route path="/mesajlar" element={<MessagesView />} />
                  <Route path="/skor-kurallari" element={<ScoreRulesView />} />
                  <Route path="/hedefler" element={<DiagnosticTargetsView />} />
                  <Route path="/icerik" element={<ContentPagesView />} />
                  <Route path="/yoneticiler" element={<AdminUsersView />} />
                  <Route path="/denetim" element={<AuditLogView />} />
                  <Route path="/ayarlar" element={<SettingsView />} />
                  <Route path="*" element={<NotFoundView />} />
                </Routes>
              </AppShell>
            </BrowserRouter>
          </ToastProvider>
        </DensityProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
