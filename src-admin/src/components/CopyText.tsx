import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useI18n } from "../i18n";

export interface CopyTextProps {
  value: string;
  displayValue?: string;
  className?: string;
}

export const CopyText: React.FC<CopyTextProps> = ({ value, displayValue, className = "" }) => {
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy error", err);
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 force-ltr ${className}`}>
      <code
        className="font-mono text-xs sm:text-sm px-1.5 py-0.5 rounded transition-colors"
        style={{
          backgroundColor: "var(--zemin)",
          border: "1px solid var(--kenar)",
          color: "var(--yazi)",
        }}
      >
        {displayValue ?? value}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        className="cursor-pointer p-1 rounded hover:opacity-80 transition-colors focus-visible:outline-none"
        style={{
          color: copied ? "var(--durum-basarili)" : "var(--yazi-soluk)",
        }}
        title={copied ? t("copied") : t("copy")}
        aria-label={copied ? t("copied") : t("copy")}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </span>
  );
};
