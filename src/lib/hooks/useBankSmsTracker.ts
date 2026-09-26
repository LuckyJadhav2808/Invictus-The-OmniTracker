"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/shared/AuthProvider";
import {
  isSmsTrackerEnabled,
  setSmsTrackerEnabled,
  processIncomingSms,
  isLocallyProcessed,
  markLocallyProcessed,
} from "../native/sms-listener";
import { ParsedBankSmsResult, parseBankSms } from "../utils/sms-parser";
import {
  checkNativeSmsPermissions,
  requestNativeSmsPermissions,
  fetchNativeInboxSms,
  setNativeSyncConfig,
  NativeSmsMessage,
} from "../native/sms-bridge";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import { useBudgetPreferences, useUpdateBudgetPreferences } from "../queries/money";

const TRACKING_MODE_KEY = "invictus_tracking_mode"; // "manual" | "sms_assisted"

export interface ParsedInboxItem {
  id: string;
  sender: string;
  body: string;
  rawDate: number;
  dateStr: string;
  parsed: ParsedBankSmsResult;
  isDuplicate: boolean;
}

export function useBankSmsTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: budgetPrefs } = useBudgetPreferences();
  const updateBudgetMutation = useUpdateBudgetPreferences();

  const [enabled, setEnabled] = useState<boolean>(() => isSmsTrackerEnabled());
  const [hasPermission, setHasPermission] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [trackingMode, setTrackingMode] = useState<"manual" | "sms_assisted">(() => {
    if (typeof window === "undefined") return "manual";
    const saved = localStorage.getItem(TRACKING_MODE_KEY);
    return saved === "sms_assisted" || (saved === null && isSmsTrackerEnabled()) ? "sms_assisted" : "manual";
  });

  // Sync user ID to native storage whenever logged in
  useEffect(() => {
    if (user?.uid && Capacitor.isNativePlatform()) {
      setNativeSyncConfig(user.uid);
    }
  }, [user?.uid]);

  // Sync initial state from cloud or localStorage
  useEffect(() => {
    if (budgetPrefs?.smsReaderEnabled !== undefined) {
      setEnabled(budgetPrefs.smsReaderEnabled);
      setSmsTrackerEnabled(budgetPrefs.smsReaderEnabled);
      setTrackingMode(budgetPrefs.smsReaderEnabled ? "sms_assisted" : "manual");
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

  const setMode = useCallback(
    async (mode: "manual" | "sms_assisted") => {
      setTrackingMode(mode);
      if (typeof window !== "undefined") {
        localStorage.setItem(TRACKING_MODE_KEY, mode);
      }

      if (mode === "manual") {
        setSmsTrackerEnabled(false);
        setEnabled(false);
        updateBudgetMutation.mutate({ smsReaderEnabled: false });
        toast.info("Manual Mode Active", {
          description: "All SMS reading and background listeners are turned off.",
        });
      } else {
        if (Capacitor.isNativePlatform()) {
          const granted = await requestNativeSmsPermissions();
          setHasPermission(granted);
          if (!granted) {
            toast.error("SMS Permission Required", {
              description: "Please allow SMS permissions in Android settings for SMS-assisted mode.",
            });
            return;
          }
        }
        setSmsTrackerEnabled(true);
        setEnabled(true);
        updateBudgetMutation.mutate({ smsReaderEnabled: true });
        toast.success("⚡ SMS-Assisted Mode Active", {
          description: "Invictus can now fetch and auto-log transactions from bank SMS.",
        });
      }
    },
    [updateBudgetMutation]
  );

  const toggle = useCallback(
    async (targetState?: boolean) => {
      const nextState = targetState !== undefined ? targetState : !enabled;
      await setMode(nextState ? "sms_assisted" : "manual");
      return nextState;
    },
    [enabled, setMode]
  );

  /**
   * Fetch messages directly from Android SMS inbox for the given time range
   */
  const fetchInboxTransactions = useCallback(
    async (options: {
      startTime: number;
      endTime?: number;
      limit?: number;
    }): Promise<{
      items: ParsedInboxItem[];
      totalQueried: number;
      droppedCount: number;
      duplicateCount: number;
    }> => {
      setIsProcessing(true);
      try {
        const messages: NativeSmsMessage[] = await fetchNativeInboxSms(
          options.startTime,
          options.endTime,
          options.limit || 200
        );

        let droppedCount = 0;
        let duplicateCount = 0;
        const items: ParsedInboxItem[] = [];

        for (const msg of messages) {
          const msgDate = new Date(msg.date);
          const dateStr = msgDate.toISOString().split("T")[0];
          const parsed = parseBankSms(msg.address, msg.body, dateStr);

          if (parsed.isDrop || !parsed.transaction) {
            droppedCount++;
            continue;
          }

          const isDuplicate = isLocallyProcessed(parsed.transaction.dedupSignature);
          if (isDuplicate) {
            duplicateCount++;
          }

          items.push({
            id: msg.id || `sms_${msg.date}_${Math.random().toString(36).substring(2, 6)}`,
            sender: msg.address,
            body: msg.body,
            rawDate: msg.date,
            dateStr,
            parsed,
            isDuplicate,
          });
        }

        return {
          items,
          totalQueried: messages.length,
          droppedCount,
          duplicateCount,
        };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  /**
   * Parse raw text containing one or more SMS alerts (for web / paste fallback)
   */
  const parsePastedSms = useCallback(
    (rawText: string, fallbackDate?: string): ParsedInboxItem[] => {
      if (!rawText || !rawText.trim()) return [];

      const blocks = rawText
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .filter((b) => b.length > 10);

      const items: ParsedInboxItem[] = [];

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        let sender = "AD-HDFCBK"; // Default bank prefix

        // Try extracting explicit sender prefix like "AD-HDFCBK: ..." or "[VM-SBINB] ..."
        const prefixMatch = block.match(/^\[?([A-Za-z0-9_-]{4,15})\]?[:\s-]+([\s\S]*)$/);
        let actualBody = block;
        if (prefixMatch && prefixMatch[1] && prefixMatch[2]) {
          const possibleSender = prefixMatch[1].toUpperCase();
          if (possibleSender.includes("HDFC")) sender = "AD-HDFCBK";
          else if (possibleSender.includes("SBI")) sender = "VM-SBINB";
          else if (possibleSender.includes("ICICI")) sender = "JX-ICICIB";
          else if (possibleSender.includes("AXIS")) sender = "AX-AXISBK";
          else if (possibleSender.includes("KOTAK")) sender = "KB-KOTAKB";
          else if (possibleSender.includes("PAYTM")) sender = "PY-PAYTMB";
          else if (possibleSender.includes("CRED")) sender = "CR-CREDBK";
          actualBody = prefixMatch[2].trim();
        } else {
          // Infer sender from body keywords if needed
          const lower = block.toLowerCase();
          if (lower.includes("sbi")) sender = "VM-SBINB";
          else if (lower.includes("icici")) sender = "JX-ICICIB";
          else if (lower.includes("axis")) sender = "AX-AXISBK";
          else if (lower.includes("kotak")) sender = "KB-KOTAKB";
          else if (lower.includes("paytm")) sender = "PY-PAYTMB";
          else if (lower.includes("cred")) sender = "CR-CREDBK";
        }

        const dateStr = fallbackDate || new Date().toISOString().split("T")[0];
        const parsed = parseBankSms(sender, actualBody, dateStr);

        if (!parsed.isDrop && parsed.transaction) {
          const isDuplicate = isLocallyProcessed(parsed.transaction.dedupSignature);
          items.push({
            id: `pasted_${Date.now()}_${i}`,
            sender,
            body: actualBody,
            rawDate: Date.now(),
            dateStr: parsed.transaction.date || dateStr,
            parsed,
            isDuplicate,
          });
        }
      }

      return items;
    },
    []
  );

  /**
   * Batch sync approved transactions to MongoDB
   */
  const batchSyncTransactions = useCallback(
    async (
      selectedItems: Array<{
        parsed: ParsedBankSmsResult;
        categoryId?: string;
      }>
    ): Promise<{ success: boolean; createdCount: number; duplicateCount: number }> => {
      setIsProcessing(true);
      try {
        const userId = user?.uid || "user_1kapw9sad_1784744868999";
        const payloadItems = selectedItems
          .filter((item) => !item.parsed.isDrop && item.parsed.transaction)
          .map((item) => {
            const tx = item.parsed.transaction!;
            return {
              userId,
              amount: tx.amount,
              type: tx.type,
              merchant: tx.merchant,
              categorySuggestion: tx.categorySuggestion,
              categoryId: item.categoryId,
              date: tx.date,
              accountLast4: tx.accountLast4,
              bankName: tx.bankName,
              rawSender: tx.rawSender,
              dedupSignature: tx.dedupSignature,
            };
          });

        if (payloadItems.length === 0) {
          return { success: true, createdCount: 0, duplicateCount: 0 };
        }

        const res = await fetch("/api/money/auto-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: payloadItems }),
        });

        if (res.ok) {
          const data = await res.json();
          // Mark all processed in local storage
          payloadItems.forEach((p) => {
            if (p.dedupSignature) markLocallyProcessed(p.dedupSignature);
          });

          // Invalidate relevant React Query caches
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["monthlySpending"] });
          queryClient.invalidateQueries({ queryKey: ["categories"] });
          queryClient.invalidateQueries({ queryKey: ["pendingInflows"] });

          return {
            success: true,
            createdCount: data.createdCount || 0,
            duplicateCount: data.duplicateCount || 0,
          };
        } else {
          throw new Error("Batch sync failed with status " + res.status);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [user, queryClient]
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
    trackingMode,
    setTrackingMode: setMode,
    hasPermission,
    toggleSmsTracker: toggle,
    processSms: simulateOrProcessSms,
    fetchInboxTransactions,
    parsePastedSms,
    batchSyncTransactions,
    isProcessing,
  };
}
