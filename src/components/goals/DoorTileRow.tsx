"use client";

import React from "react";
import { Droplet, Activity, Bell, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface DoorTileRowProps {
  waterAmount: number;
  waterTarget: number;
  bodyWeight?: string;
  bodyAge?: string;
  onOpenWater: () => void;
  onOpenBodyProfile: () => void;
  onOpenReminders: () => void;
  onOpenRecovery: () => void;
  className?: string;
}

export function DoorTileRow({
  waterAmount,
  waterTarget,
  bodyWeight = "68 kg",
  bodyAge = "24y",
  onOpenWater,
  onOpenBodyProfile,
  onOpenReminders,
  onOpenRecovery,
  className,
}: DoorTileRowProps) {
  const tiles = [
    {
      id: "water",
      label: "Water",
      value: `${waterAmount}/${waterTarget}ml`,
      icon: Droplet,
      iconColor: "text-sky-500 fill-sky-500",
      bgClass: "hover:border-sky-500/50",
      onClick: onOpenWater,
    },
    {
      id: "body",
      label: "Body",
      value: `${bodyWeight} • ${bodyAge}`,
      icon: Activity,
      iconColor: "text-emerald-500",
      bgClass: "hover:border-emerald-500/50",
      onClick: onOpenBodyProfile,
    },
    {
      id: "reminders",
      label: "Alerts",
      value: "Active",
      icon: Bell,
      iconColor: "text-amber-500",
      bgClass: "hover:border-amber-500/50",
      onClick: onOpenReminders,
    },
    {
      id: "recovery",
      label: "Sleep",
      value: "Journal",
      icon: Moon,
      iconColor: "text-indigo-500",
      bgClass: "hover:border-indigo-500/50",
      onClick: onOpenRecovery,
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
              "py-2 sm:py-3 px-1.5 sm:px-3 rounded-xl sm:rounded-2xl bg-card border border-border flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 shadow-2xs group min-h-[58px] sm:min-h-[66px]",
              t.bgClass
            )}
            title={`Open ${t.label} Sheet`}
          >
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Icon className={cn("size-3.5 sm:size-4 stroke-[2]", t.iconColor)} />
              <span className="font-heading font-black text-[11px] sm:text-xs text-foreground tracking-tight">
                {t.label}
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono font-medium text-muted-foreground truncate w-full mt-0.5">
              {t.value}
            </span>
          </button>
        );
      })}
    </div>
  );
}
