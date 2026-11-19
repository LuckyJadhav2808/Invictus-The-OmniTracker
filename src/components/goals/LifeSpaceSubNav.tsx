"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, Dumbbell, Utensils, BarChart2 } from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

export interface LifeSpaceTabItem {
  id: string;
  label: string;
  shortLabel?: string;
  href: string;
  icon: typeof CheckSquare;
  badge?: string;
}

export const LIFE_SPACE_TABS: LifeSpaceTabItem[] = [
  {
    id: "habits",
    label: "Habits",
    shortLabel: "Habits",
    href: "/goals",
    icon: CheckSquare,
  },
  {
    id: "gym",
    label: "Gym & Anatomy",
    shortLabel: "Gym",
    href: "/goals/gym",
    icon: Dumbbell,
  },
  {
    id: "nutrition",
    label: "Meal & Fuel",
    shortLabel: "Diet",
    href: "/goals/nutrition",
    icon: Utensils,
  },
  {
    id: "analytics",
    label: "Analytics",
    shortLabel: "Stats",
    href: "/goals/analytics",
    icon: BarChart2,
  },
];

interface LifeSpaceSubNavProps {
  className?: string;
}

export function LifeSpaceSubNav({ className }: LifeSpaceSubNavProps) {
  const pathname = usePathname();

  const isTabActive = (href: string) => {
    if (href === "/goals") {
      return pathname === "/goals";
    }
    return pathname.startsWith(href);
  };

  const handleTabClick = () => {
    soundFX.playPop();
    soundFX.vibrate(15);
  };

  return (
    <nav
      className={cn(
        "w-full overflow-x-auto no-scrollbar pb-1 mb-3 sm:mb-5 select-none [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)] sm:[mask-image:none]",
        className
      )}
      aria-label="Life Space Sub Navigation"
    >
      <div className="bg-card text-card-foreground border-2 border-[#161514] dark:border-[#38332E] rounded-2xl p-1 sm:p-1.5 shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] flex items-center gap-1 sm:gap-1.5 w-max min-w-full sm:min-w-0 sm:w-auto">
        {LIFE_SPACE_TABS.map((tab) => {
          const active = isTabActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={handleTabClick}
              className={cn(
                "rounded-xl text-xs py-1.5 sm:py-2 px-2.5 sm:px-3.5 border-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
                active
                  ? "bg-[#161514] text-[#CEF431] border-[#161514] dark:bg-[#CEF431] dark:text-[#161514] dark:border-[#CEF431] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,0.6)] font-black"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted font-bold"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-3.5 stroke-[2.2]" />
              <span className="sm:hidden">{tab.shortLabel || tab.label}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <span className="bg-[#03D26F]/20 text-[#047857] dark:text-[#03D26F] text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md border border-[#03D26F]/40">
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
