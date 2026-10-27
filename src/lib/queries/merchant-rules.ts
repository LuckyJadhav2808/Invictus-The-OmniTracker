import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/shared/AuthProvider";
import { getCustomSession } from "@/lib/custom-auth";
import {
  MerchantCategoryCache,
  type MerchantRuleItem,
} from "@/lib/sms/merchant-cache";

const isGuestMode = (user?: any) => {
  if (user?.uid && user.uid !== "guest-user") return false;
  if (typeof window === "undefined") return false;
  return localStorage.getItem("invictus_guest_mode") === "true";
};

const getActiveUserId = (user: any) => {
  if (user?.uid) return user.uid;
  if (typeof window !== "undefined") {
    const session = getCustomSession();
    if (session?.uid) return session.uid;
  }
  return "user-admin-default";
};

export function useMerchantRules() {
  const { user } = useAuth();
  const userId = getActiveUserId(user);

  return useQuery<MerchantRuleItem[]>({
    queryKey: ["merchant-rules", userId],
    queryFn: async () => {
      // Offline / guest mode uses localStorage & memory cache
      if (isGuestMode(user)) {
        return MerchantCategoryCache.getAllRules();
      }

      try {
        const res = await fetch(`/api/money/merchant-rules?userId=${userId}`);
        if (res.ok) {
          const cloudRules = await res.json();
          if (Array.isArray(cloudRules) && cloudRules.length > 0) {
            MerchantCategoryCache.syncWithServer(cloudRules);
          }
        }
      } catch {
        // Fallback to local cache if network is unavailable
      }

      return MerchantCategoryCache.getAllRules();
    },
    staleTime: 60 * 1000,
  });
}

export function useSaveMerchantRule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      merchant: string;
      categoryId: string;
      categoryName: string;
      displayName?: string;
    }) => {
      const userId = getActiveUserId(user);

      // 1. Instantly update local memory & localStorage cache in 0ms
      const localItem = MerchantCategoryCache.set(
        payload.merchant,
        payload.categoryId,
        payload.categoryName,
        true,
        payload.displayName
      );

      // 2. Sync to cloud if not guest
      if (!isGuestMode(user)) {
        try {
          await fetch("/api/money/merchant-rules", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              merchantPattern: payload.merchant,
              displayName: payload.displayName || payload.merchant,
              categoryId: payload.categoryId,
              categoryName: payload.categoryName,
            }),
          });
        } catch {
          // Cloud sync failure handled gracefully; local item persisted
        }
      }

      return localItem;
    },
    onSuccess: () => {
      const userId = getActiveUserId(user);
      queryClient.invalidateQueries({ queryKey: ["merchant-rules", userId] });
    },
  });
}

export function useDeleteMerchantRule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (merchantPattern: string) => {
      const userId = getActiveUserId(user);

      // 1. Delete locally
      MerchantCategoryCache.deleteRule(merchantPattern);

      // 2. Delete on cloud
      if (!isGuestMode(user)) {
        try {
          await fetch(
            `/api/money/merchant-rules?userId=${userId}&pattern=${encodeURIComponent(merchantPattern)}`,
            { method: "DELETE" }
          );
        } catch {}
      }

      return merchantPattern;
    },
    onSuccess: () => {
      const userId = getActiveUserId(user);
      queryClient.invalidateQueries({ queryKey: ["merchant-rules", userId] });
    },
  });
}
