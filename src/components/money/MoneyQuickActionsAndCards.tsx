"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Plus, ArrowRightLeft, Send, Edit3, Trash2, Camera, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export const renderCategoryEmoji = (icon: string | undefined): string => {
  if (!icon) return "💳";
  const map: Record<string, string> = {
    Briefcase: "💼",
    Coffee: "☕",
    Home: "🏠",
    Compass: "🧭",
    DollarSign: "💲",
    Smile: "😊",
    Wallet: "💳",
    ShoppingBag: "🛍️",
    Utensils: "🍽️",
    Car: "🚗",
    Zap: "⚡",
    Droplet: "💧",
    Gift: "🎁",
    Film: "🎬",
    Book: "📚",
    Heart: "❤️",
  };
  return map[icon] || icon;
};

export interface CategoryCardItem {
  id: string;
  name: string;
  amount: number;
  color: string;
  icon: string;
  type?: string;
  monthlyBudget?: number;
}

interface MoneyQuickActionsProps {
  mainBalance?: number;
  currencySymbol: string;
  categories: CategoryCardItem[];
  selectedCategoryId?: string;
  onSelectCategory?: (catId: string) => void;
  onAddTransaction?: () => void;
  onMoveMoney?: () => void;
  onSendMoney?: () => void;
  onBulkAddExpense?: () => void;
  onViewDetails?: () => void;
  onAddCategory?: () => void;
  onEditCategory?: (cat: any) => void;
  onDeleteCategory?: (catId: string) => void;
}

export function MoneyQuickActionsAndCards({
  mainBalance,
  currencySymbol,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddTransaction,
  onMoveMoney,
  onSendMoney,
  onBulkAddExpense,
  onViewDetails,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: MoneyQuickActionsProps) {
  const [isHideBalance, setIsHideBalance] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("invictus_hide_balance");
      if (saved === "true") setIsHideBalance(true);
    } catch {}
  }, []);

  const toggleHideBalance = () => {
    soundFX.playClick();
    const next = !isHideBalance;
    setIsHideBalance(next);
    try {
      localStorage.setItem("invictus_hide_balance", String(next));
    } catch {}
  };

  const getCategoryColors = (cat: CategoryCardItem, idx: number) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      orange: { bg: "#FF6B00", text: "#FFFFFF" },
      amber: { bg: "#F59E0B", text: "#161514" },
      mint: { bg: "#03D26F", text: "#161514" },
      green: { bg: "#03D26F", text: "#161514" },
      emerald: { bg: "#03D26F", text: "#161514" },
      lavender: { bg: "#A78BFA", text: "#161514" },
      purple: { bg: "#A78BFA", text: "#161514" },
      coral: { bg: "#FF5A5F", text: "#FFFFFF" },
      indigo: { bg: "#6366F1", text: "#FFFFFF" },
      blue: { bg: "#6366F1", text: "#FFFFFF" },
      rose: { bg: "#EC4899", text: "#FFFFFF" },
      pink: { bg: "#EC4899", text: "#FFFFFF" },
      cyan: { bg: "#06B6D4", text: "#FFFFFF" },
      sky: { bg: "#06B6D4", text: "#FFFFFF" },
      lime: { bg: "#CEF431", text: "#161514" },
      yellow: { bg: "#F59E0B", text: "#161514" },
    };

    if (cat.color && colorMap[cat.color.toLowerCase()]) {
      return colorMap[cat.color.toLowerCase()];
    }

    const fallbacks = [
      { bg: "#FF6B00", text: "#FFFFFF" },
      { bg: "#F59E0B", text: "#161514" },
      { bg: "#03D26F", text: "#161514" },
      { bg: "#A78BFA", text: "#161514" },
      { bg: "#FF5A5F", text: "#FFFFFF" },
      { bg: "#6366F1", text: "#FFFFFF" },
      { bg: "#EC4899", text: "#FFFFFF" },
      { bg: "#06B6D4", text: "#FFFFFF" },
    ];
    return fallbacks[idx % fallbacks.length];
  };

  return (
    <div className="space-y-3">
      {/* Category Wallets Header with Move, Send, Bulk, New Category & Hide Balance Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#161514] flex items-center gap-1.5 font-heading">
            <span>💳</span>
            <span>Category Wallets</span>
          </h4>
          <span className="text-[10px] font-black text-[#161514] bg-white px-2.5 py-0.5 rounded-lg border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
            {categories.length} {categories.length === 1 ? "wallet" : "wallets"}
          </span>

          {/* Hide/Show Balance Toggle */}
          <button
            onClick={toggleHideBalance}
            className="p-1 rounded-lg bg-white hover:bg-[#FAF8F5] text-[#161514] border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514] cursor-pointer transition-all hover:scale-105 active:scale-95"
            title={isHideBalance ? "Show balances" : "Hide balances"}
          >
            {isHideBalance ? <EyeOff className="h-3 w-3 stroke-[2.5]" /> : <Eye className="h-3 w-3 stroke-[2.5]" />}
          </button>

          {selectedCategoryId && selectedCategoryId !== "all" && (
            <button
              onClick={() => onSelectCategory?.("all")}
              className="text-[10px] font-black text-[#161514] bg-[#CEF431] px-2 py-0.5 rounded-lg border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514] cursor-pointer hover:bg-rose-200"
              title="Clear category filter"
            >
              Filtered ✕
            </button>
          )}
        </div>

        {/* Action Buttons: Move Money, Send Money, Bulk Scan & New Category */}
        <div className="flex items-center gap-2 flex-wrap">
          {onMoveMoney && (
            <button
              onClick={onMoveMoney}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#161514] text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shrink-0"
              title="Transfer funds between category wallets"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Move</span>
            </button>
          )}

          {onSendMoney && (
            <button
              onClick={onSendMoney}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#03D26F] hover:bg-[#02B861] text-[#161514] text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shrink-0"
              title="Record an instant payout or payment to a recipient"
            >
              <Send className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Send</span>
            </button>
          )}

          {onBulkAddExpense && (
            <button
              onClick={onBulkAddExpense}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#161514] text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shrink-0"
              title="Bulk Expense Logger & Offline OCR Scanner"
            >
              <Camera className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Bulk</span>
            </button>
          )}

          {onAddCategory && (
            <button
              onClick={onAddCategory}
              className="text-xs font-black text-[#161514] bg-[#FACC15] hover:bg-[#EAB308] px-3 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] whitespace-nowrap shrink-0 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none uppercase tracking-wider"
              title="Create new category envelope"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>+ Category</span>
            </button>
          )}
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-[2.5px] border-[#161514] text-center space-y-3 shadow-[4px_4px_0px_0px_#161514]">
          <div className="h-12 w-12 rounded-2xl bg-[#FED7AA] text-[#161514] border-2 border-[#161514] flex items-center justify-center mx-auto text-xl font-black shadow-[2px_2px_0px_0px_#161514]">
            💳
          </div>
          <div>
            <h4 className="text-sm font-black text-[#161514] font-heading uppercase tracking-wide">No Category Wallets Configured</h4>
            <p className="text-xs text-[#161514]/70 font-semibold max-w-sm mx-auto mt-1">
              Organize your ledger with category wallets like Groceries, Transport, Bills, or Dining.
            </p>
          </div>
          {onAddCategory && (
            <button
              onClick={onAddCategory}
              className="px-5 py-2.5 rounded-2xl bg-[#FACC15] hover:bg-[#EAB308] text-[#161514] text-xs font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Create Your First Wallet</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-3 pt-1">
          {categories.map((cat, idx) => {
            const theme = getCategoryColors(cat, idx);
            const isSelected = selectedCategoryId === cat.id;
            const budgetCap = cat.monthlyBudget || 0;
            const percentSpent = budgetCap > 0 ? Math.min(100, Math.round((cat.amount / budgetCap) * 100)) : 0;
            const isOverBudget = budgetCap > 0 && cat.amount > budgetCap;

            return (
              <div
                key={cat.id || idx}
                onClick={() => {
                  soundFX.playClick();
                  onSelectCategory?.(isSelected ? "all" : cat.id);
                }}
                className={cn(
                  "w-[230px] sm:w-[260px] shrink-0 snap-start relative group cursor-pointer transition-all duration-200 ease-out hover:-translate-y-1",
                  isSelected && "scale-[1.03]"
                )}
              >
                {/* Folder Top Tab */}
                <div
                  style={{ backgroundColor: theme.bg, color: theme.text }}
                  className={cn(
                    "w-32 h-6 rounded-t-xl ml-4 text-[9px] font-black uppercase px-2.5 flex items-center justify-between border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]",
                    isSelected && "border-b-0 ring-2 ring-black"
                  )}
                >
                  <span className="truncate flex items-center gap-1">
                    <span>{renderCategoryEmoji(cat.icon)}</span>
                    <span className="truncate tracking-wider">{cat.name.slice(0, 10)}</span>
                  </span>
                  <div
                    className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {onEditCategory && (
                      <button
                        onClick={() => onEditCategory(cat)}
                        className="text-current hover:scale-110 p-0.5 cursor-pointer border-none bg-transparent"
                        title="Edit wallet"
                      >
                        <Edit3 className="h-2.5 w-2.5 stroke-[2.5]" />
                      </button>
                    )}
                    {onDeleteCategory && (
                      <button
                        onClick={() => onDeleteCategory(cat.id)}
                        className="text-current hover:scale-110 p-0.5 cursor-pointer border-none bg-transparent"
                        title="Delete wallet"
                      >
                        <Trash2 className="h-2.5 w-2.5 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Card Body */}
                <div
                  style={{ backgroundColor: theme.bg, color: theme.text }}
                  className={cn(
                    "rounded-2xl rounded-tl-none p-3.5 sm:p-4 border-2 border-[#161514] space-y-2.5 transition-all duration-200 shadow-[3.5px_3.5px_0px_0px_#161514] group-hover:shadow-[5px_5px_0px_0px_#161514]",
                    isSelected && "ring-2 ring-black shadow-[5px_5px_0px_0px_#161514]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{renderCategoryEmoji(cat.icon)}</span>
                      <span className="text-xs font-black tracking-wide block truncate opacity-90 font-heading">
                        {cat.name}
                      </span>
                    </div>
                    {isSelected ? (
                      <span className="text-[9px] font-black uppercase bg-[#161514] text-white px-2 py-0.5 rounded-lg border border-[#161514] flex items-center gap-1">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase bg-black/15 px-2 py-0.5 rounded-lg border border-[#161514]">
                        {cat.type || "Expense"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-end justify-between pt-0.5">
                    <div>
                      <span className="text-[8px] sm:text-[9px] font-black uppercase opacity-75 block tracking-wider">
                        Spent Balance
                      </span>
                      <span className="text-lg sm:text-xl font-black block tracking-tight font-heading">
                        {isHideBalance
                          ? "••••••"
                          : `${currencySymbol}${cat.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
                      </span>
                    </div>
                    {budgetCap > 0 && (
                      <div className="text-right">
                        <span className="text-[8px] sm:text-[9px] font-black uppercase opacity-75 block tracking-wider">
                          Budget Cap
                        </span>
                        <span className="text-xs font-black opacity-90 font-heading">
                          {currencySymbol}{budgetCap.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Meter if Budget Cap exists */}
                  {budgetCap > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden border border-[#161514]/40">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            isOverBudget ? "bg-red-500" : percentSpent > 80 ? "bg-amber-400" : "bg-[#161514]"
                          )}
                          style={{ width: `${percentSpent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[8px] font-black opacity-80 uppercase tracking-wider">
                        <span>{percentSpent}% Used</span>
                        {isOverBudget && <span className="text-red-700 font-extrabold">Exceeded!</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
