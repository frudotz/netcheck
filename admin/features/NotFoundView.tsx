import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import { FileQuestion, ArrowLeft, LayoutDashboard } from "lucide-react";

export const NotFoundView: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4 border"
        style={{
          backgroundColor: "var(--zemin)",
          borderColor: "var(--kenar)",
          color: "var(--renk-ana)",
        }}
      >
        <FileQuestion className="w-8 h-8" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2" style={{ color: "var(--yazi)" }}>
        {t("notFoundTitle")}
      </h1>

      <p className="text-sm max-w-md mb-6 leading-relaxed" style={{ color: "var(--yazi-soluk)" }}>
        {t("notFoundDesc")}
      </p>

      <Link
        to="/"
        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
        style={{
          backgroundColor: "var(--renk-ana)",
          color: "var(--renk-ana-yazi)",
          borderRadius: "var(--radius)",
          textDecoration: "none",
        }}
      >
        <LayoutDashboard className="w-4 h-4" />
        <span>{t("returnToDashboard")}</span>
      </Link>
    </div>
  );
};
