"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/shared/AuthProvider";
import { useCategories, useAddTransaction } from "@/lib/queries/money";
import { NativeQuickLogBridge } from "@/lib/native/quick-log-bridge";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function getActiveUserId(user: any): string {
  return user?.uid || user?.id || "guest-user";
}

export function useSyncNativeQuickLogs(remainingBudget?: number) {
  const { user } = useAuth();
  const { data: categories = [] } = useCategories();
  const addTxMutation = useAddTransaction();
  const queryClient = useQueryClient();
  const isSyncingRef = useRef(false);

  // 1. Sync live budget telemetry to Android Notification Shade & Tile
  useEffect(() => {
    if (typeof remainingBudget === "number" && !isNaN(remainingBudget)) {
      const activeUid = getActiveUserId(user);
      NativeQuickLogBridge.syncBudgetTelemetry(remainingBudget, activeUid);
    }
  }, [remainingBudget, user]);

  // 2. Poll & Ingest pending native offline quick logs on mount & app focus
  useEffect(() => {
    const processPendingLogs = async () => {
      if (isSyncingRef.current || !NativeQuickLogBridge.isSupported()) return;
      isSyncingRef.current = true;

      try {
        const pending = await NativeQuickLogBridge.getPendingExpenses();
        if (pending && pending.length > 0) {
          const activeUid = getActiveUserId(user);

          for (const item of pending) {
            // Find category ID
            const matchedCategory = categories.find(
              (c) =>
                c.name.toLowerCase() === item.category.toLowerCase() ||
                c.id.toLowerCase() === item.category.toLowerCase()
            );
            const categoryId = matchedCategory?.id || categories[0]?.id || "cat-food";
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
