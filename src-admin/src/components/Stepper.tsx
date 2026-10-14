import React from "react";
import { Check } from "lucide-react";

export interface StepItem {
  id: string;
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  current: number; // 0-indexed
  terminal?: "success" | "failed";
}

export const Stepper: React.FC<StepperProps> = ({ steps, current, terminal }) => {
  return (
    <div className="w-full py-4">
      <ol className="flex items-center w-full">
        {steps.map((step, idx) => {
          const isDone = idx < current || (idx === current && terminal === "success");
          const isCurrent = idx === current && !terminal;
          const isFailed = idx === current && terminal === "failed";
          const isLast = idx === steps.length - 1;

          let circleBg = "var(--zemin)";
          let circleColor = "var(--yazi-soluk)";
          let circleBorder = "var(--kenar)";

          if (isDone) {
            circleBg = "var(--durum-basarili)";
            circleColor = "#ffffff";
            circleBorder = "var(--durum-basarili)";
          } else if (isFailed) {
            circleBg = "var(--durum-hata)";
            circleColor = "#ffffff";
            circleBorder = "var(--durum-hata)";
          } else if (isCurrent) {
            circleBg = "var(--renk-ana)";
            circleColor = "var(--renk-ana-yazi)";
            circleBorder = "var(--renk-ana)";
          }

          return (
            <li
              key={step.id}
              className={`flex items-center ${isLast ? "flex-shrink-0" : "w-full"}`}
            >
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs border-2 transition-colors"
                  style={{
                    backgroundColor: circleBg,
                    color: circleColor,
                    borderColor: circleBorder,
                  }}
                >
                  {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className="text-xs font-medium mt-1.5 whitespace-nowrap text-center"
                  style={{
                    color: isCurrent || isDone ? "var(--yazi)" : "var(--yazi-soluk)",
                  }}
                >
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <div
                  className="flex-1 h-0.5 mx-3 -mt-4 transition-colors"
                  style={{
                    backgroundColor: isDone ? "var(--durum-basarili)" : "var(--kenar)",
                  }}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
