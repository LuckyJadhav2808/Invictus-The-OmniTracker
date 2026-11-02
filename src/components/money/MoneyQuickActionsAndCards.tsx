"use client";

import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Plus,
  ArrowRightLeft,
  Send,
  Edit3,
  Trash2,
  Camera,
  Check,
  Wallet,
  Briefcase,
  Coffee,
  Home,
  Compass,
  DollarSign,
  Smile,
  ShoppingBag,
  Utensils,
  Car,
  Zap,
  Droplet,
  Gift,
  Film,
  Book,
  BookOpen,
  Heart,
  HeartPulse,
  Tag,
  PiggyBank,
  TrendingUp,
  Smartphone,
  CreditCard,
  Fuel,
  Plane,
  Dumbbell,
  Gamepad,
  Laptop,
  Target,
  Sparkles,
  Landmark,
  Building2,
  GraduationCap,
  Music,
  Shield,
  ShieldCheck,
  Banknote,
  Receipt,
  Percent,
  Coins,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

// Map string icon names to crisp Lucide line icons
export function CategoryIcon({
  name,
  className = "size-3.5",
}: {
  name: string | undefined;
  className?: string;
}) {
  const iconMap: Record<string, React.ElementType> = {
    briefcase: Briefcase,
    coffee: Coffee,
    home: Home,
    compass: Compass,
    dollarsign: DollarSign,
    dollar: DollarSign,
    smile: Smile,
    wallet: Wallet,
    shoppingbag: ShoppingBag,
    bag: ShoppingBag,
    utensils: Utensils,
    food: Utensils,
    car: Car,
    zap: Zap,
    droplet: Droplet,
    gift: Gift,
    film: Film,
    book: Book,
    bookopen: BookOpen,
    books: BookOpen,
    heart: Heart,
    heartpulse: HeartPulse,
    gym: HeartPulse,
    tag: Tag,
    shopping: Tag,
    piggybank: PiggyBank,
    savings: PiggyBank,
    trendingup: TrendingUp,
    smartphone: Smartphone,
    phone: Smartphone,
    upi: Smartphone,
    creditcard: CreditCard,
    card: CreditCard,
    fuel: Fuel,
    plane: Plane,
    travel: Plane,
    dumbbell: Dumbbell,
    gamepad: Gamepad,
    laptop: Laptop,
    target: Target,
    sparkles: Sparkles,
    landmark: Landmark,
    building: Building2,
    building2: Building2,
    bank: Building2,
    graduationcap: GraduationCap,
    music: Music,
    shield: Shield,
    shieldcheck: ShieldCheck,
    banknote: Banknote,
    cash: Banknote,
    receipt: Receipt,
    percent: Percent,
    coins: Coins,
  };

  const normalized = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const IconComponent = (normalized && iconMap[normalized]) ? iconMap[normalized] : Wallet;
  return <IconComponent className={className} strokeWidth={2.2} />;
}

export const renderCategoryEmoji = (icon: string | undefined): string => {
  return icon || "💳";
};

// Subtle semantic indicator accent for envelope edge
export function getCategoryAccent(cat: { type?: string; name: string }): string {
  const isIncome = cat.type === "income";
  if (isIncome) return "#03D26F";
  const nameLower = cat.name.toLowerCase();
  if (nameLower.includes("bill") || nameLower.includes("rent") || nameLower.includes("util")) {
    return "#64748B"; // slate
  }
  if (nameLower.includes("food") || nameLower.includes("grocer") || nameLower.includes("dining")) {
    return "#F59E0B"; // amber
  }
  if (nameLower.includes("study") || nameLower.includes("book") || nameLower.includes("course") || nameLower.includes("tuition")) {
    return "#C084FC"; // lavender
  }
  return "#161514";
}



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



  return (
    <div className="space-y-3">
      {/* Category Wallets Header with Move, Send, Bulk, New Category & Hide Balance Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#161514] flex items-center gap-1.5 font-heading">
            <Wallet className="size-3.5 text-[#161514] stroke-[2.2]" />
            <span>Category Wallets</span>
          </h3>
          <span className="text-[10px] font-black text-[#161514] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#161514]/30 font-mono shadow-[1px_1px_0px_0px_#161514]">
            {categories.length} {categories.length === 1 ? "wallet" : "wallets"}
          </span>

          {/* Hide/Show Balance Toggle */}
          <button
            type="button"
            onClick={toggleHideBalance}
            className="p-1 rounded-md bg-white hover:bg-[#FAF8F5] text-[#161514] border border-[#161514] shadow-[1px_1px_0px_0px_#161514] cursor-pointer transition-all active:translate-y-0.5"
            title={isHideBalance ? "Show balances" : "Hide balances"}
          >
            {isHideBalance ? <EyeOff className="h-3 w-3 stroke-[2.2]" /> : <Eye className="h-3 w-3 stroke-[2.2]" />}
          </button>

          {selectedCategoryId && selectedCategoryId !== "all" && (
            <button
              type="button"
              onClick={() => onSelectCategory?.("all")}
              className="text-[10px] font-black font-mono text-[#161514] bg-[#CEF431] px-2 py-0.5 rounded-md border border-[#161514] shadow-[1px_1px_0px_0px_#161514] cursor-pointer hover:bg-rose-200 transition-all"
              title="Clear category filter"
            >
              Filtered ✕
            </button>
          )}
        </div>

        {/* Action Buttons: Unified Restrained Tactile Dock */}
        <div className="flex items-center gap-2 flex-wrap">
          {onMoveMoney && (
            <button
              type="button"
              onClick={onMoveMoney}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#161514] text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shrink-0 min-h-[36px]"
              title="Transfer funds between category wallets"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 stroke-[2.2]" />
              <span>Move</span>
            </button>
          )}

          {onSendMoney && (
            <button
              type="button"
              onClick={onSendMoney}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#161514] text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shrink-0 min-h-[36px]"
              title="Record an instant payout or payment to a recipient"
            >
              <Send className="h-3.5 w-3.5 stroke-[2.2]" />
              <span>Send</span>
            </button>
          )}

          {onBulkAddExpense && (
            <button
              type="button"
              onClick={onBulkAddExpense}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#161514] text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shrink-0 min-h-[36px]"
              title="Bulk Expense Logger & Offline OCR Scanner"
            >
              <Camera className="h-3.5 w-3.5 stroke-[2.2]" />
              <span>Bulk</span>
            </button>
          )}

          {onAddCategory && (
            <button
              type="button"
              onClick={onAddCategory}
              className="text-xs font-black text-[#161514] bg-[#CEF431] hover:bg-[#bde422] px-3 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] whitespace-nowrap shrink-0 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none uppercase tracking-wider min-h-[36px]"
              title="Create new category envelope"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>+ Category</span>
            </button>
          )}
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-[#161514] text-center space-y-3 shadow-[3px_3px_0px_0px_#161514]">
          <div className="size-11 rounded-xl bg-[#FAF8F5] text-[#161514] border-2 border-[#161514] flex items-center justify-center mx-auto shadow-[1px_1px_0px_0px_#161514]">
            <Layers className="size-5 stroke-[2]" />
          </div>
          <div>
            <h4 className="text-sm font-black text-[#161514] font-heading uppercase tracking-wide">
              No Category Wallets Configured
            </h4>
            <p className="text-xs text-[#161514]/70 font-medium max-w-sm mx-auto mt-1">
              Organize your ledger with category wallets like Groceries, Transport, Bills, or Dining.
            </p>
          </div>
          {onAddCategory && (
            <button
              type="button"
              onClick={onAddCategory}
              className="px-4 py-2 rounded-xl bg-[#CEF431] hover:bg-[#bde422] text-[#161514] text-xs font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>Create Your First Wallet</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar px-1 py-2 -my-1">
          {categories.map((cat, idx) => {
            const isSelected = selectedCategoryId === cat.id;
            const accentColor = getCategoryAccent(cat);
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
                  "w-[210px] sm:w-[230px] shrink-0 snap-start relative group cursor-pointer transition-all duration-150 ease-out",
                  isSelected ? "-translate-y-0.5" : "hover:-translate-y-0.5"
                )}
              >
                {/* Unslopped Tactile Card Envelope */}
                <div
                  className={cn(
                    "rounded-2xl p-3 border-2 border-[#161514] space-y-2 transition-all relative overflow-hidden",
                    isSelected
                      ? "bg-[#CEF431] text-[#161514] shadow-[3px_3px_0px_0px_#161514]"
                      : "bg-white text-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:shadow-[3px_3px_0px_0px_#161514]"
                  )}
                >
                  {/* Subtle 3px Category Accent Rim */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: isSelected ? "#161514" : accentColor }}
                  />

                  {/* Header Row: Category Icon & Badges */}
                  <div className="flex items-center justify-between gap-1.5 pt-0.5">
                    <div
                      className={cn(
                        "size-7 rounded-lg border-2 flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_#161514]",
                        isSelected
                          ? "bg-[#161514] text-white border-[#161514]"
                          : "bg-[#FAF8F5] text-[#161514] border-[#161514]"
                      )}
                    >
                      <CategoryIcon name={cat.icon} className="size-3.5" />
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected ? (
                        <span className="text-[9px] font-black uppercase bg-[#161514] text-white px-1.5 py-0.5 rounded border border-[#161514] flex items-center gap-1 font-mono">
                          <Check className="size-2.5 stroke-[3]" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold uppercase text-[#161514]/70 bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#161514]/30">
                          {cat.type === "income" ? "Income" : "Expense"}
                        </span>
                      )}

                      {/* Edit / Delete on Hover */}
                      <div
                        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {onEditCategory && (
                          <button
                            type="button"
                            onClick={() => onEditCategory(cat)}
                            className="text-[#161514]/70 hover:text-[#161514] p-0.5 cursor-pointer"
                            title="Edit wallet"
                          >
                            <Edit3 className="size-3 stroke-[2.2]" />
                          </button>
                        )}
                        {onDeleteCategory && (
                          <button
                            type="button"
                            onClick={() => onDeleteCategory(cat.id)}
                            className="text-[#161514]/70 hover:text-rose-600 p-0.5 cursor-pointer"
                            title="Delete wallet"
                          >
                            <Trash2 className="size-3 stroke-[2.2]" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title on its own line: NEVER TRUNCATES AWKWARDLY */}
                  <div className="pt-0.5">
                    <span className="text-xs font-black tracking-tight text-[#161514] line-clamp-1 font-heading block">
                      {cat.name}
                    </span>
                  </div>

                  {/* Body: Spent vs Budget Cap */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#161514]/10">
                    <div className="min-w-0">
                      <span className="text-[8px] font-bold uppercase text-[#161514]/60 block tracking-wider truncate">
                        Spent
                      </span>
                      <span className="text-sm font-black block tracking-tight font-mono tabular-nums truncate mt-0.5">
                        {isHideBalance
                          ? "••••"
                          : `${currencySymbol}${cat.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
                      </span>
                    </div>

                    <div className="text-right min-w-0">
                      <span className="text-[8px] font-bold uppercase text-[#161514]/60 block tracking-wider truncate">
                        Cap
                      </span>
                      {budgetCap > 0 ? (
                        <span className="text-xs font-bold text-[#161514]/80 font-mono tabular-nums block truncate mt-0.5">
                          {currencySymbol}{budgetCap.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-[#161514]/40 font-mono block truncate mt-0.5">
                          No Cap
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Meter if Budget Cap exists */}
                  {budgetCap > 0 && (
                    <div className="space-y-0.5 pt-0.5">
                      <div className="w-full bg-[#161514]/10 rounded-full h-1.5 overflow-hidden border border-[#161514]/20 p-0.2">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            isOverBudget
                              ? "bg-rose-500"
                              : percentSpent > 80
                              ? "bg-amber-400"
                              : isSelected
                              ? "bg-[#161514]"
                              : "bg-[#03D26F]"
                          )}
                          style={{ width: `${percentSpent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[7.5px] font-mono font-bold text-[#161514]/70 uppercase">
                        <span>{percentSpent}% Used</span>
                        {isOverBudget && <span className="text-rose-700 font-black">Over</span>}
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
