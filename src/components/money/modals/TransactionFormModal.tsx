"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { NeobrutalistDateTimePickerModal } from "@/components/shared/NeobrutalistDateTimePickerModal";
import { NeobrutalistCalculator } from "@/components/shared/NeobrutalistCalculator";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { format, parseISO, subDays, addDays } from "date-fns";
import { type Transaction, type Category } from "@/types";
import {
  Trash2,
  Calendar,
  Plus,
  Sparkles,
  Smartphone,
  Banknote,
  CreditCard,
  Building2,
  TrendingDown,
  TrendingUp,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Users,
} from "lucide-react";
import { CategoryIcon } from "@/components/money/MoneyQuickActionsAndCards";

import { detectCategoryFromNote } from "@/lib/utils/merchant-categorizer";
import { MerchantCategoryCache } from "@/lib/sms/merchant-cache";
import { useSaveMerchantRule } from "@/lib/queries/merchant-rules";

interface TransactionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Transaction | null;
  categories: Category[];
  currencySymbol: string;
  onOpenAddCategory?: () => void;
  onOpenReceiptScan?: () => void;
  onOpenWhoOwesWho?: (prefill?: { amount?: number; description?: string }) => void;
  onSave: (payload: {
    id?: string;
    amount: number;
    type: "expense" | "income";
    categoryId: string;
    date: string;
    note?: string;
    paymentMethod: string;
  }) => Promise<any>;
  onDelete?: (id: string) => Promise<any>;
}

const QUICK_INCREMENTS = [50, 100, 200, 500, 1000, 2000];

const STARTER_QUICK_PRESETS = [
  { name: "Chai & Snack", amount: 30 },
  { name: "Campus Lunch", amount: 150 },
  { name: "Metro / Auto", amount: 50 },
  { name: "Groceries", amount: 350 },
];

export function TransactionFormModal({
  open,
  onOpenChange,
  initialData,
  categories,
  currencySymbol,
  onOpenAddCategory,
  onOpenReceiptScan,
  onOpenWhoOwesWho,
  onSave,
  onDelete,
}: TransactionFormModalProps) {
  const isEditing = Boolean(initialData?.id);

  // Form states
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modals inside sheet
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);

  // Visual auto-match feedback badge
  const [matchedCategoryName, setMatchedCategoryName] = useState<string | null>(null);

  const saveMerchantRuleMutation = useSaveMerchantRule();

  // Track previous open state so we ONLY initialize/reset form fields when opening modal or switching tx
  const prevOpenRef = React.useRef(false);
  const prevTxIdRef = React.useRef<string | undefined>(undefined);

  useEffect(() => {
    const isOpening = open && !prevOpenRef.current;
    const isEditingNew = initialData?.id !== prevTxIdRef.current;

    if (isOpening || isEditingNew) {
      setMatchedCategoryName(null);
      if (initialData) {
        setType(initialData.type || "expense");
        setAmount(String(initialData.amount || ""));
        setCategoryId(initialData.categoryId || "");
        setDate(initialData.date || format(new Date(), "yyyy-MM-dd"));
        setNote(initialData.note || "");
        setPaymentMethod(initialData.paymentMethod || "upi");
      } else if (isOpening) {
        setType("expense");
        setAmount("");
        setDate(format(new Date(), "yyyy-MM-dd"));
        setNote("");
        setPaymentMethod("upi");
        const defaultCat = categories.find((c) => c.type === "expense");
        setCategoryId(defaultCat?.id || "");
      }
    }

    prevOpenRef.current = open;
    prevTxIdRef.current = initialData?.id;
  }, [open, initialData, categories]);

  // Categories filtered by active type (expense or income)
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => c.type === type && !c.archived);
  }, [categories, type]);

  // Top visual category tiles (up to 11 for a clean 4-col grid with + New tile)
  const topCategoryTiles = useMemo(() => {
    return filteredCategories.slice(0, 11);
  }, [filteredCategories]);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === categoryId);
  }, [categories, categoryId]);

  // Additive quick-chip button handler
  const handleQuickIncrement = (inc: number) => {
    soundFX.playPop();
    soundFX.vibrate(15);
    const curr = parseFloat(amount) || 0;
    setAmount(String(curr + inc));
  };

  // Date stepper handlers (Belanje Benchmark)
  const handleStepDate = (direction: -1 | 1) => {
    soundFX.playPop();
    soundFX.vibrate(10);
    try {
      const parsed = parseISO(date);
      const nextDate = direction === -1 ? subDays(parsed, 1) : addDays(parsed, 1);
      setDate(format(nextDate, "yyyy-MM-dd"));
    } catch {
      setDate(format(new Date(), "yyyy-MM-dd"));
    }
  };

  // Smart multi-tier note auto-matching for category
  const handleNoteChange = (val: string) => {
    setNote(val);
    if (!val.trim()) {
      setMatchedCategoryName(null);
      return;
    }

    // Tier 1: Learned merchant dictionary
    const hit = MerchantCategoryCache.get(val);
    if (hit) {
      const targetCat = filteredCategories.find(
        (c) => c.id === hit.categoryId || c.name.toLowerCase() === hit.categoryName.toLowerCase()
      );
      if (targetCat) {
        if (categoryId !== targetCat.id) {
          soundFX.playPop();
          soundFX.vibrate(15);
          setCategoryId(targetCat.id);
          setMatchedCategoryName(targetCat.name);
        }
        return;
      }
    }

    // Tier 2: Keyword & semantic dictionary mapping
    const match = detectCategoryFromNote(val, filteredCategories);
    if (match) {
      if (categoryId !== match.categoryId) {
        soundFX.playPop();
        soundFX.vibrate(15);
        setCategoryId(match.categoryId);
        setMatchedCategoryName(match.categoryName);
      }
      return;
    }
    setMatchedCategoryName(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) return;

    setIsSubmitting(true);
    try {
      const trimmedNote = note.trim();
      const targetCatId = categoryId || filteredCategories[0]?.id || "";

      const savePromise = onSave({
        id: initialData?.id,
        amount: numAmt,
        type,
        categoryId: targetCatId,
        date,
        note: trimmedNote,
        paymentMethod,
      });

      if (type === "expense" && trimmedNote.length >= 2) {
        const selectedCat = categories.find((c) => c.id === targetCatId);
        if (selectedCat) {
          saveMerchantRuleMutation.mutate({
            merchant: trimmedNote,
            categoryId: targetCatId,
            categoryName: selectedCat.name,
            displayName: trimmedNote,
          });
        }
      }

      soundFX.playCashRegister();
      soundFX.vibrate([30, 50, 30]);
      onOpenChange(false);
      await savePromise;
    } catch {
      // Error handled by caller toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(initialData.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDateLabel = useMemo(() => {
    try {
      const parsed = parseISO(date);
      const isToday = format(parsed, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
      const isYesterday = format(parsed, "yyyy-MM-dd") === format(subDays(new Date(), 1), "yyyy-MM-dd");
      if (isToday) return `Today, ${format(parsed, "d MMM yyyy")}`;
      if (isYesterday) return `Yesterday, ${format(parsed, "d MMM yyyy")}`;
      return format(parsed, "EEE, d MMM yyyy");
    } catch {
      return date;
    }
  }, [date]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="w-full sm:max-w-xl sm:mx-auto max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl border-t-2 border-x-2 sm:border-2 border-[#161514] dark:border-[#383531] bg-white dark:bg-[#161514] p-0 shadow-2xl flex flex-col overflow-hidden text-[#161514] dark:text-[#FAF8F5] focus:outline-none"
        >
          {/* ─── TOP GRAB HANDLE & NAVIGATION BAR (Belanje Signature) ─── */}
          <div className="shrink-0 px-5 pt-3 pb-3 border-b border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#161514] relative">
            <div className="w-12 h-1.5 bg-[#E8E5DF] dark:bg-[#383531] rounded-full mx-auto mb-2" />
            <div className="flex items-center justify-between">
              {/* Left Action: Cancel */}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-sm font-heading font-bold text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {/* Center Title */}
              <SheetTitle className="text-base sm:text-lg font-heading font-black tracking-tight text-[#161514] dark:text-[#FAF8F5]">
                {isEditing ? "Edit Record" : type === "expense" ? "Add Expense" : "Add Income"}
              </SheetTitle>

              {/* Right Action: Save */}
              <button
                type="button"
                disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
                onClick={() => handleSubmit()}
                className="text-sm font-heading font-black text-[#161514] dark:text-[#CEF431] hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {isSubmitting ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          {/* ─── SCROLLABLE FORM BODY ─── */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin bg-white dark:bg-[#161514]">
            {/* 1. Segmented Pill Switcher (Expense vs Income) */}
            <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-1 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] flex gap-1 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setType("expense");
                  setMatchedCategoryName(null);
                  const nextCats = categories.filter((c) => c.type === "expense" && !c.archived);
                  setCategoryId(nextCats[0]?.id || "");
                }}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  type === "expense"
                    ? "bg-white dark:bg-[#252321] text-rose-600 dark:text-rose-400 border border-[#E8E5DF] dark:border-[#383531] shadow-xs"
                    : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-white"
                )}
              >
                <TrendingDown className="size-3.5 stroke-[2.5]" />
                <span>Expense</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setType("income");
                  setMatchedCategoryName(null);
                  const nextCats = categories.filter((c) => c.type === "income" && !c.archived);
                  setCategoryId(nextCats[0]?.id || "");
                }}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  type === "income"
                    ? "bg-[#03D26F] text-[#161514] border border-[#03D26F] shadow-xs font-black"
                    : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-white"
                )}
              >
                <TrendingUp className="size-3.5 stroke-[2.5]" />
                <span>Income</span>
              </button>
            </div>

            {/* 2. Massive Centered Amount Display with Currency Chip & Calc Button (Belanje Signature) */}
            <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-4 rounded-3xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                {/* Currency Badge */}
                <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#252321] text-xs font-mono font-bold text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531] shadow-xs">
                  {currencySymbol}
                </span>

                {/* Inline Calculator Button */}
                <button
                  type="button"
                  onClick={() => setIsCalcOpen(true)}
                  className="p-2 rounded-xl bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] hover:bg-[#E8E5DF] dark:hover:bg-[#2E2B28] border border-[#E8E5DF] dark:border-[#383531] shadow-xs cursor-pointer transition-colors"
                  title="Open Calculator"
                >
                  <Calculator className="size-4 stroke-[2]" />
                </button>
              </div>

              {/* Massive Amount Input */}
              <div className="py-2 text-center">
                <input
                  id="tx-hero-amount"
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus={!isEditing}
                  className="w-full text-center bg-transparent text-4xl sm:text-5xl font-mono font-black text-[#161514] dark:text-[#FAF8F5] placeholder-[#161514]/30 dark:placeholder-white/30 focus:outline-none tracking-tight [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Additive Quick Increment Chips */}
              <div className="flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                {QUICK_INCREMENTS.map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => handleQuickIncrement(inc)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#252321] hover:bg-[#CEF431] dark:hover:bg-[#CEF431] text-[#161514] dark:text-[#FAF8F5] hover:text-[#161514] text-[10px] font-black border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs active:translate-y-0.5 transition-all shrink-0 cursor-pointer"
                  >
                    +{inc}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Starters (Visible when amount is blank) */}
            {!isEditing && !amount && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {STARTER_QUICK_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setAmount(String(p.amount));
                      handleNoteChange(p.name);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#1C1A18] hover:bg-[#FAF8F5] dark:hover:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] text-[10.5px] font-bold border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs shrink-0 cursor-pointer transition-all active:scale-95"
                  >
                    <span>{p.name}</span>{" "}
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                      {currencySymbol}{p.amount}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* 3. Category Selector (Belanje Highlight Row + Grid) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E]">
                  CATEGORY
                </span>
                {filteredCategories.length > 7 && (
                  <button
                    type="button"
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    className="text-[10px] font-mono font-bold uppercase text-[#161514] dark:text-[#FAF8F5] hover:underline cursor-pointer border-none bg-transparent"
                  >
                    {showAllCategories ? "Show Tiles" : "Search All ▾"}
                  </button>
                )}
              </div>

              {!showAllCategories ? (
                <div className="grid grid-cols-4 gap-2">
                  {topCategoryTiles.map((cat) => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          soundFX.playPop();
                          setCategoryId(cat.id);
                          setMatchedCategoryName(null);
                        }}
                        className={cn(
                          "p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 shadow-xs active:translate-y-0.5",
                          isSelected
                            ? "bg-[#161514] text-white border-[#161514] dark:bg-white dark:text-[#161514] dark:border-white font-black"
                            : "bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#F1EFEA] dark:hover:bg-[#252321]"
                        )}
                      >
                        <CategoryIcon
                          name={cat.icon}
                          className={cn(
                            "size-5",
                            isSelected ? "text-white dark:text-[#161514]" : "text-[#161514] dark:text-[#FAF8F5]"
                          )}
                        />
                        <span className="text-[10px] font-heading font-black tracking-tight truncate w-full">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}

                  {onOpenAddCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playPop();
                        onOpenAddCategory();
                      }}
                      className="p-2.5 rounded-2xl border border-dashed border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] hover:bg-[#FEF08A] dark:hover:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 shadow-xs active:translate-y-0.5"
                      title="Create a new custom category"
                    >
                      <Plus className="size-4 stroke-[3]" />
                      <span className="text-[9.5px] font-black uppercase tracking-tight">
                        + New
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <NeobrutalistSelect
                  value={categoryId}
                  onChange={(id) => {
                    setCategoryId(id);
                    setMatchedCategoryName(null);
                  }}
                  options={filteredCategories.map((c) => ({
                    value: c.id,
                    label: c.name,
                    icon: c.icon,
                  }))}
                  placeholder="Select Category"
                />
              )}
            </div>

            {/* 4. Payment Method Chips (Belanje Benchmark) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E] block">
                PAYMENT METHOD
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "upi", label: "UPI / QR", icon: Smartphone },
                  { id: "cash", label: "Cash", icon: Banknote },
                  { id: "card", label: "Card", icon: CreditCard },
                  { id: "bank", label: "Bank", icon: Building2 },
                ].map((m) => {
                  const isSelected = paymentMethod === m.id;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        soundFX.playPop();
                        setPaymentMethod(m.id);
                      }}
                      className={cn(
                        "py-2.5 px-2 rounded-2xl border text-xs font-heading font-black transition-all flex flex-col items-center justify-center gap-1 shadow-xs active:translate-y-0.5 cursor-pointer",
                        isSelected
                          ? "bg-[#161514] text-white border-[#161514] dark:bg-white dark:text-[#161514] dark:border-white"
                          : "bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#F1EFEA] dark:hover:bg-[#252321]"
                      )}
                    >
                      <Icon className="size-4 stroke-[2]" />
                      <span className="text-[10px] tracking-tight truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Grouped Inset Details (Belanje Signature Inset Card) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E] block">
                DETAILS &amp; NOTE
              </span>
              <div className="rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] divide-y divide-[#E8E5DF] dark:divide-[#2A2724] overflow-hidden">
                {/* Row 1: Date with Belanje < > Fast Steppers */}
                <div className="p-3 flex items-center justify-between">
                  <div
                    onClick={() => {
                      soundFX.playPop();
                      setIsDatePickerOpen(true);
                    }}
                    className="flex items-center gap-2.5 cursor-pointer flex-1"
                  >
                    <Calendar className="size-4 text-[#161514] dark:text-[#FAF8F5] shrink-0" />
                    <span className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
                      {formattedDateLabel}
                    </span>
                  </div>

                  {/* Fast Date Steppers (< >) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStepDate(-1)}
                      className="size-7 rounded-lg bg-white dark:bg-[#252321] hover:bg-[#E8E5DF] dark:hover:bg-[#2e2b28] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                      title="Step back 1 day (Yesterday)"
                    >
                      <ChevronLeft className="size-3.5 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepDate(1)}
                      className="size-7 rounded-lg bg-white dark:bg-[#252321] hover:bg-[#E8E5DF] dark:hover:bg-[#2e2b28] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                      title="Step forward 1 day"
                    >
                      <ChevronRight className="size-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Row 2: Note / Merchant Description */}
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                      Note or Merchant
                    </span>
                    {matchedCategoryName && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#CEF431] border border-[#161514] rounded shadow-xs">
                        <Sparkles className="size-2 text-[#161514] stroke-[3]" />
                        <span className="text-[9px] font-bold text-[#161514]">
                          Auto-matched: {matchedCategoryName}
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => handleNoteChange(e.target.value)}
                    placeholder="e.g. Swiggy lunch, metro card, campus groceries..."
                    className="w-full bg-transparent text-xs font-bold text-[#161514] dark:text-[#FAF8F5] placeholder-[#161514]/40 dark:placeholder-white/40 focus:outline-none"
                  />
                </div>

                {/* Row 3: OCR Receipt Scan Trigger */}
                {onOpenReceiptScan && (
                  <div
                    onClick={() => {
                      onOpenChange(false);
                      onOpenReceiptScan();
                    }}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-white dark:hover:bg-[#201D1A] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Receipt className="size-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <div>
                        <span className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] block">
                          Add Receipt
                        </span>
                        <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] block">
                          Extract item details via OCR scanner
                        </span>
                      </div>
                    </div>
                    <Plus className="size-4 stroke-[2] text-[#6B6B6B] dark:text-[#A8A29E]" />
                  </div>
                )}

                {/* Row 4: Belanje Photo 6 Trigger: "Lent it to someone? Track it in Who Owes Who >" */}
                {onOpenWhoOwesWho && (
                  <div
                    onClick={() => {
                      onOpenChange(false);
                      onOpenWhoOwesWho({
                        amount: parseFloat(amount) || undefined,
                        description: note || undefined,
                      });
                    }}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-white dark:hover:bg-[#201D1A] transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <span className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] block">
                          Lent it to someone?
                        </span>
                        <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] block">
                          Track it in Who Owes Who &gt;
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="size-4 stroke-[2] text-[#6B6B6B] dark:text-[#A8A29E] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                )}
              </div>
            </div>

            {/* Delete Option (When editing existing transaction) */}
            {isEditing && onDelete && (
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="w-full py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 text-xs font-heading font-black transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="size-3.5 stroke-[2]" />
                  <span>{isDeleting ? "Deleting Record…" : "Delete Transaction"}</span>
                </button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Date Picker Modal */}
      <NeobrutalistDateTimePickerModal
        open={isDatePickerOpen}
        onOpenChange={setIsDatePickerOpen}
        dateValue={date}
        onSave={(newDate) => setDate(newDate)}
        title="Transaction Date"
      />

      {/* Instant Calculator Modal */}
      <NeobrutalistCalculator
        open={isCalcOpen}
        onOpenChange={setIsCalcOpen}
        hideFloatingTrigger={true}
      />
    </>
  );
}
