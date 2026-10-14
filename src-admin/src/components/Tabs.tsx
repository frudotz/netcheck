import React, { useRef } from "react";

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = "",
}) => {
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    onChange(tabs[nextIndex].id);
    const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>("button");
    buttons?.[nextIndex]?.focus();
  };

  return (
    <div
      ref={tabListRef}
      role="tablist"
      className={`flex items-center gap-1 border-b overflow-x-auto ${className}`}
      style={{ borderColor: "var(--kenar)" }}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={e => handleKeyDown(e, idx)}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors focus-visible:outline-none"
            style={{
              borderColor: isActive ? "var(--renk-ana)" : "transparent",
              color: isActive ? "var(--renk-ana)" : "var(--yazi-soluk)",
            }}
          >
            {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className="px-1.5 py-0.5 text-xs rounded-full font-mono"
                style={{
                  backgroundColor: isActive ? "var(--renk-ana)" : "var(--zemin)",
                  color: isActive ? "var(--renk-ana-yazi)" : "var(--yazi-soluk)",
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
