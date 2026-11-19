"use client";

import React from "react";
import { SlidersHorizontal, ArrowRightLeft, Sparkles, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface MoneyDoorTileRowProps {
  monthlyBudget?: number;
  currencySymbol?: string;
  onOpenAllowances: () => void;
  onMoveMoney: () => void;
  onOpenTemplates: () => void;
  onOpenExport: () => void;
  className?: string;
}

export function MoneyDoorTileRow({
  monthlyBudget,
  currencySymbol = "₹",
  onOpenAllowances,
  onMoveMoney,
  onOpenTemplates,
  onOpenExport,
  className,
}: MoneyDoorTileRowProps) {
  const tiles = [
    {
      id: "allowances",
      label: "Limits",
      value: monthlyBudget ? `${currencySymbol}${Math.round(monthlyBudget).toLocaleString()}` : "Allowances",
      icon: SlidersHorizontal,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgClass: "hover:border-emerald-500/50",
      onClick: onOpenAllowances,
      title: "Configure Monthly & Daily Budget Limits",
    },
    {
      id: "transfer",
      label: "Transfer",
      value: "Envelopes",
      icon: ArrowRightLeft,
      iconColor: "text-indigo-600 dark:text-indigo-400",
      bgClass: "hover:border-indigo-500/50",
      onClick: onMoveMoney,
      title: "Move Funds Between Envelopes",
    },
    {
      id: "templates",
      label: "Packs",
      value: "Templates",
      icon: Sparkles,
      iconColor: "text-amber-600 dark:text-amber-400",
      bgClass: "hover:border-amber-500/50",
      onClick: onOpenTemplates,
      title: "Explore Curated Budget Template Packs",
    },
    {
      id: "export",
      label: "Report",
      value: "PDF / CSV",
      icon: FileDown,
      iconColor: "text-sky-600 dark:text-sky-400",
      bgClass: "hover:border-sky-500/50",
      onClick: onOpenExport,
      title: "Export Ledger Statement",
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-4 gap-1.5 sm:gap-2 w-full select-none",
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
              "py-2 px-1.5 rounded-xl bg-card border border-border flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 shadow-2xs group min-h-[58px]",
              t.bgClass
            )}
            title={t.title}
          >
            <div className="flex items-center gap-1">
              <Icon className={cn("size-3.5 stroke-[2]", t.iconColor)} />
              <span className="font-heading font-black text-[11px] text-foreground tracking-tight">
                {t.label}
              </span>
            </div>
            <span className="text-[10px] font-mono font-medium text-muted-foreground truncate w-full mt-0.5">
              {t.value}
            </span>
          </button>
        );
      })}
    </div>
  );
}
