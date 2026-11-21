"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TransactionFormModal } from "@/components/money/modals/TransactionFormModal";
import { useCategories, useAddTransaction, useTransactions } from "@/lib/queries/money";
import { computeMonthlyBudgetStats } from "@/lib/utils/budget-rollover";
import { NativeQuickLogBridge } from "@/lib/native/quick-log-bridge";
import { useAuth } from "@/components/shared/AuthProvider";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, Sparkles, Zap } from "lucide-react";

export default function QuickLogPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(true);
  const { user } = useAuth();
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();
  const addTxMutation = useAddTransaction();

  useEffect(() => {
    setMounted(true);
    setModalOpen(true);
  }, []);

  const currencySymbol = useMemo(() => {
    const curr = (user as any)?.currency || "INR";
    switch (curr) {
      case "USD": return "$";
      case "EUR": return "€";
      case "GBP": return "£";
      case "JPY": return "¥";
      default: return "₹";
    }
  }, [user]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const currentMonthKey = format(new Date(), "yyyy-MM");

  const monthlyStats = useMemo(() => {
    return computeMonthlyBudgetStats({ categories, transactions, targetMonthKey: currentMonthKey });
  }, [categories, transactions, currentMonthKey]);

  const handleSaveTransaction = async (payload: {
    id?: string;
    amount: number;
    type: "expense" | "income";
    categoryId: string;
    date: string;
    note?: string;
    paymentMethod: string;
  }) => {
    await addTxMutation.mutateAsync({
      amount: payload.amount,
      categoryId: payload.categoryId,
      type: payload.type,
      date: payload.date || todayStr,
      note: payload.note || (payload.type === "expense" ? "Quick Expense" : "Income"),
      paymentMethod: payload.paymentMethod || "upi",
      isRecurring: false,
    });

    const newRemaining = Math.max(0, monthlyStats.remainingBudget - payload.amount);
    NativeQuickLogBridge.syncBudgetTelemetry(newRemaining);

    toast.success(
      `⚡ Logged ${currencySymbol}${payload.amount} ${payload.note ? `for ${payload.note}` : ""}`.trim(),
      {
        description: `Remaining budget: ${currencySymbol}${Math.round(newRemaining).toLocaleString()}`,
      }
    );

    handleExit();
  };

  const handleExit = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/money");
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#161514] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm h-[520px] bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] rounded-3xl p-5 shadow-[4px_4px_0px_0px_#161514] dark:shadow-[4px_4px_0px_0px_#000000] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#161514] text-[#161514] dark:text-[#FAF8F5] flex flex-col items-center justify-center p-4 selection:bg-[#CEF431] selection:text-[#161514]">
      {/* Background Ambient Studio Backdrop */}
      <div className="w-full max-w-md p-6 bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] rounded-3xl shadow-[4px_4px_0px_0px_#161514] dark:shadow-[4px_4px_0px_0px_#000000] space-y-5 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CEF431] border border-[#161514] text-xs font-mono font-bold text-[#161514] shadow-xs">
          <Zap className="size-3.5 fill-[#161514]" />
          <span>STATUS BAR & FAST-LOG GATEWAY</span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-heading font-black tracking-tight">
            Fast Expense Studio
          </h1>
          <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] font-medium">
            Natural language intent parsing • Math evaluator • Merchant rules
          </p>
        </div>

        {/* Remaining Budget Pill */}
        <div className="p-3 bg-[#FAF8F5] dark:bg-[#252321] rounded-2xl border border-[#E8E5DF] dark:border-[#383531] flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-[#6B6B6B] dark:text-[#A8A29E]">
            Safe to Spend:
          </span>
          <span className="text-base font-mono font-black text-[#047857] dark:text-[#03D26F]">
            {currencySymbol}{Math.round(monthlyStats.remainingBudget).toLocaleString()}
          </span>
        </div>

        {/* Action Buttons if sheet is dismissed */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-full py-3 rounded-2xl bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] font-heading font-black text-sm border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="size-4" />
            <span>Open Transaction Modal</span>
          </button>

          <button
            type="button"
            onClick={handleExit}
            className="w-full py-2.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] font-heading font-bold text-xs border border-[#E8E5DF] dark:border-[#383531] hover:border-[#161514] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Return to Invictus</span>
          </button>
        </div>
      </div>

      {/* Reused Canonical Transaction Modal with NLP & Math Engine */}
      <TransactionFormModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            handleExit();
          }
        }}
        mode="quick"
        categories={categories}
        transactions={transactions}
        currencySymbol={currencySymbol}
        onSave={handleSaveTransaction}
      />
    </div>
  );
}
