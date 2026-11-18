"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useWhoOwesWhoStore, type IOU, type IOUType } from "@/store/who-owes-who-store";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Users,
  Plus,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Calendar,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Clock,
  Sparkles,
} from "lucide-react";

export interface WhoOwesWhoTabViewProps {
  currencySymbol: string;
  prefill?: {
    amount?: number;
    description?: string;
    personName?: string;
  } | null;
  onLogSettlementIncome?: (iou: IOU) => Promise<any> | void;
}

export function WhoOwesWhoTabView({
  currencySymbol,
  prefill,
  onLogSettlementIncome,
}: WhoOwesWhoTabViewProps) {
  const { ious, addIOU, settleIOU, unsettleIOU, deleteIOU } = useWhoOwesWhoStore();

  // Active filter tab: "lent" (They Owe Me) vs "borrowed" (I Owe Them)
  const [activeTab, setActiveTab] = useState<IOUType>("lent");

  // Form states for creating a new IOU
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<IOUType>("lent");
  const [dueDate, setDueDate] = useState("");
  const [showSettled, setShowSettled] = useState(false);

  // Apply prefill if provided
  useEffect(() => {
    if (prefill) {
      if (prefill.amount) setAmount(String(prefill.amount));
      if (prefill.description) setDescription(prefill.description);
      if (prefill.personName) setPersonName(prefill.personName);
      setType("lent");
      setIsFormOpen(true);
    }
  }, [prefill]);

  // Aggregate sums
  const { totalLent, totalBorrowed, netOwed } = useMemo(() => {
    let lent = 0;
    let borrowed = 0;

    ious.forEach((iou) => {
      if (iou.status === "pending") {
        if (iou.type === "lent") lent += iou.amount;
        else borrowed += iou.amount;
      }
    });

    return {
      totalLent: lent,
      totalBorrowed: borrowed,
      netOwed: lent - borrowed,
    };
  }, [ious]);

  // Filtered lists
  const pendingItems = useMemo(() => {
    return ious.filter((iou) => iou.type === activeTab && iou.status === "pending");
  }, [ious, activeTab]);

  const settledItems = useMemo(() => {
    return ious.filter((iou) => iou.type === activeTab && iou.status === "settled");
  }, [ious, activeTab]);

  const handleCreateIOU = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!personName.trim() || !numAmt || numAmt <= 0) {
      toast.error("Please enter a name and valid amount");
      return;
    }

    soundFX.playCompleteChime();
    soundFX.vibrate(20);

    addIOU({
      personName: personName.trim(),
      amount: numAmt,
      type,
      description: description.trim() || (type === "lent" ? "Money lent" : "Money borrowed"),
      dueDate: dueDate || undefined,
    });

    toast.success(`Tracked ${currencySymbol}${numAmt} with ${personName}! 🤝`);

    // Reset form
    setPersonName("");
    setAmount("");
    setDescription("");
    setDueDate("");
    setIsFormOpen(false);
  };

  const handleSettle = async (iou: IOU) => {
    soundFX.playCompleteChime();
    soundFX.vibrate(25);
    settleIOU(iou.id);

    // If they owed us money, ask to log incoming repayment
    if (iou.type === "lent" && onLogSettlementIncome) {
      toast.success(`Marked as settled with ${iou.personName}!`, {
        action: {
          label: "Log in Ledger",
          onClick: () => {
            onLogSettlementIncome(iou);
          },
        },
      });
    } else {
      toast.success(`Settled ${currencySymbol}${iou.amount} with ${iou.personName}`);
    }
  };

  const generateWhatsAppReminder = (iou: IOU) => {
    const text = `Hey ${iou.personName}, just a gentle ping regarding ${currencySymbol}${iou.amount} for "${iou.description}" tracked in Invictus 🤝`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-4">
      {/* ─── IN-SITU POWER HEADER & NET DEBT COCKPIT ─── */}
      <div className="bg-white dark:bg-[#161514] p-4 sm:p-5 rounded-3xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center justify-center shadow-xs shrink-0">
              <Users className="size-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-heading font-black text-[#161514] dark:text-[#FAF8F5] leading-tight">
                  Who Owes Who 🤝
                </h3>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                  Student Debt Deck
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] mt-0.5">
                Track shared meals, borrowed cash, and 1-tap debt settlements
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setIsFormOpen(!isFormOpen);
            }}
            className="py-2 px-3.5 rounded-2xl bg-[#161514] text-white dark:bg-[#CEF431] dark:text-[#161514] text-xs font-heading font-black flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all shrink-0 border border-[#161514] dark:border-[#CEF431]"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>{isFormOpen ? "Close Form" : "Track New IOU"}</span>
          </button>
        </div>

        {/* 3-Pillar Net Debt Metric Strip */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531] text-center">
            <span className="text-[10px] font-mono uppercase text-[#6B6B6B] dark:text-[#A8A29E] block">
              They Owe Me
            </span>
            <span className="text-sm sm:text-base font-mono font-black text-[#047857] dark:text-[#03D26F] tabular-nums mt-0.5 block">
              +{currencySymbol}{totalLent.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531] text-center">
            <span className="text-[10px] font-mono uppercase text-[#6B6B6B] dark:text-[#A8A29E] block">
              I Owe Them
            </span>
            <span className="text-sm sm:text-base font-mono font-black text-rose-600 dark:text-rose-400 tabular-nums mt-0.5 block">
              -{currencySymbol}{totalBorrowed.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531] text-center">
            <span className="text-[10px] font-mono uppercase text-[#6B6B6B] dark:text-[#A8A29E] block">
              Net Balance
            </span>
            <span
              className={cn(
                "text-sm sm:text-base font-mono font-black tabular-nums mt-0.5 block",
                netOwed >= 0
                  ? "text-[#047857] dark:text-[#03D26F]"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {netOwed >= 0 ? "+" : ""}{currencySymbol}{netOwed.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ─── COLLAPSIBLE ADD IOU FORM ─── */}
        {isFormOpen && (
          <form
            onSubmit={handleCreateIOU}
            className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-2xl p-4 border-2 border-[#161514] dark:border-[#CEF431] shadow-[2.5px_2.5px_0px_0px_#161514] space-y-3 transition-all"
          >
            <div className="flex items-center justify-between pb-1 border-b border-[#E8E5DF] dark:border-[#2A2724]">
              <span className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
                Log New Debt / Split
              </span>
              <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                Saved offline in store
              </span>
            </div>

            {/* Type Switcher */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("lent")}
                className={cn(
                  "flex-1 py-1.5 rounded-xl text-xs font-heading font-bold border transition-all cursor-pointer",
                  type === "lent"
                    ? "bg-[#03D26F] text-[#161514] border-[#161514] shadow-xs"
                    : "bg-white dark:bg-[#252321] text-[#6B6B6B] dark:text-[#A8A29E] border-[#E8E5DF] dark:border-[#383531]"
                )}
              >
                They Owe Me (I Paid)
              </button>
              <button
                type="button"
                onClick={() => setType("borrowed")}
                className={cn(
                  "flex-1 py-1.5 rounded-xl text-xs font-heading font-bold border transition-all cursor-pointer",
                  type === "borrowed"
                    ? "bg-rose-500 text-white border-[#161514] shadow-xs"
                    : "bg-white dark:bg-[#252321] text-[#6B6B6B] dark:text-[#A8A29E] border-[#E8E5DF] dark:border-[#383531]"
                )}
              >
                I Owe Them (They Paid)
              </button>
            </div>

            {/* Person Name & Amount Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">
                  Person Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul, Sneha, Roommate"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-white dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#161514]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">
                  Amount ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold bg-white dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#161514]"
                />
              </div>
            </div>

            {/* Description & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pizza split, Cab fare, Textbook"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-white dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#161514]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">
                  Expected Repayment Date (Optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-white dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#161514]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-heading font-medium text-[#6B6B6B] hover:text-[#161514] dark:text-[#A8A29E] dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-[#161514] dark:bg-[#CEF431] text-white dark:text-[#161514] text-xs font-heading font-black shadow-xs active:scale-95 transition-all cursor-pointer border border-[#161514] dark:border-[#CEF431]"
              >
                Save Record
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ─── SEGMENTED TAB SWITCHER: "They Owe Me" vs "I Owe Them" ─── */}
      <div className="bg-white dark:bg-[#161514] p-1.5 rounded-2xl border border-[#E8E5DF] dark:border-[#383531] flex gap-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            setActiveTab("lent");
          }}
          className={cn(
            "flex-1 py-2 px-3 rounded-xl text-xs font-heading font-black transition-all cursor-pointer flex items-center justify-center gap-1.5",
            activeTab === "lent"
              ? "bg-[#161514] text-white dark:bg-[#CEF431] dark:text-[#161514] shadow-xs"
              : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-white bg-transparent"
          )}
        >
          <ArrowUpRight className="size-3.5 stroke-[2.5]" />
          <span>They Owe Me</span>
          <span className="text-[10px] font-mono opacity-80">
            ({ious.filter((i) => i.type === "lent" && i.status === "pending").length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            setActiveTab("borrowed");
          }}
          className={cn(
            "flex-1 py-2 px-3 rounded-xl text-xs font-heading font-black transition-all cursor-pointer flex items-center justify-center gap-1.5",
            activeTab === "borrowed"
              ? "bg-[#161514] text-white dark:bg-[#CEF431] dark:text-[#161514] shadow-xs"
              : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-white bg-transparent"
          )}
        >
          <ArrowDownLeft className="size-3.5 stroke-[2.5]" />
          <span>I Owe Them</span>
          <span className="text-[10px] font-mono opacity-80">
            ({ious.filter((i) => i.type === "borrowed" && i.status === "pending").length})
          </span>
        </button>
      </div>

      {/* ─── PENDING IOU ITEMS LIST ─── */}
      <div className="space-y-2.5">
        {pendingItems.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#161514] rounded-3xl border border-dashed border-[#E8E5DF] dark:border-[#383531] space-y-2">
            <span className="text-2xl">✨</span>
            <p className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
              {activeTab === "lent"
                ? "No one owes you money right now!"
                : "You don't owe anyone right now. Clean slate!"}
            </p>
            <p className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E] max-w-xs mx-auto">
              Tap &quot;Track New IOU&quot; above whenever you split a cab, dinner, or borrow cash.
            </p>
          </div>
        ) : (
          pendingItems.map((iou) => (
            <div
              key={iou.id}
              className="bg-white dark:bg-[#161514] p-3.5 sm:p-4 rounded-2xl border border-[#E8E5DF] dark:border-[#383531] shadow-xs hover:border-[#161514]/30 dark:hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={cn(
                    "size-10 rounded-2xl flex items-center justify-center shrink-0 border",
                    iou.type === "lent"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-[#047857] dark:text-[#03D26F] border-emerald-200 dark:border-emerald-800"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                  )}
                >
                  {iou.type === "lent" ? (
                    <ArrowUpRight className="size-5 stroke-[2.5]" />
                  ) : (
                    <ArrowDownLeft className="size-5 stroke-[2.5]" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-heading font-bold text-sm text-[#161514] dark:text-[#FAF8F5] truncate">
                      {iou.personName}
                    </h4>
                    {iou.dueDate && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] bg-[#FAF8F5] dark:bg-[#1C1A18] px-1.5 py-0.5 rounded border border-[#E8E5DF] dark:border-[#383531]">
                        <Clock className="size-2.5" />
                        <span>Due {iou.dueDate}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] mt-0.5 truncate">
                    {iou.description}
                  </p>
                </div>
              </div>

              {/* Amount & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8E5DF]/60 dark:border-[#2A2724]">
                <div className="text-left sm:text-right">
                  <span
                    className={cn(
                      "font-mono font-black text-sm sm:text-base tabular-nums",
                      iou.type === "lent"
                        ? "text-[#047857] dark:text-[#03D26F]"
                        : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {iou.type === "lent" ? "+" : "-"}{currencySymbol}{iou.amount.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* WhatsApp Reminder Button (for money lent) */}
                  {iou.type === "lent" && (
                    <a
                      href={generateWhatsAppReminder(iou)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="size-8 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-[#E8E5DF] dark:border-[#383531] flex items-center justify-center transition-colors shadow-xs"
                      title="Send polite WhatsApp ping"
                    >
                      <MessageCircle className="size-3.5" />
                    </a>
                  )}

                  {/* Settle Button */}
                  <button
                    type="button"
                    onClick={() => handleSettle(iou)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#03D26F] hover:bg-[#02be64] text-[#161514] text-xs font-heading font-black border border-[#161514] shadow-xs active:scale-95 transition-all cursor-pointer"
                    title="Mark this IOU as settled"
                  >
                    <CheckCircle2 className="size-3 stroke-[2.5]" />
                    <span>Settle</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      deleteIOU(iou.id);
                      toast.success("Record deleted");
                    }}
                    className="size-8 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#6B6B6B] hover:text-rose-600 border border-[#E8E5DF] dark:border-[#383531] flex items-center justify-center transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── SETTLED HISTORY ACCORDION ─── */}
      {settledItems.length > 0 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setShowSettled(!showSettled);
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#383531] text-xs font-heading font-black text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-white transition-colors cursor-pointer shadow-xs"
          >
            <span>Settled History ({settledItems.length})</span>
            {showSettled ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {showSettled && (
            <div className="space-y-2 mt-2">
              {settledItems.map((iou) => (
                <div
                  key={iou.id}
                  className="bg-white/60 dark:bg-[#161514]/60 p-3 rounded-xl border border-[#E8E5DF] dark:border-[#383531] flex items-center justify-between opacity-70"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-heading font-bold text-xs text-[#161514] dark:text-[#FAF8F5] block truncate">
                      {iou.personName} · {iou.description}
                    </span>
                    <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                      Settled on {iou.settledAt ? new Date(iou.settledAt).toLocaleDateString() : "Done"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-xs text-[#6B6B6B] dark:text-[#A8A29E] line-through tabular-nums">
                      {currencySymbol}{iou.amount.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playPop();
                        unsettleIOU(iou.id);
                        toast.info(`Moved back to pending with ${iou.personName}`);
                      }}
                      className="size-7 rounded-lg bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531] flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-[#252321] transition-colors"
                      title="Undo settlement"
                    >
                      <RotateCcw className="size-3 text-[#6B6B6B]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
