"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
} from "lucide-react";

interface WhoOwesWhoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencySymbol: string;
  prefill?: {
    amount?: number;
    description?: string;
    personName?: string;
  } | null;
  onLogSettlementIncome?: (iou: IOU) => Promise<any> | void;
}

export function WhoOwesWhoModal({
  open,
  onOpenChange,
  currencySymbol,
  prefill,
  onLogSettlementIncome,
}: WhoOwesWhoModalProps) {
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

  // Apply prefill if provided when opening modal
  useEffect(() => {
    if (open && prefill) {
      if (prefill.amount) setAmount(String(prefill.amount));
      if (prefill.description) setDescription(prefill.description);
      if (prefill.personName) setPersonName(prefill.personName);
      setType("lent");
      setIsFormOpen(true);
    }
  }, [open, prefill]);

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

    // If they owed us money, ask or auto-log incoming repayment
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[88vh] sm:h-[82vh] max-w-2xl mx-auto rounded-t-3xl p-0 bg-[#FAF8F5] dark:bg-[#161514] border-t-2 border-[#161514] dark:border-[#383531] flex flex-col overflow-hidden"
      >
        {/* ─── MODAL HEADER ─── */}
        <SheetHeader className="px-5 pt-4 pb-3 border-b border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#1C1A18] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-2xl bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center justify-center shadow-xs">
                <Users className="size-4 stroke-[2.2]" />
              </div>
              <div>
                <SheetTitle className="text-base font-heading font-black text-[#161514] dark:text-[#FAF8F5] leading-tight">
                  Who Owes Who 🤝
                </SheetTitle>
                <p className="text-[11px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] leading-none mt-0.5">
                  Student IOU &amp; Split Tracker
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="size-8 rounded-full bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#E8E5DF] dark:hover:bg-[#2E2B28] text-[#161514] dark:text-[#FAF8F5] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="size-4 stroke-[2]" />
            </button>
          </div>

          {/* Quick Balance Summary Strip */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-[#E8E5DF] dark:border-[#2A2724] text-center">
            <div className="p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531]">
              <span className="text-[9.5px] font-mono uppercase text-[#6B6B6B] dark:text-[#A8A29E] block">
                They Owe Me
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-[#047857] dark:text-[#03D26F] tabular-nums">
                +{currencySymbol}{totalLent.toLocaleString()}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531]">
              <span className="text-[9.5px] font-mono uppercase text-[#6B6B6B] dark:text-[#A8A29E] block">
                I Owe Them
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                -{currencySymbol}{totalBorrowed.toLocaleString()}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531]">
              <span className="text-[9.5px] font-mono uppercase text-[#6B6B6B] dark:text-[#A8A29E] block">
                Net Position
              </span>
              <span
                className={cn(
                  "text-xs sm:text-sm font-mono font-black tabular-nums",
                  netOwed >= 0
                    ? "text-[#047857] dark:text-[#03D26F]"
                    : "text-rose-600 dark:text-rose-400"
                )}
              >
                {netOwed >= 0 ? "+" : ""}{currencySymbol}{netOwed.toLocaleString()}
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* ─── SCROLLABLE CONTENT ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
          {/* Segmented Tab Bar: "They Owe Me" vs "I Owe Them" */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 bg-white dark:bg-[#1C1A18] p-1 rounded-2xl border border-[#E8E5DF] dark:border-[#383531] flex gap-1 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setActiveTab("lent");
                }}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-xl text-xs font-heading font-black transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  activeTab === "lent"
                    ? "bg-[#161514] text-white dark:bg-[#CEF431] dark:text-[#161514] shadow-xs"
                    : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-white"
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
                  "flex-1 py-1.5 px-3 rounded-xl text-xs font-heading font-black transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  activeTab === "borrowed"
                    ? "bg-[#161514] text-white dark:bg-[#CEF431] dark:text-[#161514] shadow-xs"
                    : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-white"
                )}
              >
                <ArrowDownLeft className="size-3.5 stroke-[2.5]" />
                <span>I Owe Them</span>
                <span className="text-[10px] font-mono opacity-80">
                  ({ious.filter((i) => i.type === "borrowed" && i.status === "pending").length})
                </span>
              </button>
            </div>

            {/* Toggle Add IOU Drawer Button */}
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                setIsFormOpen(!isFormOpen);
              }}
              className="py-2 px-3 rounded-2xl bg-[#161514] text-white dark:bg-[#FAF8F5] dark:text-[#161514] text-xs font-heading font-black flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all shrink-0"
            >
              <Plus className="size-3.5 stroke-[2.5]" />
              <span>{isFormOpen ? "Close" : "New IOU"}</span>
            </button>
          </div>

          {/* ─── COLLAPSIBLE ADD IOU FORM ─── */}
          {isFormOpen && (
            <form
              onSubmit={handleCreateIOU}
              className="bg-white dark:bg-[#1C1A18] rounded-2xl p-4 border-2 border-[#161514] dark:border-[#CEF431] shadow-[3px_3px_0px_0px_#161514] space-y-3 transition-all"
            >
              <div className="flex items-center justify-between pb-1 border-b border-[#E8E5DF] dark:border-[#2A2724]">
                <span className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
                  Add New Debt / Split
                </span>
                <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                  1-Tap Track
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
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-xs"
                      : "bg-[#FAF8F5] dark:bg-[#252321] text-[#6B6B6B] dark:text-[#A8A29E] border-[#E8E5DF] dark:border-[#383531]"
                  )}
                >
                  They Owe Me (Lent)
                </button>
                <button
                  type="button"
                  onClick={() => setType("borrowed")}
                  className={cn(
                    "flex-1 py-1.5 rounded-xl text-xs font-heading font-bold border transition-all cursor-pointer",
                    type === "borrowed"
                      ? "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-700 shadow-xs"
                      : "bg-[#FAF8F5] dark:bg-[#252321] text-[#6B6B6B] dark:text-[#A8A29E] border-[#E8E5DF] dark:border-[#383531]"
                  )}
                >
                  I Owe Them (Borrowed)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">
                    Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="e.g. Rohan, Ananya"
                    className="w-full bg-[#FAF8F5] dark:bg-[#252321] px-3 py-2 rounded-xl text-xs font-medium text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531] focus:outline-none focus:ring-1 focus:ring-[#161514]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">
                    Amount ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 450"
                    className="w-full bg-[#FAF8F5] dark:bg-[#252321] px-3 py-2 rounded-xl text-xs font-mono font-bold text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531] focus:outline-none focus:ring-1 focus:ring-[#161514]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">
                    For / Reason
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Dinner split, Swiggy order..."
                    className="w-full bg-[#FAF8F5] dark:bg-[#252321] px-3 py-2 rounded-xl text-xs font-medium text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531] focus:outline-none focus:ring-1 focus:ring-[#161514]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] block mb-1 flex items-center gap-1">
                    <Calendar className="size-3 stroke-[2]" />
                    <span>Due Date (Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#FAF8F5] dark:bg-[#252321] px-3 py-2 rounded-xl text-xs font-mono font-medium text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531] focus:outline-none focus:ring-1 focus:ring-[#161514]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-heading font-bold text-[#6B6B6B] hover:text-[#161514] dark:text-[#A8A29E] dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#161514] text-white dark:bg-[#CEF431] dark:text-[#161514] text-xs font-heading font-black cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  Save IOU
                </button>
              </div>
            </form>
          )}

          {/* ─── PENDING IOU LIST ─── */}
          <div className="space-y-2">
            {pendingItems.length === 0 ? (
              <div className="bg-white dark:bg-[#1C1A18] rounded-2xl p-6 text-center border border-[#E8E5DF] dark:border-[#383531] space-y-2 shadow-xs">
                <div className="size-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[#047857] dark:text-[#03D26F] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="size-5 stroke-[2]" />
                </div>
                <h4 className="text-xs sm:text-sm font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
                  All Square! No Pending Debts
                </h4>
                <p className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E] max-w-xs mx-auto">
                  {activeTab === "lent"
                    ? "No one currently owes you money. When you pay for a friend, tap 'New IOU' to record it."
                    : "You do not currently owe anyone money. Clean slate!"}
                </p>
              </div>
            ) : (
              pendingItems.map((iou) => (
                <div
                  key={iou.id}
                  className="bg-white dark:bg-[#1C1A18] rounded-2xl border border-[#E8E5DF] dark:border-[#383531] p-3.5 flex items-center justify-between gap-3 shadow-xs hover:border-[#161514]/40 transition-all group"
                >
                  {/* Left: Avatar Squircle + Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center justify-center font-heading font-black text-sm shrink-0">
                      {iou.personName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-[13.5px] font-heading font-black text-[#161514] dark:text-[#FAF8F5] truncate leading-tight">
                          {iou.personName}
                        </h4>
                        {iou.dueDate && (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] bg-[#FAF8F5] dark:bg-[#252321] px-1.5 py-0.5 rounded-md border border-[#E8E5DF] dark:border-[#383531] shrink-0">
                            <Calendar className="size-2.5 stroke-[2]" />
                            <span>Due: {iou.dueDate}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] truncate">
                        {iou.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & 1-Tap Settle Button */}
                  <div className="flex items-center gap-2 shrink-0">
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

                    <button
                      type="button"
                      onClick={() => handleSettle(iou)}
                      className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#047857] dark:text-[#03D26F] border border-emerald-300 dark:border-emerald-700 text-[11px] font-heading font-black transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                      title="Mark as Settled"
                    >
                      <CheckCircle2 className="size-3 stroke-[2.5]" />
                      <span>Settle</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playPop();
                        deleteIOU(iou.id);
                      }}
                      className="p-1 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="size-3.5 stroke-[2]" />
                    </button>
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
                onClick={() => setShowSettled(!showSettled)}
                className="w-full flex items-center justify-between text-xs font-mono font-bold text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-white py-1.5 px-1 cursor-pointer"
              >
                <span>Settled History ({settledItems.length})</span>
                {showSettled ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </button>

              {showSettled && (
                <div className="space-y-1.5 pt-1">
                  {settledItems.map((iou) => (
                    <div
                      key={iou.id}
                      className="bg-stone-50 dark:bg-[#1C1A18] rounded-xl border border-stone-200 dark:border-[#383531] p-2.5 flex items-center justify-between opacity-70"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-[#161514] dark:text-[#FAF8F5] line-through block truncate">
                          {iou.personName} • {iou.description}
                        </span>
                        <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                          Settled {iou.settledAt ? new Date(iou.settledAt).toLocaleDateString() : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#6B6B6B] dark:text-[#A8A29E] line-through">
                          {currencySymbol}{iou.amount.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            soundFX.playPop();
                            unsettleIOU(iou.id);
                          }}
                          className="p-1 rounded text-stone-400 hover:text-[#161514] dark:hover:text-white"
                          title="Restore to Pending"
                        >
                          <RotateCcw className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
