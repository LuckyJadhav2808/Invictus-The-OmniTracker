"use client";

import { useState, useEffect, useMemo } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { useWhoOwesWhoStore, type IOU, type IOUType } from "@/store/who-owes-who-store";
import { formatReminderMessage, calculateDueDateStatus } from "@/components/money/views/WhoOwesWhoTabView";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { confettiBurst } from "@/lib/ui/confetti-burst";
import { format } from "date-fns";
import {
  Users,
  Plus,
  CheckCircle2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  MessageCircle,
  Share2,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";

export interface WhoOwesWhoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencySymbol?: string;
  prefill?: {
    amount?: number;
    description?: string;
    personName?: string;
  } | null;
  defaultOpenForm?: boolean;
  hideHeader?: boolean;
  onLogSettlementIncome?: (iou: IOU) => Promise<any> | void;
}

export function WhoOwesWhoModal({
  open,
  onOpenChange,
  currencySymbol = "₹",
  prefill,
  onLogSettlementIncome,
  defaultOpenForm = true,
}: WhoOwesWhoModalProps) {
  const { ious, addIOU, settleIOU, deleteIOU } = useWhoOwesWhoStore();

  // Mode: "log" (Fast 1-Tap Form) vs "debts" (Active Balances List)
  const [modalMode, setModalMode] = useState<"log" | "debts">(defaultOpenForm ? "log" : "debts");

  // Filter tab within debts view: "lent" vs "borrowed"
  const [debtFilterTab, setDebtFilterTab] = useState<IOUType>("lent");

  // Form states
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<IOUType>("lent");
  const [dueDate, setDueDate] = useState("");

  // Sync prefill values
  useEffect(() => {
    if (prefill) {
      if (prefill.amount) setAmount(String(prefill.amount));
      if (prefill.description) setDescription(prefill.description);
      if (prefill.personName) setPersonName(prefill.personName);
      setModalMode("log");
    }
  }, [prefill]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setModalMode(defaultOpenForm ? "log" : "debts");
      if (!prefill) {
        setPersonName("");
        setAmount("");
        setDescription("");
        setType("lent");
        setDueDate("");
      }
    }
  }, [open, defaultOpenForm, prefill]);

  // Recent contacts from existing IOUs
  const recentContacts = useMemo(() => {
    const names = Array.from(new Set(ious.map((i) => i.personName.trim()))).filter(Boolean);
    return names.slice(0, 5);
  }, [ious]);

  // Totals calculations
  const totalLent = useMemo(() => {
    return ious
      .filter((i) => i.type === "lent" && i.status === "pending")
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  }, [ious]);

  const totalBorrowed = useMemo(() => {
    return ious
      .filter((i) => i.type === "borrowed" && i.status === "pending")
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  }, [ious]);

  const netOwed = totalLent - totalBorrowed;

  const pendingItems = useMemo(() => {
    return ious
      .filter((i) => i.type === debtFilterTab && i.status === "pending")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [ious, debtFilterTab]);

  const pendingCount = useMemo(() => {
    return ious.filter((i) => i.status === "pending").length;
  }, [ious]);

  // Handle Form Submission
  const handleCreateIOU = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!personName.trim()) {
      toast.error("Please enter a friend's name");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    addIOU({
      personName: personName.trim(),
      amount: numAmount,
      type,
      description: description.trim() || (type === "lent" ? "Split bill" : "Borrowed cash"),
      dueDate: dueDate || undefined,
    });

    soundFX.playPop();
    soundFX.vibrate(20);
    confettiBurst();

    toast.success(
      type === "lent"
        ? `Logged split: ${personName} owes you ${currencySymbol}${numAmount.toLocaleString()} 🤝`
        : `Logged split: You owe ${personName} ${currencySymbol}${numAmount.toLocaleString()} 💸`
    );

    // Reset fields & switch to debts tab
    setPersonName("");
    setAmount("");
    setDescription("");
    setDueDate("");
    setDebtFilterTab(type);
    setModalMode("debts");
  };

  // WhatsApp / Share Reminder
  const handleShareReminder = (iou: IOU) => {
    soundFX.playPop();
    const msg = formatReminderMessage(iou, currencySymbol);

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: "Invictus Split Reminder",
        text: msg,
      }).catch(() => {
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    }
  };

  // Settle IOU
  const handleSettle = async (iou: IOU) => {
    soundFX.playPop();
    soundFX.vibrate(25);
    confettiBurst();

    settleIOU(iou.id);

    if (iou.type === "lent" && onLogSettlementIncome) {
      try {
        await onLogSettlementIncome(iou);
      } catch (e) {
        console.error("Auto log income failed:", e);
      }
    }

    toast.success(`Settled debt with ${iou.personName}! 🎉`);
  };

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title="Who Owes Who 🤝"
      description="Track shared expenses, splits, and friendly debts"
      maxWidth="sm:max-w-xl"
    >
      <div className="space-y-3.5 pt-1 text-[#161514] dark:text-[#FAF8F5]">
        {/* ─── TOP MODE SWITCHER ─── */}
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-1 rounded-2xl border-2 border-[#161514] dark:border-[#383531] flex gap-1 shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000]">
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setModalMode("log");
            }}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs font-heading font-black transition-all cursor-pointer flex items-center justify-center gap-1.5",
              modalMode === "log"
                ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] shadow-xs"
                : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-white"
            )}
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>+ Log New Split</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setModalMode("debts");
            }}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs font-heading font-black transition-all cursor-pointer flex items-center justify-center gap-1.5",
              modalMode === "debts"
                ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] shadow-xs"
                : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-white"
            )}
          >
            <Users className="size-3.5 stroke-[2.5]" />
            <span>Active Debts ({pendingCount})</span>
          </button>
        </div>

        {/* ═══════════════ MODE 1: LOG SPLIT / DEBT FORM ═══════════════ */}
        {modalMode === "log" && (
          <form
            onSubmit={handleCreateIOU}
            className="bg-white dark:bg-[#161514] rounded-2xl p-4 sm:p-5 border-2 border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] space-y-3.5 animate-in fade-in duration-150"
          >
            {/* Type Switcher */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setType("lent");
                }}
                className={cn(
                  "py-2.5 px-3 rounded-xl text-xs font-heading font-black border-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px]",
                  type === "lent"
                    ? "bg-[#03D26F] text-[#161514] border-[#161514] shadow-[2px_2px_0px_0px_#161514]"
                    : "bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#6B6B6B] dark:text-[#A8A29E] border-[#E8E5DF] dark:border-[#383531] hover:border-[#161514]"
                )}
              >
                <ArrowUpRight className="size-3.5 stroke-[2.5]" />
                <span>They Owe Me (I Paid)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setType("borrowed");
                }}
                className={cn(
                  "py-2.5 px-3 rounded-xl text-xs font-heading font-black border-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px]",
                  type === "borrowed"
                    ? "bg-rose-500 text-white border-[#161514] shadow-[2px_2px_0px_0px_#161514]"
                    : "bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#6B6B6B] dark:text-[#A8A29E] border-[#E8E5DF] dark:border-[#383531] hover:border-[#161514]"
                )}
              >
                <ArrowDownLeft className="size-3.5 stroke-[2.5]" />
                <span>I Owe Them (They Paid)</span>
              </button>
            </div>

            {/* 1-Tap Recent Friends */}
            {recentContacts.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E] block">
                  1-Tap Friend
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {recentContacts.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        soundFX.playPop();
                        setPersonName(name);
                      }}
                      className={cn(
                        "px-3 py-1 rounded-xl text-xs font-mono font-bold border-2 transition-all cursor-pointer shrink-0 active:scale-95",
                        personName.toLowerCase() === name.toLowerCase()
                          ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] border-[#161514] dark:border-[#CEF431] shadow-[1.5px_1.5px_0px_0px_#161514]"
                          : "bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#383531] hover:border-[#161514]"
                      )}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Friend Name & Amount Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">
                  Friend&apos;s Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul, Sneha, Roommate"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-heading font-bold bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#161514] shadow-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">
                  Amount ({currencySymbol}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-black text-[#161514] dark:text-[#FAF8F5] opacity-60">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-7 pr-3.5 py-2.5 rounded-xl text-xs font-mono font-black bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#161514] shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Quick Increment Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E]">
                Quick Add:
              </span>
              {[50, 100, 200, 500, 1000].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    soundFX.vibrate(15);
                    const curr = parseFloat(amount) || 0;
                    setAmount(String(curr + inc));
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] border border-[#161514]/30 dark:border-[#383531] shadow-xs active:scale-95 transition-all cursor-pointer hover:border-[#161514]"
                >
                  +{currencySymbol}{inc}
                </button>
              ))}
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount("")}
                  className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Description & Expected Repayment Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pizza split, Cab fare, Textbook"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-sans font-semibold bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#161514] shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">
                  Expected Repayment Date (Optional)
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: "Today", days: 0 },
                    { label: "+3d", days: 3 },
                    { label: "+1w", days: 7 },
                    { label: "+1m", days: 30 },
                  ].map((preset) => {
                    const targetDateStr = format(preset.days === 0 ? new Date() : new Date(Date.now() + preset.days * 86400000), "yyyy-MM-dd");
                    const isSelected = dueDate === targetDateStr;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          soundFX.playPop();
                          setDueDate(targetDateStr);
                        }}
                        className={cn(
                          "px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer shadow-xs",
                          isSelected
                            ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] border-[#161514] dark:border-[#CEF431]"
                            : "bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#383531] hover:border-[#161514]"
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#161514]/30 dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] focus:outline-none shadow-xs"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#161514]/15 dark:border-white/10">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-xl text-xs font-heading font-black border-2 border-[#161514]/30 dark:border-[#383531] text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5] hover:border-[#161514] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#161514] dark:bg-[#CEF431] text-white dark:text-[#161514] text-xs font-heading font-black border-2 border-[#161514] dark:border-[#CEF431] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
              >
                Save Record
              </button>
            </div>
          </form>
        )}

        {/* ═══════════════ MODE 2: ACTIVE DEBTS & BALANCES ═══════════════ */}
        {modalMode === "debts" && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* 3-Pillar Net Debt Metric Strip */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] text-center">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E] block">
                  They Owe Me
                </span>
                <span className="text-sm sm:text-base font-mono font-black text-[#047857] dark:text-[#03D26F] tabular-nums mt-0.5 block truncate">
                  +{currencySymbol}{totalLent.toLocaleString()}
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] text-center">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E] block">
                  I Owe Them
                </span>
                <span className="text-sm sm:text-base font-mono font-black text-rose-600 dark:text-rose-400 tabular-nums mt-0.5 block truncate">
                  -{currencySymbol}{totalBorrowed.toLocaleString()}
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] text-center">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E] block">
                  Net Balance
                </span>
                <span
                  className={cn(
                    "text-sm sm:text-base font-mono font-black tabular-nums mt-0.5 block truncate",
                    netOwed >= 0 ? "text-[#047857] dark:text-[#03D26F]" : "text-rose-600 dark:text-rose-400"
                  )}
                >
                  {netOwed >= 0 ? "+" : ""}{currencySymbol}{netOwed.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Filter Toggle: Lent vs Borrowed */}
            <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-1 rounded-xl border-2 border-[#161514] dark:border-[#383531] flex gap-1">
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setDebtFilterTab("lent");
                }}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-lg text-xs font-heading font-black transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  debtFilterTab === "lent"
                    ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514]"
                    : "text-[#6B6B6B] dark:text-[#A8A29E]"
                )}
              >
                <ArrowUpRight className="size-3.5 stroke-[2.5]" />
                <span>They Owe Me ({ious.filter((i) => i.type === "lent" && i.status === "pending").length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setDebtFilterTab("borrowed");
                }}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-lg text-xs font-heading font-black transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  debtFilterTab === "borrowed"
                    ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514]"
                    : "text-[#6B6B6B] dark:text-[#A8A29E]"
                )}
              >
                <ArrowDownLeft className="size-3.5 stroke-[2.5]" />
                <span>I Owe Them ({ious.filter((i) => i.type === "borrowed" && i.status === "pending").length})</span>
              </button>
            </div>

            {/* IOU Cards List */}
            {pendingItems.length === 0 ? (
              <div className="p-6 text-center bg-white dark:bg-[#161514] rounded-2xl border-2 border-dashed border-[#161514]/30 dark:border-[#383531] space-y-2">
                <span className="text-2xl">✨</span>
                <p className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
                  {debtFilterTab === "lent"
                    ? "No one owes you money right now!"
                    : "You don't owe anyone right now. Clean slate!"}
                </p>
                <button
                  type="button"
                  onClick={() => setModalMode("log")}
                  className="px-3.5 py-1.5 rounded-xl bg-[#CEF431] text-[#161514] text-xs font-heading font-black border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] cursor-pointer active:scale-95 transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="size-3.5 stroke-[2.5]" />
                  <span>Log First Split</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
                {pendingItems.map((iou) => {
                  const dueStatus = calculateDueDateStatus(iou.dueDate);

                  return (
                    <div
                      key={iou.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-black text-sm text-[#161514] dark:text-[#FAF8F5] truncate">
                            {iou.personName}
                          </h4>
                          {dueStatus && (
                            <span
                              className={cn(
                                "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border",
                                dueStatus.isOverdue
                                  ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200"
                                  : dueStatus.isDueToday
                                  ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200"
                                  : "bg-[#FAF8F5] text-[#161514]/70 border-[#161514]/20"
                              )}
                            >
                              {dueStatus.label}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E] truncate mt-0.5">
                          {iou.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            "font-mono font-black text-sm",
                            iou.type === "lent" ? "text-[#03D26F]" : "text-rose-600"
                          )}
                        >
                          {iou.type === "lent" ? "+" : "-"}{currencySymbol}{iou.amount.toLocaleString()}
                        </span>

                        {/* Remind Button */}
                        <button
                          type="button"
                          onClick={() => handleShareReminder(iou)}
                          className="size-8 rounded-xl bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#E8E5DF] text-[#161514] dark:text-[#FAF8F5] border border-[#161514]/30 flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
                          title="Send polite WhatsApp reminder"
                        >
                          <MessageCircle className="size-4 text-emerald-600" />
                        </button>

                        {/* Settle Button */}
                        <button
                          type="button"
                          onClick={() => handleSettle(iou)}
                          className="px-2.5 py-1 rounded-xl bg-[#CEF431] text-[#161514] font-heading font-black text-[11px] border border-[#161514] flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                          title="Mark settled"
                        >
                          <CheckCircle2 className="size-3.5 stroke-[2.5]" />
                          <span>Settle</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => {
                            soundFX.playPop();
                            deleteIOU(iou.id);
                            toast.info("Deleted record");
                          }}
                          className="size-8 rounded-xl bg-white dark:bg-[#252321] hover:bg-rose-50 text-rose-500 border border-[#161514]/20 flex items-center justify-center cursor-pointer active:scale-95"
                          title="Delete record"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </ResponsiveFormContainer>
  );
}
