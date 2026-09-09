"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Plus, ArrowRightLeft, Send, MoreHorizontal, Wallet, Edit3, Trash2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

interface CategoryCardItem {
  id: string;
  name: string;
  amount: number;
  color: string;
  icon: string;
  type?: string;
  monthlyBudget?: number;
}

interface MoneyQuickActionsProps {
  mainBalance: number;
  currencySymbol: string;
  categories: CategoryCardItem[];
  onAddTransaction: () => void;
  onBulkAddExpense?: () => void;
  onMoveMoney?: () => void;
  onSendMoney?: () => void;
  onViewDetails?: () => void;
  onAddCategory?: () => void;
  onEditCategory?: (cat: any) => void;
  onDeleteCategory?: (catId: string) => void;
}

export function MoneyQuickActionsAndCards({
  mainBalance,
  currencySymbol,
  categories,
  onAddTransaction,
  onBulkAddExpense,
  onMoveMoney,
  onSendMoney,
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
    const next = !isHideBalance;
    setIsHideBalance(next);
    try {
      localStorage.setItem("invictus_hide_balance", String(next));
    } catch {}
  };

  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // Use user's real category items
  const displayCategories = categories;
  const totalSpending = displayCategories.reduce((sum, c) => sum + c.amount, 0);

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
      {/* Category Wallets Header with Move, Send and New Category Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#161514] flex items-center gap-1.5 font-heading">
            <span>💳</span>
            <span>Category Wallets & Envelopes</span>
          </h4>
          <span className="text-[10px] font-black text-[#161514] bg-white px-2.5 py-0.5 rounded-lg border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
            {displayCategories.length} {displayCategories.length === 1 ? "envelope" : "envelopes"}
          </span>
        </div>

        {/* Action Buttons: Move Money, Send Money, New Category */}
        <div className="flex items-center gap-2 flex-wrap">
          {onMoveMoney && (
            <button
              onClick={onMoveMoney}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FFF9EA] text-[#161514] text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shrink-0"
              title="Transfer funds between categories"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Move</span>
            </button>
          )}
          {onSendMoney && (
            <button
              onClick={onSendMoney}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FFF9EA] text-[#161514] text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shrink-0"
              title="Record a payment to a recipient"
            >
              <Send className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Send</span>
            </button>
          )}
          {onBulkAddExpense && (
            <button
              onClick={onBulkAddExpense}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#CEF431] hover:bg-[#b8dd24] text-[#161514] text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shrink-0"
              title="Bulk Expense Logger & Offline OCR Scanner"
            >
              <Camera className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Bulk / Scan</span>
            </button>
          )}
          {onAddCategory && (
            <button
              onClick={onAddCategory}
              className="text-xs font-black text-[#161514] bg-[#FACC15] hover:bg-[#EAB308] px-3.5 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] whitespace-nowrap shrink-0 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none uppercase tracking-wider"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>New Category</span>
            </button>
          )}
        </div>
      </div>

      {displayCategories.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border-[2.5px] border-[#161514] text-center space-y-3 shadow-[4px_4px_0px_0px_#161514]">
          <div className="h-12 w-12 rounded-2xl bg-[#FED7AA] text-[#161514] border-2 border-[#161514] flex items-center justify-center mx-auto text-xl font-black shadow-[2px_2px_0px_0px_#161514]">
            💳
          </div>
          <div>
            <h4 className="text-sm font-black text-[#161514] font-heading uppercase tracking-wide">No Expense Categories Active</h4>
            <p className="text-xs text-[#161514]/70 font-semibold max-w-sm mx-auto mt-1">
              Organize your ledger with category wallets like Groceries, Transport, or Bills. Tap below to create your first category!
            </p>
          </div>
          {onAddCategory && (
            <button
              onClick={onAddCategory}
              className="px-5 py-2.5 rounded-2xl bg-[#FACC15] hover:bg-[#EAB308] text-[#161514] text-xs font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Create Your First Category</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-3 pt-1">
          {displayCategories.map((cat, idx) => {
            const theme = getCategoryColors(cat, idx);
            const isSelected = activeCardId === cat.id;
            return (
              <div
                key={cat.id || idx}
                onClick={() => setActiveCardId(isSelected ? null : cat.id)}
                style={{ zIndex: isSelected ? 40 : idx + 1 }}
                className={cn(
                  "w-[240px] sm:w-[280px] shrink-0 snap-start relative group cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1",
                  isSelected && "scale-[1.02]"
                )}
              >
                {/* Folder Top Tab */}
                <div
                  style={{ backgroundColor: theme.bg, color: theme.text }}
                  className="w-32 h-6 rounded-t-xl ml-4 text-[9px] font-black uppercase px-2.5 flex items-center justify-between border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]"
                >
                  <span className="truncate flex items-center gap-1">
                    <span>{renderCategoryEmoji(cat.icon)}</span>
                    <span className="truncate tracking-wider">{cat.name.slice(0, 10)}</span>
                  </span>
                  <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    {onEditCategory && (
                      <button
                        onClick={() => onEditCategory(cat)}
                        className="text-current hover:scale-110 p-0.5 cursor-pointer border-none bg-transparent"
                        title="Edit category"
                      >
                        <Edit3 className="h-2.5 w-2.5 stroke-[2.5]" />
                      </button>
                    )}
                    {onDeleteCategory && (
                      <button
                        onClick={() => onDeleteCategory(cat.id)}
                        className="text-current hover:scale-110 p-0.5 cursor-pointer border-none bg-transparent"
                        title="Delete category"
                      >
                        <Trash2 className="h-2.5 w-2.5 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Card Body */}
                <div
                  style={{ backgroundColor: theme.bg, color: theme.text }}
                  className="rounded-2xl rounded-tl-none p-4 sm:p-5 border-2 border-[#161514] space-y-3 transition-all duration-200 shadow-[4px_4px_0px_0px_#161514] group-hover:shadow-[5px_5px_0px_0px_#161514]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{renderCategoryEmoji(cat.icon)}</span>
                      <span className="text-xs font-black tracking-wide block truncate opacity-90 font-heading">
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-black/15 px-2.5 py-0.5 rounded-lg border-2 border-[#161514]">
                      {cat.type || "Expense"}
                    </span>
                  </div>

                  <div className="flex items-end justify-between pt-1">
                    <div>
                      <span className="text-[9px] font-black uppercase opacity-75 block tracking-wider">Spent Balance</span>
                      <span className="text-xl sm:text-2xl font-black block tracking-tight font-heading">
                        {isHideBalance ? "••••••" : `${currencySymbol}${cat.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>
                    {cat.monthlyBudget && cat.monthlyBudget > 0 && (
                      <div className="text-right">
                        <span className="text-[9px] font-black uppercase opacity-75 block tracking-wider">Budget Cap</span>
                        <span className="text-xs font-black opacity-90 font-heading">
                          {currencySymbol}{cat.monthlyBudget.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

