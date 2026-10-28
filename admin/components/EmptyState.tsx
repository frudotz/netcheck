import React from "react";
import { FolderSearch } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl my-4"
      style={{
        backgroundColor: "var(--kart)",
        border: "1px dashed var(--kenar)",
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{
          backgroundColor: "var(--zemin)",
          color: "var(--yazi-soluk)",
        }}
      >
        {icon ?? <FolderSearch className="w-6 h-6" />}
      </div>
      <h3 className="text-base sm:text-lg font-semibold mb-1" style={{ color: "var(--yazi)" }}>
        {title}
      </h3>
      <p className="text-xs sm:text-sm max-w-md mb-6" style={{ color: "var(--yazi-soluk)" }}>
        {description}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="cursor-pointer inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "var(--renk-ana)",
            color: "var(--renk-ana-yazi)",
            borderRadius: "var(--radius)",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
