"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { NeobrutalistDateTimePickerModal } from "@/components/shared/NeobrutalistDateTimePickerModal";
import { NeobrutalistCalculator } from "@/components/shared/NeobrutalistCalculator";
import { InlineMathInput } from "@/components/ui/InlineMathInput";
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
import { parseSmartIntent } from "@/lib/nlp/smart-intent-parser";
import { MerchantCategoryCache } from "@/lib/sms/merchant-cache";
import { useSaveMerchantRule } from "@/lib/queries/merchant-rules";
import { computeFrequentExpenses } from "@/lib/utils/frequent-expenses";

export interface TransactionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Kept for caller compatibility; "cash" pre-selects Cash payment method. */
  mode?: "full" | "quick" | "cash";
  initialData?: Transaction | null;
  categories: Category[];
  currencySymbol: string;
  transactions?: Transaction[];
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

const QUICK_INCREMENTS = [50, 100, 200, 500, 1000];
const CASH_INCREMENTS = [10, 20, 50, 100, 200, 500];

export function TransactionFormModal({
  open,
  onOpenChange,
  mode = "full",
  initialData,
  categories,
  currencySymbol,
  transactions = [],
  onOpenAddCategory,
  onOpenReceiptScan,
  onOpenWhoOwesWho,
  onSave,
  onDelete,
}: TransactionFormModalProps) {
  const isEditing = Boolean(initialData?.id);
  const isCashMode = mode === "cash" && !isEditing;
  const [formBodyRef] = useAutoAnimate<HTMLDivElement>();

  // Form states
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(isCashMode ? "cash" : "upi");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modals inside sheet
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);

  // Visual auto-match feedback badge
  const [matchedCategoryName, setMatchedCategoryName] = useState<string | null>(null);

  const saveMerchantRuleMutation = useSaveMerchantRule();

  // Only initialize/reset form fields when opening modal or switching tx
  const prevOpenRef = useRef(false);
  const prevTxIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const isOpening = open && !prevOpenRef.current;
    const isEditingNew = initialData?.id !== prevTxIdRef.current;

    if (isOpening || isEditingNew) {
      setMatchedCategoryName(null);
      setShowAllCategories(false);
      if (initialData) {
        setType(initialData.type || "expense");
        setAmount(String(initialData.amount || ""));
        setCategoryId(initialData.categoryId || "");
        setDate(initialData.date || format(new Date(), "yyyy-MM-dd"));
        setNote(initialData.note || "");
        setPaymentMethod(initialData.paymentMethod || (mode === "cash" ? "cash" : "upi"));
      } else if (isOpening) {
        setType("expense");
        setAmount("");
        setDate(format(new Date(), "yyyy-MM-dd"));
        setNote("");
        setPaymentMethod(mode === "cash" ? "cash" : "upi");
        const defaultCat = categories.find((c) => c.type === "expense");
        setCategoryId(defaultCat?.id || "");
      }
    }

    prevOpenRef.current = open;
    prevTxIdRef.current = initialData?.id;
  }, [open, initialData, categories, mode]);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type && !c.archived),
    [categories, type]
  );

  const frequentHabits = useMemo(
    () => computeFrequentExpenses(transactions, categories, 5),
    [transactions, categories]
  );

  const handleQuickIncrement = (inc: number) => {
    soundFX.playPop();
    soundFX.vibrate(15);
    const curr = parseFloat(amount) || 0;
    setAmount(String(curr + inc));
  };

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

  // Smart multi-tier note auto-matching for category & amount intent
  const handleNoteChange = (val: string) => {
    setNote(val);
    if (!val.trim()) {
      setMatchedCategoryName(null);
      return;
    }

    let categoryMatched = false;
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
        categoryMatched = true;
      }
    }

    if (!categoryMatched) {
      const match = detectCategoryFromNote(val, filteredCategories);
      if (match) {
        if (categoryId !== match.categoryId) {
          soundFX.playPop();
          soundFX.vibrate(15);
          setCategoryId(match.categoryId);
          setMatchedCategoryName(match.categoryName);
        }
        categoryMatched = true;
      } else {
        setMatchedCategoryName(null);
      }
    }

    const parsed = parseSmartIntent(val);
    if (parsed.domain === "MONEY_EXPENSE" && parsed.expense) {
      if (parsed.expense.amount && (!amount || amount === "0" || amount === "0.00")) {
        setAmount(String(parsed.expense.amount));
        soundFX.playPop();
      }
      if (!categoryMatched && parsed.expense.category) {
        const catNameLower = parsed.expense.category.toLowerCase();
        const fallbackMatch = filteredCategories.find((c) =>
          c.name.toLowerCase().includes(catNameLower)
        );
        if (fallbackMatch && fallbackMatch.id !== categoryId) {
          setCategoryId(fallbackMatch.id);
          setMatchedCategoryName(fallbackMatch.name);
        }
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) return;

    setIsSubmitting(true);
    try {
      const trimmedNote = note.trim();
      const targetCatId = categoryId || filteredCategories[0]?.id || "";
      const resolvedPaymentMethod = isCashMode ? "Cash" : paymentMethod;

      const savePromise = onSave({
        id: initialData?.id,
        amount: numAmt,
        type,
        categoryId: targetCatId,
        date,
        note: trimmedNote,
        paymentMethod: resolvedPaymentMethod,
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

      if (resolvedPaymentMethod.toLowerCase() === "cash") {
        soundFX.play("coin");
      } else {
        soundFX.playCashRegister();
      }
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
      if (isToday) return "Today";
      if (isYesterday) return "Yesterday";
      return format(parsed, "d MMM");
    } catch {
      return date;
    }
  }, [date]);

  const numericAmount = parseFloat(amount) || 0;
  const isValidAmount = numericAmount > 0;
  const modalTitle = isEditing
    ? "Edit Record"
    : type === "expense"
    ? "Log Expense"
    : "Log Income";

  const incrementChips = isCashMode ? CASH_INCREMENTS : QUICK_INCREMENTS;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="w-full sm:max-w-lg sm:mx-auto sm:mb-6 max-h-[90vh] rounded-t-3xl sm:rounded-3xl border-t-2 border-x-2 sm:border-2 border-[#161514] dark:border-[#383531] bg-white dark:bg-[#161514] p-0 shadow-2xl flex flex-col overflow-hidden text-[#161514] dark:text-[#FAF8F5] focus:outline-none"
        >
          {/* ─── TOP GRAB HANDLE & NAVIGATION BAR ─── */}
          <div className="shrink-0 px-4 pt-2.5 pb-2.5 border-b border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#161514]">
            <div className="w-12 h-1.5 bg-[#E8E5DF] dark:bg-[#383531] rounded-full mx-auto mb-2 sm:hidden" />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-xs sm:text-sm font-heading font-bold text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <SheetTitle className="text-sm sm:text-base font-heading font-black tracking-tight text-[#161514] dark:text-[#FAF8F5]">
                {modalTitle}
              </SheetTitle>

              <button
                type="button"
                disabled={isSubmitting || !isValidAmount}
                onClick={() => handleSubmit()}
                className="text-xs sm:text-sm font-heading font-black text-[#161514] dark:text-[#CEF431] hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {isSubmitting ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          {/* ─── COMPACT ZERO-CLUTTER FORM BODY ─── */}
          <form
            id="unified-tx-form"
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col min-h-0"
          >
            <div
              ref={formBodyRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin bg-white dark:bg-[#161514]"
            >
              {/* 1. Compact Type Switcher + Date Stepper Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-1 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] flex gap-1 shadow-xs flex-1">
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
                      "flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1",
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
                      "flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1",
                      type === "income"
                        ? "bg-[#03D26F] text-[#161514] border border-[#03D26F] shadow-xs font-black"
                        : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-white"
                    )}
                  >
                    <TrendingUp className="size-3.5 stroke-[2.5]" />
                    <span>Income</span>
                  </button>
                </div>

                {/* Inline Fast Date Stepper */}
                <div className="flex items-center gap-1 bg-[#FAF8F5] dark:bg-[#1C1A18] p-1 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStepDate(-1)}
                    className="size-7 rounded-lg bg-white dark:bg-[#252321] hover:bg-[#E8E5DF] dark:hover:bg-[#2e2b28] text-[#161514] dark:text-[#FAF8F5] flex items-center justify-center transition-colors cursor-pointer"
                    title="Previous day"
                  >
                    <ChevronLeft className="size-3.5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setIsDatePickerOpen(true);
                    }}
                    className="px-2 py-1 text-xs font-heading font-black flex items-center gap-1 cursor-pointer hover:opacity-80"
                  >
                    <Calendar className="size-3 text-muted-foreground" />
                    <span>{formattedDateLabel}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepDate(1)}
                    className="size-7 rounded-lg bg-white dark:bg-[#252321] hover:bg-[#E8E5DF] dark:hover:bg-[#2e2b28] text-[#161514] dark:text-[#FAF8F5] flex items-center justify-center transition-colors cursor-pointer"
                    title="Next day"
                  >
                    <ChevronRight className="size-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* 2. Compact Amount Hero Card */}
              <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#252321] text-[11px] font-mono font-bold text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531]">
                    {currencySymbol}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {amount && (
                      <button
                        type="button"
                        onClick={() => setAmount("")}
                        className="text-[11px] font-mono font-bold text-[#6B6B6B] dark:text-[#A8A29E] hover:text-rose-600 px-1.5 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsCalcOpen(true)}
                      className="p-1.5 rounded-lg bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] hover:bg-[#E8E5DF] dark:hover:bg-[#2E2B28] border border-[#E8E5DF] dark:border-[#383531] cursor-pointer transition-colors"
                      title="Open Calculator"
                    >
                      <Calculator className="size-3.5 stroke-[2]" />
                    </button>
                  </div>
                </div>

                <div className="py-1 text-center">
                  <InlineMathInput
                    id="tx-hero-amount"
                    variant="hero"
                    value={amount}
                    onChange={(val) => setAmount(val)}
                    currencySymbol={currencySymbol}
                    placeholder="0.00"
                    autoFocus={!isEditing}
                    className="text-4xl sm:text-5xl font-mono font-black"
                  />
                </div>

                {/* Quick Increment Chips */}
                <div className="flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar">
                  {incrementChips.map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => handleQuickIncrement(inc)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#252321] hover:bg-[#CEF431] dark:hover:bg-[#CEF431] text-[#161514] dark:text-[#FAF8F5] hover:text-[#161514] text-[10px] font-mono font-black border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs active:translate-y-0.5 transition-all shrink-0 cursor-pointer"
                    >
                      +{currencySymbol}{inc}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Note / Merchant Input with NLP Auto-Fill */}
              <div className="space-y-1">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E]">
                    Note / Merchant
                  </span>
                  {matchedCategoryName ? (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#CEF431] border border-[#161514] rounded shadow-xs">
                      <Sparkles className="size-2 text-[#161514] stroke-[3]" />
                      <span className="text-[9px] font-bold text-[#161514]">
                        Auto: {matchedCategoryName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Sparkles className="size-2.5" />
                      Smart Match
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="e.g. Swiggy dinner 450, Coffee 120, Metro..."
                  className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl px-3 py-2 text-xs font-bold text-[#161514] dark:text-[#FAF8F5] placeholder-[#161514]/40 dark:placeholder-white/40 focus:outline-none focus:border-[#161514] dark:focus:border-[#CEF431]"
                />
              </div>

              {/* Frequent Presets (1 compact row when amount is empty) */}
              {!isEditing && !amount && frequentHabits.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {frequentHabits.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        soundFX.playPop();
                        soundFX.vibrate(15);
                        setAmount(String(p.amount));
                        handleNoteChange(p.name);
                        if (p.categoryId) setCategoryId(p.categoryId);
                        if (p.paymentMethod) setPaymentMethod(p.paymentMethod);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] hover:bg-[#F1EFEA] dark:hover:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] text-[11px] font-bold border border-[#E8E5DF] dark:border-[#2A2724] shrink-0 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <span>{p.icon}</span>
                      <span className="truncate max-w-[100px]">{p.name}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black">
                        {currencySymbol}{p.amount}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* 4. Compact Category Chip Rail (No 3-row scroll bloat) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E]">
                    Category
                  </span>
                  {filteredCategories.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      className="text-[10px] font-mono font-bold uppercase text-[#161514] dark:text-[#FAF8F5] hover:underline cursor-pointer bg-transparent border-none"
                    >
                      {showAllCategories ? "Compact Rail" : "Search All ▾"}
                    </button>
                  )}
                </div>

                {!showAllCategories ? (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {filteredCategories.map((cat) => {
                      const isSelected = (categoryId || filteredCategories[0]?.id) === cat.id;
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
                            "px-3 py-1.5 rounded-xl border text-xs font-heading font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs active:scale-95",
                            isSelected
                              ? "bg-[#161514] text-[#CEF431] border-[#161514] dark:bg-[#CEF431] dark:text-[#161514] dark:border-[#CEF431]"
                              : "bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#2A2724] hover:border-[#161514]"
                          )}
                        >
                          <CategoryIcon name={cat.icon} className="size-3.5" />
                          <span>{cat.name}</span>
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
                        className="px-2.5 py-1.5 rounded-xl border border-dashed border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] hover:bg-[#FEF08A] dark:hover:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1"
                        title="Create a new custom category"
                      >
                        <Plus className="size-3.5 stroke-[2.5]" />
                        <span>+ New</span>
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

              {/* 5. Compact 1-Row Payment Method Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E] block px-0.5">
                  Payment Method
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "upi", label: "UPI / QR", icon: Smartphone },
                    { id: "cash", label: "Cash", icon: Banknote },
                    { id: "card", label: "Card", icon: CreditCard },
                    { id: "bank", label: "Bank", icon: Building2 },
                  ].map((m) => {
                    const isSelected = paymentMethod.toLowerCase() === m.id;
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
                          "py-2 px-2 rounded-xl border text-[11px] font-heading font-black transition-all flex items-center justify-center gap-1.5 shadow-xs active:translate-y-0.5 cursor-pointer",
                          isSelected
                            ? "bg-[#161514] text-white border-[#161514] dark:bg-white dark:text-[#161514] dark:border-white"
                            : "bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#F1EFEA] dark:hover:bg-[#252321]"
                        )}
                      >
                        <Icon className="size-3.5 stroke-[2]" />
                        <span className="truncate">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Compact Inline Quick Extras (Receipt Scan / Split IOU / Delete) */}
              {(onOpenReceiptScan || onOpenWhoOwesWho || (isEditing && onDelete)) && (
                <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                  {onOpenReceiptScan && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenChange(false);
                        onOpenReceiptScan();
                      }}
                      className="flex-1 py-2 px-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] hover:bg-white dark:hover:bg-[#201D1A] text-xs font-heading font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Receipt className="size-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Scan Receipt</span>
                    </button>
                  )}

                  {onOpenWhoOwesWho && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenChange(false);
                        onOpenWhoOwesWho({
                          amount: numericAmount || undefined,
                          description: note || undefined,
                        });
                      }}
                      className="flex-1 py-2 px-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] hover:bg-white dark:hover:bg-[#201D1A] text-xs font-heading font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Users className="size-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Split / IOU</span>
                    </button>
                  )}

                  {isEditing && onDelete && (
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDelete}
                      className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 text-xs font-heading font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="size-3.5 stroke-[2]" />
                      <span>{isDeleting ? "Deleting…" : "Delete"}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ─── STICKY HANDY MAIN CTA FOOTER (Never scrolled out of sight) ─── */}
            <div className="shrink-0 px-4 py-3 border-t border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#161514]">
              <button
                type="submit"
                disabled={isSubmitting || !isValidAmount}
                className="w-full py-3 rounded-2xl border-2 border-[#161514] bg-[#CEF431] hover:bg-[#d8fa4d] text-[#161514] font-heading font-black text-sm shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <span>
                  {isSubmitting
                    ? "Saving…"
                    : isEditing
                    ? `Save Changes${isValidAmount ? ` • ${currencySymbol}${numericAmount.toLocaleString()}` : ""}`
                    : `${type === "expense" ? "Log Expense" : "Log Income"}${isValidAmount ? ` • ${currencySymbol}${numericAmount.toLocaleString()}` : ""}`}
                </span>
              </button>
            </div>
          </form>
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
