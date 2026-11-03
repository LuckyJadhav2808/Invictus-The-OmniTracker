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
  href: string;
  icon: typeof CheckSquare;
  badge?: string;
}

export const LIFE_SPACE_TABS: LifeSpaceTabItem[] = [
  {
    id: "habits",
    label: "Habits",
    href: "/goals",
    icon: CheckSquare,
  },
  {
    id: "gym",
    label: "Gym & Anatomy",
    href: "/goals/gym",
    icon: Dumbbell,
  },
  {
    id: "nutrition",
    label: "Meal & Fuel",
    href: "/goals/nutrition",
    icon: Utensils,
  },
  {
    id: "analytics",
    label: "Analytics",
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
      className={cn("w-full overflow-x-auto no-scrollbar pb-1 mb-5 select-none", className)}
      aria-label="Life Space Sub Navigation"
    >
      <div className="bg-white/80 dark:bg-[#161514]/80 backdrop-blur-md rounded-2xl p-1 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center gap-1.5 w-max min-w-full sm:min-w-0 sm:w-auto">
        {LIFE_SPACE_TABS.map((tab) => {
          const active = isTabActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={handleTabClick}
              className={cn(
                "rounded-xl text-xs font-medium py-2 px-3 sm:px-3.5 border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-98",
                active
                  ? "border-[#E8E5DF] dark:border-white/10 bg-[#161514] text-white dark:bg-white dark:text-[#161514] shadow-xs"
                  : "border-transparent text-[#6E6B65] dark:text-[#9E9A90] hover:text-[#161514] dark:hover:text-white hover:bg-[#F1EFEA] dark:hover:bg-white/5"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-3.5 stroke-[2]" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="bg-[#03D26F]/15 text-[#047857] text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-md border border-[#03D26F]/30">
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
