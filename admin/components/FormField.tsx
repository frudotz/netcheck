import React from "react";

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className = "",
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="text-xs sm:text-sm font-medium flex items-center justify-between"
        style={{ color: "var(--yazi)" }}
      >
        <span>
          {label} {required && <span className="text-hata" aria-hidden="true">*</span>}
        </span>
      </label>

      {children}

      {hint && !error && (
        <span className="text-xs" style={{ color: "var(--yazi-soluk)" }}>
          {hint}
        </span>
      )}

      {error && (
        <span className="text-xs font-medium" style={{ color: "var(--durum-hata)" }} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};
