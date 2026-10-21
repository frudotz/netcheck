import React, { createContext, useContext, useState } from "react";

export type Density = "compact" | "default" | "comfortable";

interface DensityContextType {
  density: Density;
  setDensity: (d: Density) => void;
}

const DensityContext = createContext<DensityContextType | null>(null);

const STORAGE_KEY = "netcheck-admin:density";

export const DensityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [density, setDensityState] = useState<Density>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Density;
    return saved === "compact" || saved === "comfortable" ? saved : "default";
  });

  const setDensity = (d: Density) => {
    setDensityState(d);
    localStorage.setItem(STORAGE_KEY, d);
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
