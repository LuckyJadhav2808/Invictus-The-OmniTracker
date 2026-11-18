"use client";

import React from "react";
import { type Transaction, type Category } from "@/types";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { CategoryIcon } from "@/components/money/MoneyQuickActionsAndCards";
import { soundFX } from "@/components/shared/SoundFX";
import { Copy, Edit2, Trash2 } from "lucide-react";

interface BelanjeTransactionRowProps {
  tx: Transaction;
  category?: Category;
  currencySymbol: string;
  onInspect?: (tx: Transaction) => void;
  onEdit?: (tx: Transaction) => void;
  onDuplicate?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
  showQuickActions?: boolean;
  compact?: boolean;
}

export function getCategorySquircleStyle(categoryName: string = "", isIncome: boolean = false): {
  bg: string;
  border: string;
  text: string;
} {
  if (isIncome) {
    return {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-200 dark:border-emerald-800",
      text: "text-[#047857] dark:text-[#03D26F]",
    };
  }

  const name = categoryName.toLowerCase();
  if (name.includes("food") || name.includes("dining") || name.includes("snack") || name.includes("grocer") || name.includes("chai")) {
    return {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-700 dark:text-amber-300",
    };
  }
  if (name.includes("transport") || name.includes("metro") || name.includes("auto") || name.includes("fuel") || name.includes("cab")) {
    return {
      bg: "bg-sky-50 dark:bg-sky-950/40",
      border: "border-sky-200 dark:border-sky-800",
      text: "text-sky-700 dark:text-sky-300",
    };
  }
  if (name.includes("bill") || name.includes("rent") || name.includes("util") || name.includes("recharge")) {
    return {
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-700 dark:text-blue-300",
    };
  }
  if (name.includes("study") || name.includes("book") || name.includes("edu") || name.includes("course") || name.includes("print")) {
    return {
      bg: "bg-purple-50 dark:bg-purple-950/40",
      border: "border-purple-200 dark:border-purple-800",
      text: "text-purple-700 dark:text-purple-300",
    };
  }
  if (name.includes("fun") || name.includes("movie") || name.includes("game") || name.includes("sub") || name.includes("entertain")) {
    return {
      bg: "bg-pink-50 dark:bg-pink-950/40",
      border: "border-pink-200 dark:border-pink-800",
      text: "text-pink-700 dark:text-pink-300",
    };
  }
  if (name.includes("health") || name.includes("gym") || name.includes("med") || name.includes("fit")) {
    return {
      bg: "bg-rose-50 dark:bg-rose-950/40",
      border: "border-rose-200 dark:border-rose-800",
      text: "text-rose-700 dark:text-rose-300",
    };
  }

  return {
    bg: "bg-stone-100 dark:bg-[#252321]",
    border: "border-stone-200 dark:border-[#383531]",
    text: "text-[#161514] dark:text-[#FAF8F5]",
  };
}

export function BelanjeTransactionRow({
  tx,
  category,
  currencySymbol,
  onInspect,
  onEdit,
  onDuplicate,
  onDelete,
  showQuickActions = true,
  compact = false,
}: BelanjeTransactionRowProps) {
  const isIncome = tx.type === "income";
  const squircle = getCategorySquircleStyle(category?.name || tx.note || "", isIncome);

  // Format timestamp / date
  const formattedTimeOrDate = React.useMemo(() => {
    if (!tx.date) return "";
    try {
      const parsed = parseISO(tx.date);
      if (isValid(parsed)) {
        return format(parsed, "MMM d");
      }
    } catch {}
    return tx.date;
  }, [tx.date]);

  // Account label (Main Account vs Cash Till)
  const isCash = tx.paymentMethod?.toLowerCase() === "cash";
  const accountLabel = isCash ? "Cash Till" : "Main Account";

  const handleRowClick = () => {
    soundFX.playPop();
    onInspect?.(tx);
  };

  return (
    <div
      onClick={handleRowClick}
      className={cn(
        "group relative bg-white dark:bg-[#1C1A18] hover:bg-[#FAF8F5] dark:hover:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] rounded-2xl transition-all duration-150 cursor-pointer active:scale-[0.99] flex items-center justify-between gap-3 shadow-xs",
        compact ? "p-2.5 sm:p-3" : "p-3 sm:p-3.5"
      )}
    >
      {/* Left: 40px Squircle Category Badge & Metadata */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "rounded-2xl border flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105",
            compact ? "size-9" : "size-10",
            squircle.bg,
            squircle.border,
            squircle.text
          )}
        >
          <CategoryIcon name={category?.icon} className={compact ? "size-4 stroke-[2]" : "size-5 stroke-[2]"} />
        </div>

        <div className="min-w-0 space-y-0.5">
          {/* Merchant / Note Heading */}
          <h4 className="text-xs sm:text-[13.5px] font-heading font-black text-[#161514] dark:text-[#FAF8F5] truncate leading-tight">
            {tx.note || category?.name || "Transaction"}
          </h4>

          {/* Subtext: Account • Time • Category Tag */}
          <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] leading-none">
            <span className="font-semibold text-[#161514] dark:text-[#FAF8F5]">{accountLabel}</span>
            <span>•</span>
            <span>{formattedTimeOrDate}</span>
            {category?.name && tx.note && tx.note.toLowerCase() !== category.name.toLowerCase() && (
              <>
                <span>•</span>
                <span className="truncate max-w-[100px] text-[10px] px-1 py-0.2 rounded bg-stone-100 dark:bg-[#252321] border border-stone-200 dark:border-[#383531]">
                  {category.name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Tabular Amount & Quick Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <span
          className={cn(
            "font-mono font-black tabular-nums tracking-tight text-right",
            compact ? "text-xs sm:text-sm" : "text-sm sm:text-[15px]",
            isIncome ? "text-[#047857] dark:text-[#03D26F]" : "text-rose-600 dark:text-rose-400"
          )}
        >
          {isIncome ? "+" : "-"}{currencySymbol}{Math.abs(Number(tx.amount || 0)).toLocaleString()}
        </span>

        {/* Quick Duplicate / Edit / Delete buttons on hover / desktop */}
        {showQuickActions && (
          <div
            className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {onDuplicate && (
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  onDuplicate(tx);
                }}
                className="p-1 rounded-md bg-white dark:bg-[#252321] hover:bg-[#F1EFEA] dark:hover:bg-[#2e2b28] border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] transition-colors cursor-pointer"
                title="1-Click Duplicate"
              >
                <Copy className="size-3 stroke-[2]" />
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  onEdit(tx);
                }}
                className="p-1 rounded-md bg-white dark:bg-[#252321] hover:bg-[#F1EFEA] dark:hover:bg-[#2e2b28] border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] transition-colors cursor-pointer"
                title="Edit Transaction"
              >
                <Edit2 className="size-3 stroke-[2]" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  onDelete(tx.id);
                }}
                className="p-1 rounded-md bg-white dark:bg-[#252321] hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-[#E8E5DF] dark:border-[#383531] text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                title="Delete Transaction"
              >
                <Trash2 className="size-3 stroke-[2]" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
