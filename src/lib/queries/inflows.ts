"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/shared/AuthProvider";
import { getCustomSession } from "@/lib/custom-auth";
import { toast } from "sonner";

export interface PendingInflowItem {
  id: string;
  userId: string;
  amount: number;
  merchant: string;
  date: string;
  bankName?: string;
  accountLast4?: string;
  rawSender?: string;
  dedupSignature: string;
  status: "pending" | "approved" | "dismissed";
  createdAt: string;
}

const getActiveUserId = (user: any) => {
  if (user?.uid) return user.uid;
  if (typeof window !== "undefined") {
    const session = getCustomSession();
    if (session?.uid) return session.uid;
  }
  return "user_1kapw9sad_1784744868999";
};

// 1. Fetch Pending Inflows
export function usePendingInflows() {
  const { user } = useAuth();
  const userId = getActiveUserId(user);

  return useQuery<PendingInflowItem[]>({
    queryKey: ["pendingInflows", userId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/money/inflows/pending?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) return [];
        return await res.json();
      } catch (err) {
        console.warn("Failed to fetch pending inflows:", err);
        return [];
      }
    },
    refetchInterval: 1000 * 30, // Auto-poll every 30 seconds
  });
}

// 2. Approve Inflow Mutation
export function useApproveInflow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = getActiveUserId(user);

  return useMutation({
    mutationFn: async (payload: { id: string; categoryId?: string; note?: string }) => {
      const res = await fetch("/api/money/inflows/pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payload.id,
          userId,
          action: "approve",
          categoryId: payload.categoryId,
          note: payload.note,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to approve inflow");
      }

      return await res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || "Income confirmed & logged! 🎉");
      queryClient.invalidateQueries({ queryKey: ["pendingInflows", userId] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["monthlySpending"] });
    },
  });
}

// 3. Dismiss Inflow Mutation
export function useDismissInflow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = getActiveUserId(user);

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/money/inflows/pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          userId,
          action: "dismiss",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to dismiss inflow");
      }

      return await res.json();
    },
    onSuccess: () => {
      toast.info("Inflow dismissed. Did not log to ledger.");
      queryClient.invalidateQueries({ queryKey: ["pendingInflows", userId] });
    },
  });
}
