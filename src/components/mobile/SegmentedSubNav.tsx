"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, Dumbbell, Utensils, BarChart2 } from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

export interface SubNavTab {
  id: string;
  label: string;
  shortLabel?: string;
  href?: string;
  icon?: React.ElementType;
  badge?: React.ReactNode;
}

export interface SegmentedSubNavProps {
  tabs?: SubNavTab[];
  value?: string;
  onValueChange?: (val: string) => void;
  className?: string;
}

export const DEFAULT_HABITS_TABS: SubNavTab[] = [
  { id: "habits", label: "Habits", shortLabel: "Habits", href: "/goals", icon: CheckSquare },
  { id: "gym", label: "Gym", shortLabel: "Gym", href: "/goals/gym", icon: Dumbbell },
  { id: "nutrition", label: "Diet", shortLabel: "Diet", href: "/goals/nutrition", icon: Utensils },
  { id: "analytics", label: "Stats", shortLabel: "Stats", href: "/goals/analytics", icon: BarChart2 },
];

export function SegmentedSubNav({
  tabs = DEFAULT_HABITS_TABS,
  value,
  onValueChange,
  className,
}: SegmentedSubNavProps) {
  const pathname = usePathname();

  const isTabActive = (tab: SubNavTab) => {
    if (value !== undefined) {
      return tab.id === value;
    }
    if (!tab.href) return false;
    if (tab.href === "/goals") {
      return pathname === "/goals";
    }
    return pathname.startsWith(tab.href);
  };

  const handleTabClick = (tabId: string) => {
    soundFX.playPop();
    soundFX.vibrate(15);
    onValueChange?.(tabId);
  };

  return (
    <nav
      aria-label="Sub Navigation"
      className={cn(
        "sticky top-[52px] lg:top-0 z-20 w-full px-3.5 py-1.5 bg-[#FAF8F5]/90 dark:bg-[#161514]/90 backdrop-blur-md border-b border-[#161514]/10 dark:border-white/10 select-none transition-colors",
        className
      )}
    >
      <div className="w-full bg-secondary/80 border border-border rounded-xl p-1 flex items-center justify-between gap-1">
        {tabs.map((tab) => {
          const active = isTabActive(tab);
          const Icon = tab.icon;

          if (value !== undefined && onValueChange) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-lg text-xs font-heading text-center flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer active:scale-95 min-h-[36px]",
                  active
                    ? "bg-[#CEF431] text-[#161514] border border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_#161514]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted font-bold"
                )}
              >
                {Icon && <Icon className="size-3.5 stroke-[2.2] shrink-0" />}
                <span className="truncate">{tab.shortLabel || tab.label}</span>
                {tab.badge}
              </button>
            );
          }

          return (
            <Link
              key={tab.id}
              href={tab.href || "#"}
              onClick={() => handleTabClick(tab.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex-1 py-1.5 px-2 rounded-lg text-xs font-heading text-center flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer active:scale-95 min-h-[36px]",
                active
                  ? "bg-[#CEF431] text-[#161514] border border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_#161514]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted font-bold"
              )}
            >
              {Icon && <Icon className="size-3.5 stroke-[2.2] shrink-0" />}
              <span className="truncate">{tab.shortLabel || tab.label}</span>
              {tab.badge}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
