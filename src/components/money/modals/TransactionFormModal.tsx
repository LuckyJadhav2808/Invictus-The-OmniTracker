"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { NeobrutalistDateTimePickerModal } from "@/components/shared/NeobrutalistDateTimePickerModal";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { type Transaction, type Category } from "@/types";
import { Trash2, Calendar, Plus, Sparkles, Tag } from "lucide-react";
import { renderCategoryEmoji } from "@/components/money/MoneyQuickActionsAndCards";

import { detectCategoryFromNote } from "@/lib/utils/merchant-categorizer";

interface TransactionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Transaction | null;
  categories: Category[];
  currencySymbol: string;
  onOpenAddCategory?: () => void;
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

export function TransactionFormModal({
  open,
  onOpenChange,
  initialData,
  categories,
  currencySymbol,
  onOpenAddCategory,
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
  const [showMorePaymentMethods, setShowMorePaymentMethods] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Custom Neobrutalist Date Picker modal state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Visual auto-match feedback badge
  const [matchedCategoryName, setMatchedCategoryName] = useState<string | null>(null);

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

  // Top visual category tiles (up to 11 for a clean 3x4 or 4x3 grid with + New tile)
  const topCategoryTiles = useMemo(() => {
    return filteredCategories.slice(0, 11);
  }, [filteredCategories]);

  // Additive quick-chip button handler
  const handleQuickIncrement = (inc: number) => {
    soundFX.playPop();
    soundFX.vibrate(15);
    const curr = parseFloat(amount) || 0;
    setAmount(String(curr + inc));
  };

  // Smart multi-tier note auto-matching for category
  const handleNoteChange = (val: string) => {
    setNote(val);
    if (!val.trim()) {
      setMatchedCategoryName(null);
      return;
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: initialData?.id,
        amount: numAmt,
        type,
        categoryId: categoryId || filteredCategories[0]?.id || "",
        date,
        note: note.trim(),
        paymentMethod,
      });
      soundFX.playCashRegister();
      soundFX.vibrate([30, 50, 30]);
      onOpenChange(false);
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

  // Format date display cleanly
  const formattedDateLabel = useMemo(() => {
    try {
      const parsed = parseISO(date);
      return format(parsed, "EEE, d MMM yyyy");
    } catch {
      return date;
    }
  }, [date]);

  return (
    <>
      <ResponsiveFormContainer
        open={open}
        onOpenChange={onOpenChange}
        title={isEditing ? "Edit Transaction" : "Log Transaction"}
        description={isEditing ? "Update your financial record details" : "Quickly log your daily expense or income"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Type Switcher: Expense vs Income */}
          <div className="flex gap-2">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setType(t);
                  setMatchedCategoryName(null);
                  const nextCats = categories.filter((c) => c.type === t && !c.archived);
                  setCategoryId(nextCats[0]?.id || "");
                }}
                className={cn(
                  "flex-1 py-2.5 rounded-xl border-2 border-[#161514] text-xs font-black transition-all uppercase tracking-wider cursor-pointer shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
                  type === t
                    ? t === "income"
                      ? "bg-[#03D26F] text-[#161514]"
                      : "bg-[#161514] text-white"
                    : "bg-white text-[#161514]/70 hover:bg-[#FAF8F5]"
                )}
              >
                {t === "expense" ? "💸 Expense" : "💰 Income"}
              </button>
            ))}
          </div>

          {/* ⚡ HERO AMOUNT DISPLAY WITH ADDITIVE CHIPS */}
          <div className="space-y-2 bg-[#FAF8F5] p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
            <label htmlFor="tx-hero-amount" className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
              Amount ({currencySymbol}) *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-2xl font-black text-[#161514]/60 pointer-events-none font-heading">
                {currencySymbol}
              </span>
              <input
                id="tx-hero-amount"
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus={!isEditing}
                required
                className="w-full bg-white pl-9 pr-4 py-2.5 text-2xl sm:text-3xl font-black text-[#161514] rounded-xl border-2 border-[#161514] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] font-heading tracking-tight"
              />
            </div>

            {/* Additive Quick Increment Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              {QUICK_INCREMENTS.map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleQuickIncrement(inc)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#CEF431] text-[#161514] text-[10px] font-black border border-[#161514] shadow-[1px_1px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all shrink-0 cursor-pointer"
                >
                  +{inc}
                </button>
              ))}
            </div>
          </div>

          {/* 🍔 1-TAP VISUAL CATEGORY GRID WITH [+ NEW] TILE */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                  Category *
                </label>
                <span className="text-[10px] font-mono text-[#161514]/60">
                  ({filteredCategories.length} available)
                </span>
              </div>
              {filteredCategories.length > 7 && (
                <button
                  type="button"
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="text-[9px] font-black uppercase text-navy-700 hover:underline cursor-pointer border-none bg-transparent"
                >
                  {showAllCategories ? "Show Tiles" : "Search All ▾"}
                </button>
              )}
            </div>

            {!showAllCategories ? (
              <div className="grid grid-cols-4 gap-1.5">
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
                        "p-2 rounded-xl border-2 border-[#161514] text-center transition-all cursor-pointer flex flex-col items-center gap-1 shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
                        isSelected
                          ? "bg-[#CEF431] text-[#161514] ring-2 ring-[#161514]"
                          : "bg-white text-[#161514]/80 hover:bg-[#FAF8F5]"
                      )}
                    >
                      <span className="text-lg leading-none">{renderCategoryEmoji(cat.icon)}</span>
                      <span className="text-[9px] font-black uppercase tracking-tight truncate w-full">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}

                {/* ➕ 1-TAP [ + NEW ] CATEGORY TILE */}
                {onOpenAddCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      onOpenAddCategory();
                    }}
                    className="p-2 rounded-xl border-2 border-dashed border-[#161514] bg-[#FAF8F5] hover:bg-[#FEF08A] text-[#161514] text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    title="Create a new custom category"
                  >
                    <Plus className="size-4 stroke-[3] text-[#161514]" />
                    <span className="text-[9px] font-black uppercase tracking-tight">
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
                  icon: renderCategoryEmoji(c.icon),
                }))}
                placeholder="Select Category"
              />
            )}
          </div>

          {/* 📱 PAYMENT METHOD & 📅 NEOBRUTALIST DATE PICKER */}
          <div className="grid grid-cols-2 gap-3">
            {/* Payment Method */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#161514]">
                  Mode *
                </label>
                <button
                  type="button"
                  onClick={() => setShowMorePaymentMethods(!showMorePaymentMethods)}
                  className="text-[9px] font-black uppercase text-navy-700 hover:underline cursor-pointer border-none bg-transparent"
                >
                  {showMorePaymentMethods ? "Simple" : "Card/Bank ▾"}
                </button>
              </div>

              {!showMorePaymentMethods ? (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setPaymentMethod("upi");
                    }}
                    className={cn(
                      "py-2 px-2 rounded-xl border-2 border-[#161514] text-xs font-black transition-all flex items-center justify-center gap-1 shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer",
                      paymentMethod !== "cash"
                        ? "bg-[#03D26F] text-[#161514]"
                        : "bg-white text-[#161514]/70 hover:bg-[#FAF8F5]"
                    )}
                  >
                    <span>📱</span>
                    <span>UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setPaymentMethod("cash");
                    }}
                    className={cn(
                      "py-2 px-2 rounded-xl border-2 border-[#161514] text-xs font-black transition-all flex items-center justify-center gap-1 shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer",
                      paymentMethod === "cash"
                        ? "bg-amber-400 text-[#161514]"
                        : "bg-white text-[#161514]/70 hover:bg-[#FAF8F5]"
                    )}
                  >
                    <span>💵</span>
                    <span>Cash</span>
                  </button>
                </div>
              ) : (
                <NeobrutalistSelect
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={[
                    { value: "upi", label: "UPI / Online", icon: "📱" },
                    { value: "cash", label: "Cash", icon: "💵" },
                    { value: "card", label: "Debit/Credit Card", icon: "💳" },
                    { value: "bank", label: "Bank Transfer", icon: "🏦" },
                  ]}
                />
              )}
            </div>

            {/* Custom Neobrutalist Date Picker Trigger */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#161514]">
                Date *
              </label>
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setIsDatePickerOpen(true);
                }}
                className="w-full neo-input flex items-center justify-between py-2 px-2.5 text-xs font-heading font-black cursor-pointer hover:bg-[#FAF8F5] transition-colors"
                title="Open calendar picker"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Calendar className="size-3.5 text-[#161514] shrink-0" />
                  <span className="truncate">{formattedDateLabel}</span>
                </span>
                <span className="text-[9px] font-mono font-bold text-[#161514]/60 bg-[#FAF8F5] border border-[#161514]/30 rounded px-1 shrink-0">
                  Pick ▾
                </span>
              </button>
            </div>
          </div>

          {/* 📝 Note / Merchant Description with Auto-Suggest */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="tx-notes" className="text-[10px] font-black uppercase tracking-wider text-[#161514]">
                Note / Merchant (Optional)
              </label>
              {matchedCategoryName && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-[#CEF431] border border-[#161514] rounded-md shadow-[1px_1px_0px_0px_#161514] animate-in fade-in zoom-in-95 duration-150">
                  <Sparkles className="size-2.5 text-[#161514] stroke-[3]" />
                  <span className="font-doodle text-[10px] font-bold text-[#161514]">
                    Auto-matched: {matchedCategoryName}
                  </span>
                </div>
              )}
            </div>
            <input
              id="tx-notes"
              type="text"
              value={note}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="e.g. Swiggy biryani, momos, metro, chai, stationary..."
              className="w-full neo-input text-xs sm:text-sm font-bold"
            />
          </div>

          {/* 🔘 Form Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {isEditing && onDelete && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="p-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                title="Delete Transaction"
              >
                <Trash2 className="size-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#CEF431] hover:bg-[#bde422] text-[#161514] font-black text-xs uppercase tracking-wider rounded-xl py-3 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Log Record 🚀"}
            </button>
          </div>
        </form>

        {/* 📅 Custom Neobrutalist Date Picker Modal Dialog (Nested inside container to inherit portal context) */}
        <NeobrutalistDateTimePickerModal
          open={isDatePickerOpen}
          onOpenChange={setIsDatePickerOpen}
          dateValue={date}
          onSave={(newDate) => {
            setDate(newDate);
          }}
          title="Transaction Date"
        />
      </ResponsiveFormContainer>
    </>
  );
}
