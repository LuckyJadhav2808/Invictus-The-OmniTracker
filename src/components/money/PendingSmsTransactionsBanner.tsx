"use client";

import { useState, useEffect, useCallback } from "react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { Zap, Check, Edit3, X, Smartphone, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  getPendingSmsTransactions,
  removePendingSmsTransaction,
  clearAllPendingSmsTransactions,
  type PendingSmsTransaction,
} from "@/lib/sms/sms-sync-service";
import { type Category, type Transaction } from "@/types";
import { useAddTransaction } from "@/lib/queries/money";
import { detectCategoryFromNote } from "@/lib/utils/merchant-categorizer";

interface PendingSmsTransactionsBannerProps {
  categories: Category[];
  onOpenEditModal: (prefillData: {
    amount: number;
    merchant: string;
    date: string;
    paymentMethod: string;
    categoryId?: string;
    dedupSignature: string;
    pendingId: string;
  }) => void;
}

export function PendingSmsTransactionsBanner({
  categories,
  onOpenEditModal,
}: PendingSmsTransactionsBannerProps) {
  const [pendingList, setPendingList] = useState<PendingSmsTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const addTransactionMutation = useAddTransaction();

  const loadPending = useCallback(async () => {
    try {
      const items = await getPendingSmsTransactions();
      setPendingList(items || []);
    } catch (err) {
      console.warn("[PendingSmsBanner] Could not load pending transactions:", err);
    }
  }, []);

  // Poll on mount, window focus, and document visibility
  useEffect(() => {
    loadPending();

    const handleFocus = () => {
      loadPending();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadPending();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    // Periodically re-check every 5 seconds when visible
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadPending();
      }
    }, 5000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(timer);
    };
  }, [loadPending]);

  if (pendingList.length === 0) {
    return null;
  }

  const handleQuickRegister = async (item: PendingSmsTransaction) => {
    setIsProcessing(item.id);
    soundFX.play("pop");

    try {
      // Intelligently resolve the most accurate category from merchant name
      const matched = detectCategoryFromNote(item.merchant, categories);
      const categoryId = matched?.categoryId || "cat-food";
      const categoryName = matched?.categoryName || "Food & Dining";

      await addTransactionMutation.mutateAsync({
        amount: item.amount,
        type: "expense",
        categoryId,
        date: item.date || new Date().toISOString().split("T")[0],
        note: item.merchant,
        paymentMethod: "UPI",
        source: "bank_sms",
        dedupSignature: item.dedupSignature,
        sourceMetadata: {
          bankName: item.bankName,
          accountMasked: item.accountLast4,
          rawSender: item.rawSender || item.bankName,
        },
      });

      // Clear from pending queue
      await removePendingSmsTransaction(item.dedupSignature, item.id);
      setPendingList((prev) => prev.filter((p) => p.id !== item.id && p.dedupSignature !== item.dedupSignature));

      soundFX.play("celebrate");
      toast.success(`⚡ Registered ₹${item.amount.toLocaleString()} to ${categoryName}!`, {
        description: `Paid to ${item.merchant} (${item.bankName}).`,
      });
    } catch (err: any) {
      soundFX.play("error");
      toast.error(err.message || "Failed to register transaction");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleEditAndRegister = (item: PendingSmsTransaction) => {
    soundFX.play("click");
    const matched = detectCategoryFromNote(item.merchant, categories);
    onOpenEditModal({
      amount: item.amount,
      merchant: item.merchant,
      date: item.date,
      paymentMethod: "UPI",
      categoryId: matched?.categoryId || "cat-food",
      dedupSignature: item.dedupSignature,
      pendingId: item.id,
    });
  };

  const handleDismiss = async (item: PendingSmsTransaction) => {
    soundFX.play("pop");
    await removePendingSmsTransaction(item.dedupSignature, item.id);
    setPendingList((prev) => prev.filter((p) => p.id !== item.id && p.dedupSignature !== item.dedupSignature));
    toast.info("Transaction alert dismissed", {
      description: `₹${item.amount} paid to ${item.merchant} was not added to ledger.`,
    });
  };

  const handleClearAll = async () => {
    soundFX.play("pop");
    await clearAllPendingSmsTransactions();
    setPendingList([]);
    toast.info("All pending payment alerts cleared");
  };

  return (
    <div className="mb-4 space-y-3 animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#03D26F] animate-pulse" />
          <h3 className="text-xs font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]">
            Detected Bank Payments ({pendingList.length})
          </h3>
        </div>
        {pendingList.length > 1 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] font-mono text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {pendingList.map((item) => {
          const matchedCategory = detectCategoryFromNote(item.merchant, categories);
          const suggestedCategory = matchedCategory?.categoryName || "Food & Dining";

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] rounded-2xl p-3.5 shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000] relative overflow-hidden transition-all"
            >
              {/* Top Row: Pill Badge & Dismiss */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#CEF431] border border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
                  <Zap className="size-3 text-[#161514] fill-[#161514]" />
                  <span className="text-[10px] font-mono font-black uppercase text-[#161514] tracking-tight">
                    Instant Bank SMS Alert
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                    {item.bankName} {item.accountLast4 ? `• XX${item.accountLast4}` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDismiss(item)}
                    className="size-6 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-[#333] transition-colors cursor-pointer"
                    title="Dismiss alert"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Main Info: Amount & Merchant */}
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <div className="min-w-0 flex-1">
                  <div className="text-base font-heading font-black text-[#161514] dark:text-[#FAF8F5] leading-snug break-words line-clamp-2">
                    {item.merchant}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5 font-mono">
                    <span>Suggested:</span>
                    <span className="font-semibold text-[#161514] dark:text-[#FAF8F5]">
                      {suggestedCategory}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-2xl font-mono font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                    ₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: item.amount % 1 === 0 ? 0 : 2 })}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                    Outflow
                  </div>
                </div>
              </div>

              {/* Action Buttons: 1-Tap Register & Edit */}
              <div className="flex items-center gap-2 pt-2.5 mt-2 border-t border-[#E8E5DF] dark:border-[#2A2724]">
                <button
                  type="button"
                  disabled={isProcessing === item.id}
                  onClick={() => handleQuickRegister(item)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#CEF431] hover:bg-[#bce620] text-[#161514] border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer font-heading font-black text-xs uppercase"
                >
                  <Check className="size-3.5 stroke-[2.5]" />
                  <span>{isProcessing === item.id ? "Registering..." : "1-Tap Register"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEditAndRegister(item)}
                  className="py-2 px-3.5 rounded-xl bg-white dark:bg-[#252321] hover:bg-zinc-100 dark:hover:bg-[#2A2826] text-[#161514] dark:text-[#FAF8F5] border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer font-heading font-black text-xs uppercase"
                >
                  <Edit3 className="size-3.5 stroke-[2]" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
