import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useI18n } from "../i18n";

export type ToastTone = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  tone: ToastTone;
  message: string;
}

interface ToastContextType {
  addToast: (message: string, tone?: ToastTone) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useI18n();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, tone, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-4 end-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
        role="region"
        aria-label={t("shellNotifications")}
      >
        {toasts.map(toast => {
          let toneBg = "var(--kart)";
          let toneBorder = "var(--kenar)";
          let toneIcon = <Info className="w-5 h-5 flex-shrink-0" style={{ color: "var(--renk-ana)" }} />;

          if (toast.tone === "success") {
            toneBg = "var(--durum-basarili-zemin)";
            toneBorder = "var(--durum-basarili)";
            toneIcon = <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "var(--durum-basarili)" }} />;
          } else if (toast.tone === "error") {
            toneBg = "var(--durum-hata-zemin)";
            toneBorder = "var(--durum-hata)";
            toneIcon = <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: "var(--durum-hata)" }} />;
          } else if (toast.tone === "warning") {
            toneBg = "var(--durum-uyari-zemin)";
            toneBorder = "var(--durum-uyari)";
            toneIcon = <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: "var(--durum-uyari)" }} />;
          }

          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start gap-3 p-3.5 shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2"
              style={{
                backgroundColor: toneBg,
                border: `1px solid ${toneBorder}`,
                borderRadius: "var(--radius)",
                color: "var(--yazi)",
              }}
            >
              {toneIcon}
              <div className="flex-1 text-sm font-medium leading-snug">{toast.message}</div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="cursor-pointer p-0.5 rounded hover:opacity-75"
                style={{ color: "var(--yazi-soluk)" }}
                aria-label={t("close")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
