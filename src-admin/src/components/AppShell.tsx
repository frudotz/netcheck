import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  ShieldCheck,
  User,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { LangSwitch } from "./LangSwitch";
import { useI18n } from "../i18n";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { t, isRtl } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  const navItems: NavItem[] = [
    { to: "/", label: t("navDashboard"), icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: "/raporlar", label: t("navReports"), icon: <FileText className="w-4 h-4" /> },
    { to: "/cihazlar", label: t("navDevices"), icon: <Smartphone className="w-4 h-4" /> },
    { to: "/mesajlar", label: t("navMessages"), icon: <MessageSquare className="w-4 h-4" /> },
    { to: "/skor-kurallari", label: t("navRules"), icon: <Sliders className="w-4 h-4" /> },
    { to: "/hedefler", label: t("navTargets"), icon: <Target className="w-4 h-4" /> },
    { to: "/icerik", label: t("navContent"), icon: <FileCode className="w-4 h-4" /> },
    { to: "/yoneticiler", label: t("navAdmins"), icon: <Users className="w-4 h-4" /> },
    { to: "/denetim", label: t("navAudit"), icon: <ShieldAlert className="w-4 h-4" /> },
    { to: "/ayarlar", label: t("navSettings"), icon: <Settings className="w-4 h-4" /> },
  ];

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    const term = globalSearch.trim();
    if (term.toUpperCase().startsWith("NCHK-")) {
      navigate(`/raporlar/${term.toUpperCase()}`);
    } else {
      navigate(`/raporlar?q=${encodeURIComponent(term)}`);
    }
    setGlobalSearch("");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--zemin)" }}>
      {/* Skip link for WCAG AA compliance */}
      <a href="#main-content" className="skip-to-content">
        {t("skipToContent")}
      </a>

      {/* Top Bar: Always --renk-koyu background with white text as specified in §C */}
      <header
        className="w-full h-16 flex items-center justify-between px-4 sm:px-6 z-40 sticky top-0 shadow-md"
        style={{
          backgroundColor: "var(--renk-koyu)",
          color: "#ffffff",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="cursor-pointer md:hidden p-1.5 rounded-lg text-white hover:bg-white/10 focus-visible:outline-none"
            aria-label="Menüyü Aç/Kapat"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight focus-visible:outline-none"
            style={{ color: "#ffffff", textDecoration: "none" }}
          >
            {/* NetCheck 3-tier signal arcs + checkmark brand icon */}
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
            >
              {/* Outer arc */}
              <path d="M5 12.55a11 11 0 0 1 14.08 0" stroke="var(--renk-vurgu)" opacity="0.6" />
              {/* Middle arc */}
              <path d="M1.42 9a16 16 0 0 1 21.16 0" stroke="var(--renk-vurgu)" />
              {/* Inner arc */}
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" stroke="var(--renk-vurgu)" opacity="0.8" />
              {/* Center checkmark */}
              <polyline points="9 19 11 21 15 17" stroke="#ffffff" strokeWidth="2.5" />
            </svg>
            <span className="flex items-center font-extrabold tracking-wide text-lg">
              <span>net</span>
              <span style={{ color: "var(--renk-vurgu)" }}>check</span>
              <span
                className="ml-2 px-1.5 py-0.5 rounded text-[10px] tracking-wider uppercase font-semibold border"
                style={{
                  backgroundColor: "rgba(34, 211, 238, 0.15)",
                  borderColor: "rgba(34, 211, 238, 0.4)",
                  color: "var(--renk-vurgu)",
                }}
              >
                YÖNETİM
              </span>
            </span>
          </Link>
        </div>

        {/* Global Quick Search */}
        <form
          onSubmit={handleGlobalSearchSubmit}
          className="hidden md:flex items-center relative max-w-xs lg:max-w-md w-full mx-6"
        >
          <Search
            className="absolute left-3 w-4 h-4 pointer-events-none text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-400 focus-visible:outline-none focus:border-cyan-400 transition-colors"
          />
        </form>

        {/* Header Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <LangSwitch />

          {/* Current Admin User Badge */}
          <div
            className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-700 text-xs"
            title="Aktif Yönetici: Emre Yılmaz (Owner)"
          >
            <div className="w-7 h-7 rounded-full bg-cyan-600/30 border border-cyan-400 flex items-center justify-center font-bold text-cyan-300">
              EY
            </div>
            <div className="flex flex-col text-left">
              <span className="font-semibold leading-tight text-white">Emre Yılmaz</span>
              <span className="text-[10px] text-cyan-300 leading-tight">Sistem Sahibi</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden md:flex flex-col border-r transition-all duration-200 z-20 ${
            sidebarCollapsed ? "w-16" : "w-64"
          }`}
          style={{
            backgroundColor: "var(--kart)",
            borderColor: "var(--kenar)",
          }}
          aria-label="Ana Menü"
        >
          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map(item => {
              const isActive =
                item.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none ${
                    isActive ? "font-semibold shadow-xs" : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                  style={{
                    backgroundColor: isActive ? "var(--renk-ana)" : "transparent",
                    color: isActive ? "var(--renk-ana-yazi)" : "var(--yazi)",
                    textDecoration: "none",
                  }}
                >
                  <span className="flex-shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  {!sidebarCollapsed && item.badge !== undefined && (
                    <span
                      className="ml-auto px-1.5 py-0.5 text-[10px] rounded-full font-mono"
                      style={{
                        backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "var(--zemin)",
                        color: isActive ? "#ffffff" : "var(--yazi-soluk)",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Collapse Toggle */}
          <div
            className="p-3 border-t flex justify-end"
            style={{ borderColor: "var(--kenar)" }}
          >
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="cursor-pointer p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-none text-xs"
              style={{ color: "var(--yazi-soluk)" }}
              title={sidebarCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
              aria-label={sidebarCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-xs flex"
            onClick={() => setMobileMenuOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="w-72 h-full flex flex-col p-4 shadow-2xl focus:outline-none"
              style={{
                backgroundColor: "var(--kart)",
                color: "var(--yazi)",
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: "var(--kenar)" }}>
                <span className="font-bold text-sm" style={{ color: "var(--yazi)" }}>
                  {t("adminPanel")}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded hover:opacity-75 focus-visible:outline-none"
                  style={{ color: "var(--yazi-soluk)" }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map(item => {
                  const isActive =
                    item.to === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(item.to);

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: isActive ? "var(--renk-ana)" : "transparent",
                        color: isActive ? "var(--renk-ana-yazi)" : "var(--yazi)",
                        textDecoration: "none",
                      }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 focus:outline-none max-w-7xl w-full mx-auto"
        >
          {children}
        </main>
      </div>
    </div>
  );
};
