"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { CategoryIcon, getCategoryAccent } from "@/components/money/MoneyQuickActionsAndCards";
import {
  Plus,
  ArrowRightLeft,
  Send,
  Edit2,
  Trash2,
  Layers,
} from "lucide-react";

export interface CategoryRailItem {
  id: string;
  name: string;
  amount: number;
  color?: string;
  icon?: string;
  type?: string;
  monthlyBudget?: number;
}

interface CategoryChipFilterRailProps {
  categories: CategoryRailItem[];
  selectedCategoryId: string;
  currencySymbol: string;
  onSelectCategory: (catId: string) => void;
  onAddCategory?: () => void;
  onEditCategory?: (cat: any) => void;
  onDeleteCategory?: (catId: string) => void;
  onMoveMoney?: () => void;
  onSendMoney?: () => void;
  onBulkAddExpense?: () => void;
  hideHeader?: boolean;
  hideInlineActions?: boolean;
}

export function CategoryChipFilterRail({
  categories,
  selectedCategoryId,
  currencySymbol,
  onSelectCategory,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onMoveMoney,
  onSendMoney,
  onBulkAddExpense,
  hideHeader = false,
  hideInlineActions = false,
}: CategoryChipFilterRailProps) {
  const [scrollContainerRef] = useAutoAnimate<HTMLDivElement>({ duration: 150, easing: "ease-out" });

  return (
    <div className={cn("space-y-1.5", !hideHeader && "bg-white dark:bg-[#1C1A18] p-3 sm:p-3.5 rounded-2xl border border-[#E8E5DF] dark:border-[#383531] shadow-xs")}>
      {/* ─── TOP UTILITY DOCK (Optional when parent already has action bar) ─── */}
      {!hideHeader && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight flex items-center gap-1.5">
              <Layers className="size-3.5 stroke-[2] text-[#6B6B6B] dark:text-[#A8A29E]" />
              <span>Category Envelopes</span>
            </span>
            <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
              ({categories.length})
            </span>
          </div>

          {/* Action Buttons: Move Money | Send Money | Bulk OCR | + Category */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {onMoveMoney && (
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  onMoveMoney();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#F1EFEA] dark:hover:bg-[#2E2B28] text-[#161514] dark:text-[#FAF8F5] text-[11px] font-heading font-bold border border-[#E8E5DF] dark:border-[#383531] shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                title="Move Money between category envelopes"
              >
                <ArrowRightLeft className="size-3 stroke-[2]" />
                <span>Move</span>
              </button>
            )}

            {onSendMoney && (
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  onSendMoney();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#F1EFEA] dark:hover:bg-[#2E2B28] text-[#161514] dark:text-[#FAF8F5] text-[11px] font-heading font-bold border border-[#E8E5DF] dark:border-[#383531] shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                title="Send Money payout"
              >
                <Send className="size-3 stroke-[2]" />
                <span>Send</span>
              </button>
            )}

            {onAddCategory && (
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  onAddCategory();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#161514] dark:bg-[#CEF431] hover:bg-[#2A2826] dark:hover:bg-[#d6f64d] text-white dark:text-[#161514] text-[11px] font-heading font-bold border border-[#161514] dark:border-[#CEF431] shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                title="Create new category envelope"
              >
                <Plus className="size-3 stroke-[2.5]" />
                <span>Envelope</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── SCROLLABLE HORIZONTAL TAG/CHIP RAIL (Belanje Benchmark) ─── */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-0.5 touch-pan-x"
      >
        {/* "All Wallets" Primary Filter Pill */}
        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            onSelectCategory("all");
          }}
          className={cn(
            "px-3 py-1.5 rounded-xl text-xs font-heading font-black shrink-0 transition-all cursor-pointer border flex items-center gap-1.5 min-h-[32px] shadow-xs active:scale-95",
            !selectedCategoryId || selectedCategoryId === "all"
              ? "bg-[#161514] text-white dark:bg-[#CEF431] dark:text-[#161514] border-[#161514] dark:border-[#CEF431]"
              : "bg-[#FAF8F5] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#383531] hover:bg-[#F1EFEA] dark:hover:bg-[#2e2b28]"
          )}
        >
          <span>All Envelopes</span>
          <span className="text-[10px] font-mono opacity-80">({categories.length})</span>
        </button>

        {/* Individual Category Envelope Filter Chips */}
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const accentColor = getCategoryAccent(cat);
          const budgetCap = cat.monthlyBudget || 0;
          const isOverBudget = budgetCap > 0 && cat.amount > budgetCap;

          return (
            <div key={cat.id} className="relative flex items-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onSelectCategory(isSelected ? "all" : cat.id);
                }}
                className={cn(
                  "px-2.5 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer border flex items-center gap-1.5 min-h-[32px] shadow-xs active:scale-95",
                  isSelected
                    ? "bg-[#161514] text-white dark:bg-[#CEF431] dark:text-[#161514] border-[#161514] dark:border-[#CEF431] font-heading font-black"
                    : "bg-[#FAF8F5] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#383531] hover:bg-[#F1EFEA] dark:hover:bg-[#2e2b28]"
                )}
              >
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: accentColor }}
                />
                <CategoryIcon name={cat.icon} className="size-3.5 stroke-[2] shrink-0" />
                <span className="truncate max-w-[110px]">{cat.name}</span>
                <span
                  className={cn(
                    "text-[10px] font-mono tabular-nums opacity-90",
                    isOverBudget && !isSelected ? "text-rose-600 dark:text-rose-400 font-bold" : ""
                  )}
                >
                  {currencySymbol}{Math.round(cat.amount).toLocaleString()}
                </span>
              </button>

              {/* Contextual Edit / Delete button when chip is selected (only when inline actions not hidden) */}
              {!hideInlineActions && isSelected && (onEditCategory || onDeleteCategory) && (
                <div className="flex items-center gap-0.5 ml-1">
                  {onEditCategory && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFX.playPop();
                        onEditCategory(cat);
                      }}
                      className="size-6 rounded-lg bg-white dark:bg-[#252321] hover:bg-stone-100 dark:hover:bg-[#2e2b28] border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] flex items-center justify-center cursor-pointer transition-colors"
                      title={`Edit ${cat.name}`}
                    >
                      <Edit2 className="size-2.5 stroke-[2]" />
                    </button>
                  )}
                  {onDeleteCategory && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFX.playPop();
                        onDeleteCategory(cat.id);
                      }}
                      className="size-6 rounded-lg bg-white dark:bg-[#252321] hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-[#E8E5DF] dark:border-[#383531] text-rose-600 dark:text-rose-400 flex items-center justify-center cursor-pointer transition-colors"
                      title={`Delete ${cat.name}`}
                    >
                      <Trash2 className="size-2.5 stroke-[2]" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* "+ New Envelope" Quick Chip (only when inline actions not hidden) */}
        {!hideInlineActions && onAddCategory && (
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              onAddCategory();
            }}
            className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5] bg-transparent hover:bg-[#FAF8F5] dark:hover:bg-[#252321] border border-dashed border-[#E8E5DF] dark:border-[#383531] shrink-0 transition-colors cursor-pointer flex items-center gap-1 min-h-[32px]"
          >
            <Plus className="size-3 stroke-[2]" />
            <span>New</span>
          </button>
        )}
      </div>
    </div>
  );
}
