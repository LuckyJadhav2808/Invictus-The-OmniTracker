"use client";

import { FileText, Moon, Droplet, Sliders } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface TodayDoorTileRowProps {
  waterAmount?: number;
  waterTarget?: number;
  dailySafeToSpend?: number;
  currencySymbol?: string;
  notesCount?: number;
  onOpenScratchpad: () => void;
  onOpenCloseout: () => void;
  onOpenWater: () => void;
  onOpenDailyLimit: () => void;
  onQuickLogWater?: () => void;
  className?: string;
}

export function TodayDoorTileRow({
  waterAmount = 0,
  waterTarget = 2000,
  dailySafeToSpend = 727,
  currencySymbol = "₹",
  notesCount,
  onOpenScratchpad,
  onOpenCloseout,
  onOpenWater,
  onOpenDailyLimit,
  onQuickLogWater,
  className,
}: TodayDoorTileRowProps) {
  const tiles = [
    {
      id: "scratchpad",
      label: "Notes",
      value: notesCount !== undefined && notesCount > 0 ? `${notesCount} Notes` : "Desk",
      icon: FileText,
      iconColor: "text-amber-600 dark:text-amber-400",
      bgClass: "hover:border-amber-500/50",
      onClick: onOpenScratchpad,
      title: "Open Slide-Over Desk Scratchpad (⌘J)",
    },
    {
      id: "review",
      label: "Review",
      value: "Daily",
      icon: Moon,
      iconColor: "text-purple-600 dark:text-purple-400",
      bgClass: "hover:border-purple-500/50",
      onClick: onOpenCloseout,
      title: "Open Evening Closeout & Daily Mindset Reflection",
    },
    {
      id: "water",
      label: "Water",
      value: `${waterAmount}ml`,
      icon: Droplet,
      iconColor: "text-blue-500 dark:text-blue-400",
      bgClass: "hover:border-blue-500/50",
      onClick: onOpenWater,
      title: "Open Daily Hydration Tracker & Target Settings",
    },
    {
      id: "limit",
      label: "Limit",
      value: `${currencySymbol}${dailySafeToSpend >= 1000 ? Math.round(dailySafeToSpend / 1000) + "k" : dailySafeToSpend} Safe`,
      icon: Sliders,
      iconColor: "text-emerald-600 dark:text-[#03D26F]",
      bgClass: "hover:border-[#03D26F]/50",
      onClick: onOpenDailyLimit,
      title: "Calibrate Daily Spending Limit & Rollover Rules",
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-4 gap-1.5 sm:gap-2.5 lg:gap-3 w-full select-none",
        className
      )}
    >
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              soundFX.playPop();
              soundFX.vibrate(15);
              t.onClick();
            }}
            className={cn(
              "py-2 sm:py-3 px-1 sm:px-2.5 rounded-xl sm:rounded-2xl bg-card border border-border flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 shadow-2xs group min-h-[58px] sm:min-h-[66px]",
              t.bgClass
            )}
            title={t.title}
          >
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Icon className={cn("size-3.5 sm:size-4 stroke-[2]", t.iconColor)} />
              <span className="font-heading font-black text-[11px] sm:text-xs text-foreground tracking-tight">
                {t.label}
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground leading-tight text-center block w-full truncate mt-0.5">
              {t.value}
            </span>
          </button>
        );
      })}
    </div>
  );
}
