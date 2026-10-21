import React, { createContext, useContext, useState } from "react";

export type Density = "compact" | "default" | "comfortable";

interface DensityContextType {
  density: Density;
  setDensity: (d: Density) => void;
}

const DensityContext = createContext<DensityContextType | null>(null);

// Yalnız panele ait tercih (uygulamada tablo yok).
const STORAGE_KEY = "netcheck-admin:density";

function savedDensity(): Density {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "compact" || saved === "comfortable" ? saved : "default";
  } catch {
    return "default";
  }
}

export const DensityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [density, setDensityState] = useState<Density>(savedDensity);

  const setDensity = (d: Density) => {
    setDensityState(d);
    try {
      localStorage.setItem(STORAGE_KEY, d);
    } catch {
      // Depolama kullanılamıyorsa seçim yalnızca bu oturumda geçerlidir.
    }
  };

  return (
    <DensityContext.Provider value={{ density, setDensity }}>
      {children}
    </DensityContext.Provider>
  );
};

export const useDensity = (): DensityContextType => {
  const ctx = useContext(DensityContext);
  if (!ctx) throw new Error("useDensity must be used within DensityProvider");
  return ctx;
};
