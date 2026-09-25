"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/shared/AuthProvider";
import {
  isSmsTrackerEnabled,
  setSmsTrackerEnabled,
  processIncomingSms,
} from "../native/sms-listener";
import { ParsedBankSmsResult } from "../utils/sms-parser";
import { checkNativeSmsPermissions, requestNativeSmsPermissions } from "../native/sms-bridge";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import { useBudgetPreferences, useUpdateBudgetPreferences } from "../queries/money";

export function useBankSmsTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: budgetPrefs } = useBudgetPreferences();
  const updateBudgetMutation = useUpdateBudgetPreferences();

  const [enabled, setEnabled] = useState<boolean>(() => isSmsTrackerEnabled());
  const [hasPermission, setHasPermission] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Sync initial state from cloud or localStorage
  useEffect(() => {
    if (budgetPrefs?.smsReaderEnabled !== undefined) {
      setEnabled(budgetPrefs.smsReaderEnabled);
      setSmsTrackerEnabled(budgetPrefs.smsReaderEnabled);
    } else {
      setEnabled(isSmsTrackerEnabled());
    }
  }, [budgetPrefs]);

  // Check Android hardware permissions
  useEffect(() => {
    async function verify() {
      if (Capacitor.isNativePlatform()) {
        const granted = await checkNativeSmsPermissions();
        setHasPermission(granted);
      }
    }
    verify();
  }, []);

  const toggle = useCallback(
    async (targetState?: boolean) => {
      const nextState = targetState !== undefined ? targetState : !enabled;

      if (nextState && Capacitor.isNativePlatform()) {
        const granted = await requestNativeSmsPermissions();
        setHasPermission(granted);
        if (!granted) {
          toast.error("SMS Permission Required", {
            description: "Please allow SMS permissions in Android settings to automatically detect bank alerts.",
          });
          setEnabled(false);
          setSmsTrackerEnabled(false);
          return false;
        }
      }

      setSmsTrackerEnabled(nextState);
      setEnabled(nextState);

      // Cloud save
      updateBudgetMutation.mutate({ smsReaderEnabled: nextState });

      toast.success(nextState ? "⚡ Bank SMS Auto-Tracker Active" : "Bank SMS Auto-Tracker Paused", {
        description: nextState
          ? "Invictus will now headlessly log transactions and notify you."
          : "Incoming SMS messages will no longer be intercepted.",
      });

      return true;
    },
    [enabled, updateBudgetMutation]
  );

  const simulateOrProcessSms = useCallback(
    async (sender: string, body: string): Promise<ParsedBankSmsResult & { synced?: boolean }> => {
      setIsProcessing(true);
      try {
        const userId = user?.uid || "user_1kapw9sad_1784744868999";
        const result = await processIncomingSms({
          sender,
          body,
          userId,
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["monthlySpending"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            queryClient.invalidateQueries({ queryKey: ["pendingInflows"] });
          },
        });
        return result;
      } finally {
        setIsProcessing(false);
      }
    },
    [user, queryClient]
  );

  return {
    isEnabled: enabled,
    hasPermission,
    toggleSmsTracker: toggle,
    processSms: simulateOrProcessSms,
    isProcessing,
  };
}
