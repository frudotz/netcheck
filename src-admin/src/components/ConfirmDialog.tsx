import React, { useState } from "react";
import { Modal } from "./Modal";
import { AlertTriangle } from "lucide-react";
import { useI18n } from "../i18n";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "warning" | "neutral";
  requireReason?: boolean;
  reasonPlaceholder?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  requireReason = false,
  reasonPlaceholder,
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const { t } = useI18n();

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError("Bu işlem için bir gerekçe belirtmeniz zorunludur.");
      return;
    }
    onConfirm(requireReason ? reason.trim() : undefined);
    setReason("");
    setError("");
  };

  const handleCancel = () => {
    setReason("");
    setError("");
    onClose();
  };

  let confirmBg = "var(--durum-hata)";
  let confirmColor = "#ffffff";
  if (tone === "warning") {
    confirmBg = "var(--durum-uyari)";
  } else if (tone === "neutral") {
    confirmBg = "var(--renk-ana)";
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={handleCancel}
            className="cursor-pointer px-4 py-2 text-sm font-medium rounded-lg hover:opacity-80 transition-opacity focus-visible:outline-none"
            style={{
              backgroundColor: "transparent",
              color: "var(--yazi-soluk)",
              border: "1px solid var(--kenar)",
              borderRadius: "var(--radius)",
            }}
          >
            {cancelLabel ?? t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="cursor-pointer px-4 py-2 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity focus-visible:outline-none"
            style={{
              backgroundColor: confirmBg,
              color: confirmColor,
              borderRadius: "var(--radius)",
            }}
          >
            {confirmLabel ?? t("confirm")}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="p-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: tone === "danger" ? "var(--durum-hata-zemin)" : "var(--durum-uyari-zemin)",
              color: tone === "danger" ? "var(--durum-hata)" : "var(--durum-uyari)",
            }}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--yazi)" }}>
            {message}
          </p>
        </div>

        {requireReason && (
          <div className="pt-2">
            <label
              htmlFor="confirm-reason"
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--yazi)" }}
            >
              {t("confirmReasonLabel")} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="confirm-reason"
              rows={3}
              value={reason}
              onChange={e => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              placeholder={reasonPlaceholder ?? t("confirmReasonPlaceholder")}
              className="w-full text-sm p-3 rounded-lg border transition-colors focus-visible:outline-none"
              style={{
                backgroundColor: "var(--zemin)",
                borderColor: error ? "var(--durum-hata)" : "var(--kenar)",
                color: "var(--yazi)",
                borderRadius: "var(--radius)",
              }}
              required
            />
            {error && (
              <p className="text-xs mt-1" style={{ color: "var(--durum-hata)" }}>
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
