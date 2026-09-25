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

export function useBankSmsTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    setEnabled(isSmsTrackerEnabled());
  }, []);

  const toggle = useCallback((newState?: boolean) => {
    const val = newState !== undefined ? newState : !isSmsTrackerEnabled();
    setSmsTrackerEnabled(val);
    setEnabled(val);
  }, []);

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
    toggleSmsTracker: toggle,
    processSms: simulateOrProcessSms,
    isProcessing,
  };
}
