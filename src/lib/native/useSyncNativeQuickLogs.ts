"use client";

import { useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/components/shared/AuthProvider";
import { useCategories, useAddTransaction, useTransactions } from "@/lib/queries/money";
import { NativeQuickLogBridge, type QuickPresetItem } from "@/lib/native/quick-log-bridge";
import { resolveExpenseCategoryId } from "@/lib/utils/resolve-category";
import { computeFrequentExpenses } from "@/lib/utils/frequent-expenses";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function getActiveUserId(user: any): string {
  return user?.uid || user?.id || "guest-user";
}

export function useSyncNativeQuickLogs(remainingBudget?: number) {
  const { user } = useAuth();
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();
  const addTxMutation = useAddTransaction();
  const queryClient = useQueryClient();
  const isSyncingRef = useRef(false);

  // Compute dynamic user frequent presets from recent transaction history
  const dynamicPresets: QuickPresetItem[] = useMemo(() => {
    const frequent = computeFrequentExpenses(transactions, categories, 6);
    if (!frequent || frequent.length === 0) return [];
    return frequent.map((item) => ({
      label: `${item.icon || "⚡"} ${item.name} ₹${item.amount}`,
      name: item.name,
      amount: item.amount,
      category: /travel|commute|transport/i.test(item.categoryName)
        ? "Travel"
        : /grocer/i.test(item.categoryName)
        ? "Grocery"
        : /bill|utilit/i.test(item.categoryName)
        ? "Bills"
        : "Food",
      icon: item.icon || "⚡",
    }));
  }, [transactions, categories]);

  // 1. Sync live budget telemetry & frequent presets to Android Notification Shade & Tile
  useEffect(() => {
    if (typeof remainingBudget === "number" && !isNaN(remainingBudget)) {
      const activeUid = getActiveUserId(user);
      NativeQuickLogBridge.syncBudgetTelemetry(remainingBudget, activeUid, dynamicPresets);
    }
  }, [remainingBudget, user, dynamicPresets]);

  // 2. Poll & Ingest pending native offline quick logs on mount & app focus
  useEffect(() => {
    const processPendingLogs = async () => {
      if (isSyncingRef.current || !NativeQuickLogBridge.isSupported()) return;
      isSyncingRef.current = true;

      try {
        const pending = await NativeQuickLogBridge.getPendingExpenses();
        if (pending && pending.length > 0) {
          for (const item of pending) {
            // Strictly resolve to an expense category (never income like Salary)
            const categoryId = resolveExpenseCategoryId(item.category, item.note, categories);
            const todayStr = item.date || new Date().toISOString().split("T")[0];

            await addTxMutation.mutateAsync({
              amount: item.amount,
              categoryId,
              type: "expense",
              date: todayStr,
              note: item.note || item.category,
              paymentMethod: "upi",
              isRecurring: false,
            });
          }

          await NativeQuickLogBridge.clearPendingExpenses();
          await queryClient.invalidateQueries({ queryKey: ["transactions"] });

          toast.success(`⚡ Synced ${pending.length} quick expense${pending.length > 1 ? "s" : ""} from Ambient Logger!`, {
            description: "Your daily budget telemetry is fully updated.",
          });
        }
      } catch (err) {
        console.warn("[useSyncNativeQuickLogs] Failed to sync pending quick logs:", err);
      } finally {
        isSyncingRef.current = false;
      }
    };

    processPendingLogs();

    const handleFocus = () => {
      processPendingLogs();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [categories, user, addTxMutation, queryClient]);
}
