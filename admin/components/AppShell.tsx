import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Smartphone,
  MessageSquare,
  Sliders,
  Target,
  FileCode,
  Users,
  ShieldAlert,
  Settings,
  Menu,
  X,
  Search,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { LangSwitch } from "./LangSwitch";
import { EKRAN_BASLIGI } from "./BagliDegil";
import { useI18n } from "../i18n";
import { bagli } from "../api";
import { adres, git, type Gorunum } from "../yol";

interface NavItem {
  gorunum: Gorunum;
  icon: React.ReactNode;
}

export interface AppShellProps {
  gorunum: Gorunum;
  children: React.ReactNode;
}

const NAV: NavItem[] = [
  { gorunum: "ozet", icon: <LayoutDashboard className="w-4 h-4" /> },
  { gorunum: "raporlar", icon: <FileText className="w-4 h-4" /> },
  { gorunum: "cihazlar", icon: <Smartphone className="w-4 h-4" /> },
  { gorunum: "mesajlar", icon: <MessageSquare className="w-4 h-4" /> },
  { gorunum: "skor-kurallari", icon: <Sliders className="w-4 h-4" /> },
  { gorunum: "hedefler", icon: <Target className="w-4 h-4" /> },
  { gorunum: "icerik", icon: <FileCode className="w-4 h-4" /> },
  { gorunum: "yoneticiler", icon: <Users className="w-4 h-4" /> },
  { gorunum: "denetim", icon: <ShieldAlert className="w-4 h-4" /> },
  { gorunum: "ayarlar", icon: <Settings className="w-4 h-4" /> },
];

export const AppShell: React.FC<AppShellProps> = ({ gorunum, children }) => {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  // Telefon menüsü açıkken Esc kapatır.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const kapat = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", kapat);
    return () => window.removeEventListener("keydown", kapat);
  }, [mobileMenuOpen]);

  // Rapor detayı menüde Raporlar altında sayılır.
  const etkin = gorunum === "rapor" ? "raporlar" : gorunum;

  const handleGlobalSearchSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const term = globalSearch.trim();
    if (!term) return;
    if (term.toUpperCase().startsWith("NCHK-")) {
      git(adres("rapor", { id: term.toUpperCase() }));
    } else {
      git(adres("raporlar", { q: term }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zemin">
      <a href="#main-content" className="skip-to-content">
        {t("skipToContent")}
      </a>

      {/* Üst bar: uygulamadaki gibi --renk-koyu zemin, üzerinde --renk-koyu-yazi (docs/branding.md). */}
      <header className="w-full h-16 flex items-center justify-between gap-3 px-4 sm:px-6 z-40 sticky top-0 shadow-md bg-koyu text-koyu-yazi">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="cursor-pointer md:hidden p-1.5 rounded-lg text-koyu-yazi hover:bg-koyu-yazi/10"
            aria-label={t("shellMenuToggle")}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <a
            href={adres("ozet")}
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-koyu-yazi min-w-0"
            aria-label={`NetCheck ${t("adminPanel")}`}
          >
            {/* NetCheck işareti: üç sinyal yayı ve onay işareti (docs/branding.md §3). */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="flex-shrink-0"
            >
              <path d="M5 12.55a11 11 0 0 1 14.08 0" stroke="var(--renk-vurgu)" opacity="0.6" />
              <path d="M1.42 9a16 16 0 0 1 21.16 0" stroke="var(--renk-vurgu)" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" stroke="var(--renk-vurgu)" opacity="0.8" />
              <polyline points="9 19 11 21 15 17" stroke="var(--renk-koyu-yazi)" strokeWidth="2.5" />
            </svg>
            <span className="flex items-center font-extrabold tracking-wide text-lg" dir="ltr">
              <span>net</span>
              <span className="text-vurgu">check</span>
            </span>
            <span
              className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] tracking-wider uppercase font-semibold border text-vurgu"
              style={{
                backgroundColor: "color-mix(in srgb, var(--renk-vurgu) 15%, transparent)",
                borderColor: "color-mix(in srgb, var(--renk-vurgu) 40%, transparent)",
              }}
            >
              {t("shellBrandBadge")}
            </span>
          </a>
        </div>

        {/* Hızlı arama yalnız veri kaynağı bağlıyken gösterilir; bağlı değilken sonuç veremez. */}
        {bagli && (
          <form
            onSubmit={handleGlobalSearchSubmit}
            className="hidden md:flex items-center relative max-w-xs lg:max-w-md w-full mx-6"
            role="search"
          >
            <Search
              className="absolute start-3 w-4 h-4 pointer-events-none text-koyu-yazi/60"
              aria-hidden="true"
            />
            <input
              type="search"
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="w-full text-xs sm:text-sm ps-9 pe-4 py-1.5 rounded-lg bg-koyu-yazi/10 border border-koyu-yazi/20 text-koyu-yazi placeholder:text-koyu-yazi/60 focus:border-vurgu transition-colors"
            />
          </form>
        )}

        {/* Dar ekranda tema seçimi yalnız Ayarlar'da; logo ve dil seçimi sığsın. */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <LangSwitch />
        </div>
      </header>

      <div className="flex-1 flex">
        <aside
          className={`hidden md:flex md:sticky md:top-16 md:self-start md:h-[calc(100dvh-4rem)] flex-col border-e transition-all duration-200 z-20 bg-kart border-kenar ${
            sidebarCollapsed ? "w-16" : "w-64"
          }`}
          aria-label={t("shellMainMenu")}
        >
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV.map(item => {
              const isActive = item.gorunum === etkin;
              const label = t(EKRAN_BASLIGI[item.gorunum]);
              return (
                <a
                  key={item.gorunum}
                  href={adres(item.gorunum)}
                  title={sidebarCollapsed ? label : undefined}
                  aria-label={sidebarCollapsed ? label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isActive ? "font-semibold shadow-xs bg-ana text-ana-yazi" : "text-yazi hover:bg-yazi/5"
                  }`}
                >
                  <span className="flex-shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span className="truncate">{label}</span>}
                </a>
              );
            })}
          </nav>

          <div className="p-3 border-t border-kenar flex items-center justify-between gap-2">
            <a
              href="/"
              title={sidebarCollapsed ? t("shellBackToApp") : undefined}
              aria-label={sidebarCollapsed ? t("shellBackToApp") : undefined}
              className="inline-flex items-center gap-2 p-1.5 rounded text-xs text-yazi-soluk hover:bg-yazi/5"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
              {!sidebarCollapsed && <span>{t("shellBackToApp")}</span>}
            </a>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="cursor-pointer p-1.5 rounded hover:bg-yazi/5 text-xs text-yazi-soluk"
              title={sidebarCollapsed ? t("shellExpandMenu") : t("shellCollapseMenu")}
              aria-label={sidebarCollapsed ? t("shellExpandMenu") : t("shellCollapseMenu")}
              aria-expanded={!sidebarCollapsed}
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform rtl:-scale-x-100 ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </button>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 md:hidden bg-koyu/60 backdrop-blur-xs flex"
            onClick={() => setMobileMenuOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={t("shellMainMenu")}
          >
            <div
              className="w-72 max-w-[85vw] h-full flex flex-col p-4 shadow-2xl bg-kart text-yazi"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-kenar mb-3">
                <span className="font-bold text-sm text-yazi">{t("adminPanel")}</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded hover:opacity-75 text-yazi-soluk"
                  aria-label={t("close")}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto" aria-label={t("shellMainMenu")}>
                {NAV.map(item => {
                  const isActive = item.gorunum === etkin;
                  return (
                    <a
                      key={item.gorunum}
                      href={adres(item.gorunum)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? "bg-ana text-ana-yazi" : "text-yazi hover:bg-yazi/5"
                      }`}
                    >
                      <span aria-hidden="true">{item.icon}</span>
                      <span>{t(EKRAN_BASLIGI[item.gorunum])}</span>
                    </a>
                  );
                })}
              </nav>

              <a
                href="/"
                className="mt-3 pt-3 border-t border-kenar inline-flex items-center gap-2 text-sm text-yazi-soluk"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
                <span>{t("shellBackToApp")}</span>
              </a>
            </div>
          </div>
        )}

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto"
        >
          {children}
        </main>
      </div>
    </div>
  );
};
