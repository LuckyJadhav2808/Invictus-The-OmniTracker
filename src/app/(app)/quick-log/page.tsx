"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { MechanicalNumpad } from "@/components/money/MechanicalNumpad";
import { useCategories, useAddTransaction, useTransactions } from "@/lib/queries/money";
import { computeMonthlyBudgetStats } from "@/lib/utils/budget-rollover";
import { NativeQuickLogBridge } from "@/lib/native/quick-log-bridge";
import { useAuth } from "@/components/shared/AuthProvider";
import { toast } from "sonner";
import { format } from "date-fns";

export default function QuickLogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();
  const addTxMutation = useAddTransaction();

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

  const handleLogExpense = async (payload: { amount: number; category: string; note: string }) => {
    // Find matching category ID
    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === payload.category.toLowerCase()
    );
    const categoryId = matchedCategory?.id || categories[0]?.id || "cat-food";

    await addTxMutation.mutateAsync({
      amount: payload.amount,
      categoryId,
      type: "expense",
      date: todayStr,
      note: payload.note,
      paymentMethod: "upi",
      isRecurring: false,
    });

    const newRemaining = Math.max(0, monthlyStats.remainingBudget - payload.amount);
    NativeQuickLogBridge.syncBudgetTelemetry(newRemaining);

    toast.success(`⚡ Logged ${currencySymbol}${payload.amount} for ${payload.note}!`, {
      description: `Remaining budget: ${currencySymbol}${Math.round(newRemaining).toLocaleString()}`,
    });

    // Close / Navigate back
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/money");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] dark:bg-[#0E0D0C] flex flex-col items-center justify-center p-4">
      <MechanicalNumpad
        remainingBudget={monthlyStats.remainingBudget}
        currencySymbol={currencySymbol}
        onLogExpense={handleLogExpense}
        onCancel={() => router.back()}
      />
    </div>
  );
}
