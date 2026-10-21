import React, { createContext, useContext, useState, useEffect } from "react";

// Tema, uygulamanınkiyle aynı anahtarda ve aynı değerlerle tutulur (src/lib/tema.svelte.ts):
// "gunduz" / "gece" kaydedilir, "sistem" seçilince anahtar silinir. Renkler <html data-tema> ile
// src/styles/app.css token'larından gelir.
export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  actualTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = "tema";

function savedTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "gece" ? "dark" : saved === "gunduz" ? "light" : "system";
  } catch {
    return "system";
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(savedTheme);

  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const actualTheme: "light" | "dark" = theme === "system" ? (systemIsDark ? "dark" : "light") : theme;

  useEffect(() => {
    document.documentElement.dataset.tema = actualTheme === "dark" ? "gece" : "gunduz";
  }, [actualTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      if (newTheme === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, newTheme === "dark" ? "gece" : "gunduz");
    } catch {
      // Depolama kullanılamıyorsa seçim yalnızca bu oturumda geçerlidir.
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
