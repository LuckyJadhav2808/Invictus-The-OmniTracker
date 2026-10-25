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
    label: "Habits & Routines",
    href: "/goals",
    icon: CheckSquare,
  },
  {
    id: "gym",
    label: "The Iron Arena",
    href: "/goals/gym",
    icon: Dumbbell,
  },
  {
    id: "nutrition",
    label: "The Macro Forge",
    href: "/goals/nutrition",
    icon: Utensils,
  },
  {
    id: "analytics",
    label: "Analytics & Heatmap",
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
      <div className="bg-[#FAF8F5] rounded-2xl p-1.5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex items-center gap-1.5 w-max min-w-full sm:min-w-0 sm:w-auto">
        {LIFE_SPACE_TABS.map((tab) => {
          const active = isTabActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={handleTabClick}
              className={cn(
                "rounded-xl text-xs font-heading font-extrabold py-2 px-3 sm:px-3.5 border-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95",
                active
                  ? "border-[#161514] bg-[#03D26F] text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]"
                  : "border-transparent text-[#161514]/70 hover:text-[#161514] hover:bg-white/60"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-3.5 stroke-[2.2]" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="bg-[#CEF431] text-[#161514] text-[9px] font-mono font-black px-1.5 py-0.2 rounded border border-[#161514]">
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
