import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LogIn, ShieldAlert, Unplug, RefreshCw } from "lucide-react";
import { auth, bagli, AdminApiError, PanelBagliDegil, type AdminSession } from "../api";
import { useI18n } from "../i18n";
import type { Translations } from "../i18n/tr";

// Panel oturumu: arka uçtaki tek yerel oturumun (auth_me) ön yüzdeki görüntüsü. Yetki denetimi Rust'tadır;
// buradaki `can` yalnız menü ve düğme görünürlüğü içindir. Oturum, kullanıcı askıya alınınca arka uçta düşer
// ve bir sonraki çağrı `unauthenticated` döner; AdminAuthBoundary o zaman giriş ekranına döner.

type AuthPhase = "loading" | "unavailable" | "setup" | "login" | "error" | "ready";

interface AdminAuthValue {
  phase: AuthPhase;
  session: AdminSession | null;
  error: string | null;
  busy: boolean;
  can: (permission: string | null) => boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** `unauthenticated` hatası alan ekranlar oturumu bu çağrıyla düşürür. */
  sessionLost: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

/** Arka uç hata kodunu sözlük anahtarına çevirir; ham mesaj ekrana çıkmaz. */
export function errorKey(error: unknown): keyof Translations {
  if (error instanceof PanelBagliDegil) return "authUnavailableDesc";
  if (error instanceof AdminApiError) {
    switch (error.code) {
      case "unauthenticated":
        return "authErrUnauthenticated";
      case "forbidden":
        return "authErrForbidden";
      case "validation":
        return "authErrValidation";
      case "conflict":
        return "authErrConflict";
      case "too_many_attempts":
        return "authErrTooMany";
      default:
        return "authErrGeneric";
    }
  }
  return "authErrGeneric";
}

export const AdminAuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { t } = useI18n();
  const [phase, setPhase] = useState<AuthPhase>(bagli ? "loading" : "unavailable");
  const [session, setSession] = useState<AdminSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!bagli) {
      setPhase("unavailable");
      setSession(null);
      return;
    }
    setPhase("loading");
    setError(null);
    try {
      const [current, firstRun] = await Promise.all([auth.getSession(), auth.isFirstRun()]);
      setSession(current);
      setPhase(current ? "ready" : firstRun ? "setup" : "login");
    } catch (caught) {
      setSession(null);
      setError(t(errorKey(caught)));
      setPhase("error");
    }
  }, [t]);

  useEffect(() => {
    void refresh();
    // Yalnız ilk açılışta; dil değişince yeniden sorgulamaya gerek yok.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setBusy(true);
      setError(null);
      try {
        setSession(await auth.login(email, password));
        setPhase("ready");
      } catch (caught) {
        setError(t(errorKey(caught)));
      } finally {
        setBusy(false);
      }
    },
    [t],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setBusy(true);
      setError(null);
      try {
        setSession(await auth.registerFirstAdmin(name, email, password));
        setPhase("ready");
      } catch (caught) {
        setError(t(errorKey(caught)));
      } finally {
        setBusy(false);
      }
    },
    [t],
  );

  const logout = useCallback(async () => {
    setError(null);
    try {
      await auth.logout();
    } finally {
      setSession(null);
      setPhase("login");
    }
  }, []);

  const sessionLost = useCallback(() => {
    setSession(null);
    setPhase("login");
  }, []);

  const can = useCallback(
    (permission: string | null) => permission === null || Boolean(session?.superAdmin || session?.permissions.includes(permission)),
    [session],
  );

  const value = useMemo(
    () => ({ phase, session, error, busy, can, refresh, login, register, logout, sessionLost }),
    [phase, session, error, busy, can, refresh, login, register, logout, sessionLost],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export function useAdminAuth(): AdminAuthValue {
  const value = useContext(AdminAuthContext);
  if (!value) throw new Error("AdminAuthProvider içinde kullanılmalıdır.");
  return value;
}

const girdiSinifi = "w-full p-2.5 text-sm rounded-lg border bg-zemin border-kenar text-yazi";

/** Oturum yokken giriş / ilk kurulum; oturum varken çocukları çizer. */
export const AdminAuthBoundary: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { t } = useI18n();
  const { phase, session, error, busy, refresh, login, register, logout } = useAdminAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const kart = (icon: React.ReactNode, title: string, description: string, content: React.ReactNode) => (
    <div className="max-w-md mx-auto py-6">
      <section
        aria-labelledby="oturum-baslik"
        className="p-6 border space-y-4 bg-kart border-kenar"
        style={{ borderRadius: "var(--radius)" }}
      >
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-bilgi-zemin text-bilgi" aria-hidden="true">
            {icon}
          </span>
          <div>
            <h1 id="oturum-baslik" className="text-lg font-bold text-yazi">
              {title}
            </h1>
            <p className="text-sm mt-1 leading-relaxed text-yazi-soluk">{description}</p>
          </div>
        </div>
        {content}
      </section>
    </div>
  );

  if (phase === "ready" && session && session.roles.length === 0) {
    return kart(<ShieldAlert className="w-5 h-5" />, t("authNoRoleTitle"), t("authNoRoleDesc"), (
      <button
        type="button"
        onClick={() => void logout()}
        className="cursor-pointer w-full min-h-11 px-4 text-sm font-semibold bg-ana text-ana-yazi hover:opacity-90"
        style={{ borderRadius: "var(--radius)" }}
      >
        {t("shellSignOut")}
      </button>
    ));
  }

  if (phase === "ready" && session) return <>{children}</>;

  if (phase === "loading") {
    return kart(<RefreshCw className="w-5 h-5 animate-spin" />, t("authCheckingTitle"), t("authCheckingDesc"), (
      <div className="h-2 animate-pulse rounded bg-kenar" aria-hidden="true" />
    ));
  }

  if (phase === "unavailable") {
    return kart(<Unplug className="w-5 h-5" />, t("authUnavailableTitle"), t("authUnavailableDesc"), null);
  }

  if (phase === "error") {
    return kart(<ShieldAlert className="w-5 h-5" />, t("authErrorTitle"), error ?? t("authErrGeneric"), (
      <button
        type="button"
        onClick={() => void refresh()}
        className="cursor-pointer w-full min-h-11 px-4 text-sm font-semibold bg-ana text-ana-yazi hover:opacity-90"
        style={{ borderRadius: "var(--radius)" }}
      >
        {t("retry")}
      </button>
    ));
  }

  const isSetup = phase === "setup";
  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSetup) await register(name.trim(), email.trim(), password);
    else await login(email.trim(), password);
  };

  return kart(
    <LogIn className="w-5 h-5" />,
    isSetup ? t("authSetupTitle") : t("authLoginTitle"),
    isSetup ? t("authSetupDesc") : t("authLoginDesc"),
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <p role="alert" className="rounded-lg border px-3 py-2 text-sm border-hata text-hata bg-hata-zemin">
          {error}
        </p>
      )}
      {isSetup && (
        <label className="block space-y-1.5 text-sm font-medium text-yazi">
          <span>{t("authName")}</span>
          <input autoComplete="name" required minLength={2} maxLength={80} value={name} onChange={e => setName(e.target.value)} className={girdiSinifi} />
        </label>
      )}
      <label className="block space-y-1.5 text-sm font-medium text-yazi">
        <span>{t("authEmail")}</span>
        <input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} className={`${girdiSinifi} force-ltr`} />
      </label>
      <label className="block space-y-1.5 text-sm font-medium text-yazi">
        <span>{t("authPassword")}</span>
        <input
          type="password"
          autoComplete={isSetup ? "new-password" : "current-password"}
          required
          minLength={8}
          maxLength={128}
          value={password}
          onChange={e => setPassword(e.target.value)}
          className={girdiSinifi}
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="cursor-pointer w-full min-h-11 px-4 text-sm font-semibold bg-ana text-ana-yazi hover:opacity-90 disabled:opacity-60"
        style={{ borderRadius: "var(--radius)" }}
      >
        {busy ? t("authBusy") : isSetup ? t("authSubmitSetup") : t("authSubmitLogin")}
      </button>
    </form>,
  );
};

/** Oturumun izni olmayan ekran yerine gösterilir (UX; asıl denetim arka uçta). */
export const YetkiYok: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="max-w-xl space-y-3">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-yazi">{t("permDeniedTitle")}</h1>
      <p className="text-sm text-yazi-soluk">{t("permDeniedDesc")}</p>
    </div>
  );
};
