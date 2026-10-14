import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, AdminApiError, AdminSession } from "../api/nativeAdapter";
import { hasNative } from "../../../src/lib/native";

type AuthPhase = "loading" | "unavailable" | "setup" | "login" | "error" | "ready";

interface AdminAuthValue {
  phase: AuthPhase;
  session: AdminSession | null;
  error: string | null;
  busy: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

function errorMessage(error: unknown): string {
  if (error instanceof AdminApiError) return error.message;
  return "İşlem tamamlanamadı. Lütfen yeniden dene.";
}

export const AdminAuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [phase, setPhase] = useState<AuthPhase>("loading");
  const [session, setSession] = useState<AdminSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!hasNative()) {
      setPhase("unavailable");
      setSession(null);
      return;
    }
    setPhase("loading");
    setError(null);
    try {
      const [currentSession, firstRun] = await Promise.all([
        api.getAuthSession(),
        api.isFirstRun(),
      ]);
      setSession(currentSession);
      setPhase(currentSession ? "ready" : firstRun ? "setup" : "login");
    } catch (caught) {
      setSession(null);
      setError(errorMessage(caught));
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    setBusy(true);
    setError(null);
    try {
      setSession(await api.login(email, password));
      setPhase("ready");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setBusy(true);
    setError(null);
    try {
      setSession(await api.registerFirstAdmin(name, email, password));
      setPhase("ready");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await api.logout();
      setSession(null);
      setPhase("login");
    } catch (caught) {
      setError(errorMessage(caught));
      throw caught;
    }
  }, []);

  const value = useMemo(
    () => ({ phase, session, error, busy, refresh, login, register, logout }),
    [phase, session, error, busy, refresh, login, register, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export function useAdminAuth(): AdminAuthValue {
  const value = useContext(AdminAuthContext);
  if (!value) throw new Error("AdminAuthProvider içinde kullanılmalıdır.");
  return value;
}

export const AdminAuthBoundary: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { phase, session, error, busy, refresh, login, register, logout } = useAdminAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const panel = (title: string, description: string, content: React.ReactNode) => (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: "var(--zemin)", color: "var(--yazi)" }}
    >
      <section
        className="w-full max-w-md rounded-2xl border p-7 shadow-sm"
        style={{ backgroundColor: "var(--kart)", borderColor: "var(--kenar)" }}
      >
        <div className="mb-6">
          <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "var(--renk-ana)" }}>
            NetCheck · Yönetim
          </p>
          <h1 className="mt-3 text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--yazi-soluk)" }}>{description}</p>
        </div>
        {content}
      </section>
    </main>
  );

  if (phase === "ready" && session && session.roles.length === 0) {
    return panel("Yönetici erişimi gerekli", "Bu hesabın yönetim paneline erişim rolü bulunmuyor.", (
      <>
        {error && <p role="alert" className="mb-3 text-sm" style={{ color: "var(--durum-hata)" }}>{error}</p>}
        <button
          type="button"
          onClick={() => void logout().catch(() => undefined)}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold"
          style={{ backgroundColor: "var(--renk-ana)", color: "var(--renk-ana-yazi)" }}
        >
          Çıkış yap
        </button>
      </>
    ));
  }

  if (phase === "ready" && session) return <>{children}</>;

  if (phase === "loading") {
    return panel("Veritabanı denetleniyor", "Yerel yönetim oturumu kontrol ediliyor.", (
      <div className="h-2 animate-pulse rounded" style={{ backgroundColor: "var(--renk-ana)" }} />
    ));
  }

  if (phase === "unavailable") {
    return panel("Masaüstü uygulaması gerekli", "Yönetim verileri bu cihazdaki SQLite veritabanında tutulur. Admin panelini NetCheck Tauri uygulamasından aç.", null);
  }

  if (phase === "error") {
    return panel("Veritabanına bağlanılamadı", error ?? "Yerel veritabanı bağlantısı kurulamadı.", (
      <button
        type="button"
        onClick={() => void refresh()}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold"
        style={{ backgroundColor: "var(--renk-ana)", color: "var(--renk-ana-yazi)" }}
      >
        Yeniden dene
      </button>
    ));
  }

  const isSetup = phase === "setup";
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSetup) await register(name.trim(), email.trim(), password);
    else await login(email.trim(), password);
  };

  return panel(
    isSetup ? "İlk yönetici hesabını oluştur" : "Yönetici girişi",
    isSetup
      ? "Bu SQLite veritabanındaki ilk hesap yönetici yetkisiyle oluşturulacaktır."
      : "Yönetim paneline erişmek için yerel yönetici hesabınla giriş yap.",
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <p role="alert" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--durum-hata)", color: "var(--durum-hata)" }}>
          {error}
        </p>
      )}
      {isSetup && (
        <label className="block space-y-1.5 text-sm font-medium">
          Ad soyad
          <input
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={event => setName(event.target.value)}
            className="w-full rounded-lg border px-3 py-2.5"
            style={{ backgroundColor: "var(--zemin)", borderColor: "var(--kenar)", color: "var(--yazi)" }}
          />
        </label>
      )}
      <label className="block space-y-1.5 text-sm font-medium">
        E-posta
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={event => setEmail(event.target.value)}
          className="w-full rounded-lg border px-3 py-2.5"
          style={{ backgroundColor: "var(--zemin)", borderColor: "var(--kenar)", color: "var(--yazi)" }}
        />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        Parola
        <input
          type="password"
          autoComplete={isSetup ? "new-password" : "current-password"}
          required
          minLength={8}
          maxLength={128}
          value={password}
          onChange={event => setPassword(event.target.value)}
          className="w-full rounded-lg border px-3 py-2.5"
          style={{ backgroundColor: "var(--zemin)", borderColor: "var(--kenar)", color: "var(--yazi)" }}
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
        style={{ backgroundColor: "var(--renk-ana)", color: "var(--renk-ana-yazi)" }}
      >
        {busy ? "Bekleyin…" : isSetup ? "Yönetici hesabını oluştur" : "Giriş yap"}
      </button>
    </form>,
  );
};
