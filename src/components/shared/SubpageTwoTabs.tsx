"use client";

import React from "react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

export interface TabOption<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface SubpageTwoTabsProps<T extends string = string> {
  tabs: [TabOption<T>, TabOption<T>];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
}

export function SubpageTwoTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className,
}: SubpageTwoTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        "grid grid-cols-2 p-1 bg-muted/60 dark:bg-card border-2 border-[#161514] dark:border-white/20 rounded-xl shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] gap-1 select-none",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              if (!isActive) {
                soundFX.playPop();
                soundFX.vibrate(10);
                onChange(tab.id);
              }
            }}
            className={cn(
              "py-2 px-3 text-xs font-heading font-black rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 active:scale-98",
              isActive
                ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span className="truncate">{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "font-mono text-[10px] px-1.5 py-0.2 rounded-full",
                  isActive
                    ? "bg-white/20 text-white dark:bg-black/20 dark:text-[#161514]"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
