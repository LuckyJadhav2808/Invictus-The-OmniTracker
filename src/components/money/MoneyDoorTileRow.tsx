"use client";

import React from "react";
import { ReceiptText, BarChart2, Sparkles, Calculator, PiggyBank, TrendingUp, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface MoneyDoorTileRowProps {
  monthlyBudget?: number;
  activeIouCount?: number;
  currencySymbol?: string;
  onOpenLedger?: () => void;
  onOpenAnalytics?: () => void;
  onOpenReceipts?: () => void;
  onOpenCalc?: () => void;
  // Legacy / fallback props
  onOpenBudgets?: () => void;
  onOpenIncome?: () => void;
  onOpenVault?: () => void;
  onOpenIous?: () => void;
  onOpenAllowances?: () => void;
  onMoveMoney?: () => void;
  onOpenTemplates?: () => void;
  onOpenExport?: () => void;
  className?: string;
}

export function MoneyDoorTileRow({
  monthlyBudget,
  activeIouCount = 0,
  currencySymbol = "₹",
  onOpenLedger,
  onOpenAnalytics,
  onOpenReceipts,
  onOpenCalc,
  onOpenBudgets,
  onOpenIncome,
  onOpenVault,
  onOpenIous,
  onOpenAllowances,
  onMoveMoney,
  onOpenTemplates,
  onOpenExport,
  className,
}: MoneyDoorTileRowProps) {
  const tiles = [
    {
      id: "ledger",
      label: "Ledger",
      value: "All Records",
      icon: ReceiptText,
      iconColor: "text-sky-600 dark:text-sky-400",
      bgClass: "hover:border-sky-500/50",
      onClick: onOpenLedger || onOpenExport || (() => {}),
      title: "Full Transaction Ledger & Search (L2 Subpage)",
    },
    {
      id: "analytics",
      label: "Analytics",
      value: "Spend Flow",
      icon: BarChart2,
      iconColor: "text-purple-600 dark:text-purple-400",
      bgClass: "hover:border-purple-500/50",
      onClick: onOpenAnalytics || onOpenBudgets || (() => {}),
      title: "Spending Breakdown & Visual Analytics (L2 Subpage)",
    },
    {
      id: "receipts",
      label: "Receipts",
      value: "Smart OCR",
      icon: Sparkles,
      iconColor: "text-amber-600 dark:text-amber-400",
      bgClass: "hover:border-amber-500/50",
      onClick: onOpenReceipts || onOpenTemplates || (() => {}),
      title: "Scan Receipt Image or Batch Log Expenses (Sheet)",
    },
    {
      id: "calc",
      label: "Calc",
      value: "Split & Math",
      icon: Calculator,
      iconColor: "text-emerald-600 dark:text-[#03D26F]",
      bgClass: "hover:border-[#03D26F]/50",
      onClick: onOpenCalc || onOpenIncome || onOpenAllowances || (() => {}),
      title: "Open Tactile Neobrutalist Split Calculator (Sheet)",
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
            title={t.title}
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
