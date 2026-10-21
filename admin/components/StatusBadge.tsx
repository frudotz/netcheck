import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Clock } from "lucide-react";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export interface StatusBadgeProps {
  tone: StatusTone;
  label: string;
  icon?: React.ReactNode;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  tone,
  label,
  icon,
  size = "md",
}) => {
  let bg = "var(--kart)";
  let color = "var(--yazi)";
  let border = "var(--kenar)";
  let defaultIcon: React.ReactNode = null;

  switch (tone) {
    case "success":
      bg = "var(--durum-basarili-zemin)";
      color = "var(--durum-basarili)";
      border = "var(--durum-basarili)";
      defaultIcon = <CheckCircle2 className="w-3.5 h-3.5" />;
      break;
    case "warning":
      bg = "var(--durum-uyari-zemin)";
      color = "var(--durum-uyari)";
      border = "var(--durum-uyari)";
      defaultIcon = <AlertTriangle className="w-3.5 h-3.5" />;
      break;
    case "danger":
      bg = "var(--durum-hata-zemin)";
      color = "var(--durum-hata)";
      border = "var(--durum-hata)";
      defaultIcon = <AlertCircle className="w-3.5 h-3.5" />;
      break;
    case "info":
      bg = "var(--kart)";
      color = "var(--renk-ana)";
      border = "var(--renk-ana)";
      defaultIcon = <Info className="w-3.5 h-3.5" />;
      break;
    case "neutral":
      bg = "var(--zemin)";
      color = "var(--yazi-soluk)";
      border = "var(--kenar)";
      defaultIcon = <Clock className="w-3.5 h-3.5" />;
      break;
  }

  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs sm:text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${padding}`}
      style={{
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
      }}
    >
      <span aria-hidden="true" className="flex items-center">
        {icon !== undefined ? icon : defaultIcon}
      </span>
      <span>{label}</span>
    </span>
  );
};
