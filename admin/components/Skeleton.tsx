import React from "react";

export interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", style }) => {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{
        backgroundColor: "var(--kenar)",
        opacity: 0.6,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => {
  return (
    <div className="w-full space-y-3 p-4">
      <div className="flex gap-4 pb-2" style={{ borderBottom: "1px solid var(--kenar)" }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div
      className="p-5 rounded-xl space-y-3"
      style={{
        backgroundColor: "var(--kart)",
        border: "1px solid var(--kenar)",
        borderRadius: "var(--radius)",
      }}
    >
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div
      className="p-5 rounded-xl space-y-4"
      style={{
        backgroundColor: "var(--kart)",
        border: "1px solid var(--kenar)",
        borderRadius: "var(--radius)",
      }}
    >
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-44 w-full" />
    </div>
  );
};
