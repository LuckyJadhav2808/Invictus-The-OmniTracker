"use client";

import React from "react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

export interface DoorTileItem {
  id: string;
  label: string;
  value: string;
  icon: React.ElementType;
  iconColorClass?: string;
  bgClass?: string;
  onClick: () => void;
  title?: string;
}

export interface DoorTileGridProps {
  tiles: DoorTileItem[];
  className?: string;
}

export function DoorTileGrid({ tiles, className }: DoorTileGridProps) {
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
            aria-label={`${t.label}: ${t.value}`}
          >
            <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
              <Icon
                className={cn(
                  "size-3.5 sm:size-4 stroke-[2] transition-transform group-hover:scale-110 shrink-0",
                  t.iconColorClass
                )}
              />
              <span className="font-heading font-black text-[11px] sm:text-xs text-foreground tracking-tight">
                {t.label}
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-tight text-muted-foreground leading-tight text-center block w-full truncate mt-0.5">
              {t.value}
            </span>
          </button>
        );
      })}
    </div>
  );
}
