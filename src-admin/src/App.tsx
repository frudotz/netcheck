import React from "react";
import { BrowserRouter, Navigate, Routes, Route, useSearchParams } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { I18nProvider } from "./i18n";
import { DensityProvider } from "./context/DensityContext";
import { ToastProvider } from "./context/ToastContext";
import { AppShell } from "./components/AppShell";
import { AdminAuthBoundary, AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";

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

interface AppProps {
  basename?: string;
}

const ReportsRoute: React.FC = () => {
  const [searchParams] = useSearchParams();
  return searchParams.has("id") ? <ReportDetailView /> : <ReportsListView />;
};

const HomeRoute: React.FC = () => {
  const { session } = useAdminAuth();
  if (
    session &&
    !session.superAdmin &&
    !session.permissions.includes("ViewAny:Report") &&
    session.permissions.includes("ViewAny:ContentPage")
  ) {
    return <Navigate to="/icerik" replace />;
  }
  return <DashboardView />;
};

export default function App({ basename = "/" }: AppProps) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <DensityProvider>
          <ToastProvider>
            <BrowserRouter basename={basename}>
              <AdminAuthProvider>
                <AdminAuthBoundary>
                  <AppShell>
                    <Routes>
                      <Route path="/" element={<HomeRoute />} />
                      <Route path="/raporlar" element={<ReportsRoute />} />
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
                </AdminAuthBoundary>
              </AdminAuthProvider>
            </BrowserRouter>
          </ToastProvider>
        </DensityProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
