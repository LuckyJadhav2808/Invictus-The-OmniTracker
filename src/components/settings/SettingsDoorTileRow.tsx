"use client";

import React from "react";
import { Bell, Palette, HardDrive, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface SettingsDoorTileRowProps {
  onOpenReminders: () => void;
  onOpenTheme: () => void;
  onOpenBackup: () => void;
  onOpenDiagnostics: () => void;
  storageKb?: number;
  className?: string;
}

export function SettingsDoorTileRow({
  onOpenReminders,
  onOpenTheme,
  onOpenBackup,
  onOpenDiagnostics,
  storageKb = 0,
  className,
}: SettingsDoorTileRowProps) {
  const tiles = [
    {
      id: "reminders",
      label: "Alerts",
      value: "Push",
      icon: Bell,
      iconColor: "text-amber-500 dark:text-amber-400",
      bgClass: "hover:border-amber-500/50",
      onClick: onOpenReminders,
      title: "Open Push Notifications & Reminder Schedules",
    },
    {
      id: "theme",
      label: "Theme",
      value: "Style",
      icon: Palette,
      iconColor: "text-purple-500 dark:text-purple-400",
      bgClass: "hover:border-purple-500/50",
      onClick: onOpenTheme,
      title: "Configure Theme & Color Palette",
    },
    {
      id: "backup",
      label: "Backup",
      value: storageKb > 0 ? `${Math.round(storageKb)}KB` : "Export",
      icon: HardDrive,
      iconColor: "text-emerald-500 dark:text-emerald-400",
      bgClass: "hover:border-emerald-500/50",
      onClick: onOpenBackup,
      title: "Export Encrypted Vault Backup (AES-256)",
    },
    {
      id: "diagnostics",
      label: "Health",
      value: "Status",
      icon: ShieldCheck,
      iconColor: "text-sky-500 dark:text-sky-400",
      bgClass: "hover:border-sky-500/50",
      onClick: onOpenDiagnostics,
      title: "Open In-App System Diagnostics & Telemetry",
    },
  ];

  return (
    <div className={cn("grid grid-cols-4 gap-2 select-none", className)}>
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <button
            key={tile.id}
            type="button"
            onClick={() => {
              soundFX.playPop();
              soundFX.vibrate(15);
              tile.onClick();
            }}
            title={tile.title}
            className={cn(
              "group relative flex flex-col items-center justify-between p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs hover:shadow-sm active:scale-95 transition-all text-center cursor-pointer min-h-[68px] sm:min-h-[76px]",
              tile.bgClass
            )}
          >
            <div className="flex items-center justify-center size-7 sm:size-8 rounded-xl bg-secondary group-hover:scale-105 transition-transform">
              <Icon className={cn("size-4 stroke-[2.2]", tile.iconColor)} />
            </div>
            <div className="mt-1 w-full min-w-0">
              <p className="text-[10px] sm:text-[11px] font-heading font-black text-[#161514] dark:text-[#FAF8F5] truncate leading-tight">
                {tile.label}
              </p>
              <p className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground truncate leading-tight mt-0.5">
                {tile.value}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
