import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "../i18n";
import { CopyText } from "./CopyText";

export interface MaskedValueProps {
  value?: string;
  fallbackText?: string;
  onReveal?: (revealedValue: string) => void;
  allowCopy?: boolean;
  className?: string;
}

export const MaskedValue: React.FC<MaskedValueProps> = ({
  value,
  fallbackText,
  onReveal,
  allowCopy = true,
  className = "",
}) => {
  const [revealed, setRevealed] = useState(false);
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const { t } = useI18n();

  if (!value) {
    return (
      <span className="italic text-xs sm:text-sm" style={{ color: "var(--yazi-soluk)" }}>
        {fallbackText ?? t("valNotFound")}
      </span>
    );
  }

  const handleToggle = async () => {
    if (!revealed) {
      const nextValue = onReveal ? await onReveal(value) : value;
      if (typeof nextValue !== "string") return;
      setRevealedValue(nextValue);
      setRevealed(true);
    } else {
      setRevealed(false);
    }
  };

  const maskedRepresentation = "••••••••";

  return (
    <span className={`inline-flex items-center gap-1.5 force-ltr ${className}`}>
      {revealed ? (
        allowCopy ? (
          <CopyText value={revealedValue ?? value} />
        ) : (
          <code
            className="font-mono text-xs sm:text-sm px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: "var(--zemin)",
              border: "1px solid var(--kenar)",
              color: "var(--yazi)",
            }}
          >
            {revealedValue ?? value}
          </code>
        )
      ) : (
        <span
          className="font-mono text-xs sm:text-sm tracking-widest px-1.5 py-0.5 rounded select-none"
          style={{
            backgroundColor: "var(--zemin)",
            border: "1px solid var(--kenar)",
            color: "var(--yazi-soluk)",
          }}
          aria-label="Gizlenmiş hassas veri"
        >
          {maskedRepresentation}
        </span>
      )}

      <button
        type="button"
        onClick={() => void handleToggle()}
        className="cursor-pointer inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors focus-visible:outline-none"
        style={{
          color: "var(--renk-ana)",
          backgroundColor: "transparent",
        }}
        title={revealed ? t("hide") : t("reveal")}
        aria-label={revealed ? t("hide") : t("reveal")}
      >
        {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        <span className="sr-only sm:not-sr-only text-xs">
          {revealed ? t("hide") : t("reveal")}
        </span>
      </button>
    </span>
  );
};
