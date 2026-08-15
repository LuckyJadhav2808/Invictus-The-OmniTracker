"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Plus, ArrowRightLeft, Send, MoreHorizontal, Wallet, Edit3, Trash2 } from "lucide-react";
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

  const [walletViewMode, setWalletViewMode] = useState<"stacked" | "carousel">("stacked");
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

  const getSegmentColor = (idx: number) => {
    const colors = ["bg-amber-500", "bg-yellow-500", "bg-amber-600", "bg-orange-500", "bg-emerald-600"];
    return colors[idx % colors.length];
  };

  return (
    <div className="space-y-6 my-4">
      {/* Top Main Balance Header with Eye Privacy Toggle & Quick Action Pills */}
      <div className="bg-white rounded-3xl p-6 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-navy-600 block">
              Main Balance
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-navy-900 tracking-tight">
                {isHideBalance ? "••••••••" : `${currencySymbol}${mainBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              </span>
              <button
                onClick={toggleHideBalance}
                className="p-2 rounded-xl hover:bg-amber-100 border-2 border-navy-950 text-navy-950 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]"
                title={isHideBalance ? "Show Balance" : "Hide Balance"}
              >
                {isHideBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Quick Action Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onAddTransaction}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-navy-950 text-xs font-black transition-all cursor-pointer border-2 border-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Add</span>
            </button>
            <button
              onClick={onMoveMoney || (() => toast.info("Select accounts to transfer funds 🔄"))}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-amber-100 text-navy-950 text-xs font-black transition-all cursor-pointer border-2 border-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]"
            >
              <ArrowRightLeft className="h-4 w-4 text-navy-950" />
              <span>Move</span>
            </button>
            <button
              onClick={onSendMoney || (() => toast.info("Enter recipient details to send funds 🚀"))}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-amber-100 text-navy-950 text-xs font-black transition-all cursor-pointer border-2 border-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]"
            >
              <Send className="h-4 w-4 text-navy-950" />
              <span>Send</span>
            </button>
            <button
              onClick={onViewDetails}
              className="p-2.5 rounded-2xl bg-white hover:bg-amber-100 text-navy-950 transition-all cursor-pointer border-2 border-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]"
              title="More Details"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Multi-Color Spending Proportion Bar */}
        <div className="space-y-2 pt-2 border-t-2 border-navy-950/20">
          <div className="flex justify-between items-center text-xs font-black text-navy-900">
            <span>Spend Analysis Breakdown</span>
            <span className="text-navy-700 text-[11px] font-bold">
              Total: {currencySymbol}{totalSpending.toFixed(2)}
            </span>
          </div>

          {displayCategories.length === 0 || totalSpending === 0 ? (
            <div className="bg-amber-50 p-3 rounded-2xl border-2 border-navy-950 text-center shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]">
              <p className="text-xs font-black text-navy-900">No expenses recorded yet! 💸</p>
              <p className="text-[10px] text-navy-700 font-bold mt-0.5">
                Click <span className="font-black text-amber-800">'+ Add'</span> above to log your first transaction and build your budget pie chart.
              </p>
            </div>
          ) : (
            <>
              <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex gap-0.5 p-0.5 border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]">
                {displayCategories.map((c, idx) => {
                  const percentage = totalSpending > 0 ? Math.round((c.amount / totalSpending) * 100) : 0;
                  if (percentage === 0) return null;
                  return (
                    <div
                      key={c.id || idx}
                      className={cn("h-full transition-all duration-300", getSegmentColor(idx), idx === 0 && "rounded-l-full", idx === displayCategories.length - 1 && "rounded-r-full")}
                      style={{ width: `${percentage}%` }}
                      title={`${c.name}: ${currencySymbol}${c.amount} (${percentage}%)`}
                    />
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[10px] font-black">
                {displayCategories.map((c, idx) => {
                  const percentage = totalSpending > 0 ? Math.round((c.amount / totalSpending) * 100) : 0;
                  return (
                    <div key={c.id || idx} className="flex items-center gap-1.5 text-navy-900">
                      <span className={cn("h-2.5 w-2.5 rounded-full border border-black", getSegmentColor(idx))} />
                      <span>{c.name} ({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Folder-Tab Category Wallet Cards */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-navy-600">
            Category Wallets & Accounts
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle Button */}
            <div className="flex items-center bg-white rounded-xl border-2 border-navy-950 p-0.5 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] shrink-0">
              <button
                type="button"
                onClick={() => setWalletViewMode("stacked")}
                className={cn(
                  "text-[10px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                  walletViewMode === "stacked"
                    ? "bg-[#CEF431] text-navy-950 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]"
                    : "text-navy-700 hover:bg-slate-100"
                )}
                title="Apple Wallet Overlapping Stack"
              >
                <span>🎴 Stack Deck</span>
              </button>
              <button
                type="button"
                onClick={() => setWalletViewMode("carousel")}
                className={cn(
                  "text-[10px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                  walletViewMode === "carousel"
                    ? "bg-[#CEF431] text-navy-950 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]"
                    : "text-navy-700 hover:bg-slate-100"
                )}
                title="Horizontal Swipe Carousel"
              >
                <span>📱 Carousel</span>
              </button>
            </div>

            {onAddCategory && (
              <button
                onClick={onAddCategory}
                className="text-[10px] font-black text-navy-950 bg-amber-400 hover:bg-amber-500 px-3 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1 border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] whitespace-nowrap shrink-0"
              >
                <Plus className="h-3 w-3 stroke-[3]" /> New Category
              </button>
            )}
          </div>
        </div>

        {displayCategories.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border-2 border-navy-950 text-center space-y-3 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)]">
            <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-900 border-2 border-navy-950 flex items-center justify-center mx-auto text-xl font-black shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]">
              💳
            </div>
            <div>
              <h4 className="text-sm font-black text-navy-900">No Expense Categories Active</h4>
              <p className="text-xs text-navy-700 font-bold max-w-sm mx-auto mt-1">
                Organize your ledger with category wallets like Groceries, Transport, or Bills. Tap below to create your first category!
              </p>
            </div>
            {onAddCategory && (
              <button
                onClick={onAddCategory}
                className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-navy-950 text-xs font-black transition-all cursor-pointer inline-flex items-center gap-2 border-2 border-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)]"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Create Your First Category</span>
              </button>
            )}
          </div>
        ) : (
          <div
            className={cn(
              walletViewMode === "carousel"
                ? "flex gap-3.5 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-3 pt-1"
                : "relative pt-2 pb-6 flex flex-col -space-y-12 sm:-space-y-14 max-w-2xl mx-auto w-full"
            )}
          >
            {displayCategories.map((cat, idx) => {
              const theme = getCategoryColors(cat, idx);
              const isSelected = activeCardId === cat.id;
              return (
                <div
                  key={cat.id || idx}
                  onClick={() => setActiveCardId(isSelected ? null : cat.id)}
                  style={{ zIndex: isSelected ? 40 : idx + 1 }}
                  className={cn(
                    "relative group cursor-pointer transition-all duration-300 ease-out",
                    walletViewMode === "carousel" ? "w-[240px] sm:w-[280px] shrink-0 snap-start" : "w-full hover:-translate-y-4 hover:z-50",
                    walletViewMode === "stacked" && isSelected && "-translate-y-6 shadow-2xl scale-[1.01]"
                  )}
                >
                  {/* Folder Top Tab */}
                  <div
                    style={{ backgroundColor: theme.bg, color: theme.text }}
                    className="w-32 h-6 rounded-t-xl ml-4 text-[9px] font-black uppercase px-2.5 flex items-center justify-between border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]"
                  >
                    <span className="truncate flex items-center gap-1">
                      <span>{renderCategoryEmoji(cat.icon)}</span>
                      <span className="truncate">{cat.name.slice(0, 10)}</span>
                    </span>
                    <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      {onEditCategory && (
                        <button
                          onClick={() => onEditCategory(cat)}
                          className="text-current hover:scale-110 p-0.5 cursor-pointer border-none bg-transparent"
                          title="Edit category"
                        >
                          <Edit3 className="h-2.5 w-2.5" />
                        </button>
                      )}
                      {onDeleteCategory && (
                        <button
                          onClick={() => onDeleteCategory(cat.id)}
                          className="text-current hover:scale-110 p-0.5 cursor-pointer border-none bg-transparent"
                          title="Delete category"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Main Card Body */}
                  <div
                    style={{ backgroundColor: theme.bg, color: theme.text }}
                    className="rounded-2xl rounded-tl-none p-4 sm:p-5 border-2 border-[#161514] space-y-3 transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(22,21,20,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(22,21,20,1)]"
                  >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{renderCategoryEmoji(cat.icon)}</span>
                      <span className="text-xs font-black tracking-wide block truncate opacity-90">
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-black/15 px-2.5 py-0.5 rounded-xl border border-navy-950 backdrop-blur-xs">
                      {cat.type || "Expense"}
                    </span>
                  </div>

                  <div className="flex items-end justify-between pt-1">
                    <div>
                      <span className="text-[9px] font-black uppercase opacity-75 block">Spent Balance</span>
                      <span className="text-xl sm:text-2xl font-black block tracking-tight">
                        {isHideBalance ? "••••••" : `${currencySymbol}${cat.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>
                    {cat.monthlyBudget && cat.monthlyBudget > 0 && (
                      <div className="text-right">
                        <span className="text-[9px] font-black uppercase opacity-75 block">Budget Cap</span>
                        <span className="text-xs font-black opacity-90">
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
    </div>
  );
}
