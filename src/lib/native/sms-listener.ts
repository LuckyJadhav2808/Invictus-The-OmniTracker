"use client";

import { isNativeApp } from "./native-notifications";
import { parseBankSms, ParsedBankSmsResult } from "../utils/sms-parser";
import { toast } from "sonner";
import { LocalNotifications } from "@capacitor/local-notifications";

const SMS_TRACKER_ENABLED_KEY = "invictus_sms_tracker_enabled";
const LAST_PROCESSED_SIGS_KEY = "invictus_processed_sms_sigs";

export function isSmsTrackerEnabled(): boolean {
  if (typeof window === "undefined") return false;
  // Default enabled for ease of use, user can toggle in settings
  const stored = localStorage.getItem(SMS_TRACKER_ENABLED_KEY);
  return stored === null ? true : stored === "true";
}

export function setSmsTrackerEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SMS_TRACKER_ENABLED_KEY, enabled ? "true" : "false");
}

/**
 * In-memory / local storage duplicate prevention cache
 */
function isLocallyProcessed(sig: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(LAST_PROCESSED_SIGS_KEY);
    const sigs: string[] = raw ? JSON.parse(raw) : [];
    return sigs.includes(sig);
  } catch {
    return false;
  }
}

function markLocallyProcessed(sig: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LAST_PROCESSED_SIGS_KEY);
    let sigs: string[] = raw ? JSON.parse(raw) : [];
    if (!sigs.includes(sig)) {
      sigs.push(sig);
      if (sigs.length > 50) sigs = sigs.slice(-50); // Keep last 50
      localStorage.setItem(LAST_PROCESSED_SIGS_KEY, JSON.stringify(sigs));
    }
  } catch {}
}

export interface ProcessSmsOptions {
  sender: string;
  body: string;
  userId: string;
  onSuccess?: (transaction: any) => void;
}

/**
 * Securely processes an SMS message through the zero-knowledge parser
 * and syncs it to MongoDB if it represents a valid transaction.
 */
export async function processIncomingSms({
  sender,
  body,
  userId,
  onSuccess,
}: ProcessSmsOptions): Promise<ParsedBankSmsResult & { synced?: boolean; duplicate?: boolean }> {
  // 1. Check if user enabled auto-tracking
  if (!isSmsTrackerEnabled()) {
    return { isDrop: true, dropReason: "NOT_APPROVED_BANK_SENDER" };
  }

  // 2. Parse through Security Sandbox
  const parsed = parseBankSms(sender, body);

  if (parsed.isDrop || !parsed.transaction) {
    return parsed;
  }

  const { transaction } = parsed;

  // 3. Local In-Memory Dedup Check
  if (isLocallyProcessed(transaction.dedupSignature)) {
    return { ...parsed, duplicate: true, synced: false };
  }

  // 4. Sync to MongoDB Atlas backend
  try {
    const res = await fetch("/api/money/auto-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        amount: transaction.amount,
        type: transaction.type,
        merchant: transaction.merchant,
        categorySuggestion: transaction.categorySuggestion,
        date: transaction.date,
        accountLast4: transaction.accountLast4,
        bankName: transaction.bankName,
        rawSender: transaction.rawSender,
        dedupSignature: transaction.dedupSignature,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      markLocallyProcessed(transaction.dedupSignature);

      // 5. Post Status Notification
      const isExpense = transaction.type === "expense";
      const icon = transaction.suggestedIcon || "⚡";
      const titleText = `${icon} Auto-Logged: ₹${transaction.amount.toLocaleString("en-IN")}`;
      const bodyText = `${isExpense ? "Paid to" : "Received from"} ${transaction.merchant} (${transaction.bankName})`;

      if (isNativeApp()) {
        try {
          await LocalNotifications.schedule({
            notifications: [
              {
                id: Math.floor(Math.random() * 100000),
                title: titleText,
                body: bodyText,
                smallIcon: "ic_stat_icon",
                iconColor: "#05DF72",
                schedule: { at: new Date(Date.now() + 500) },
              },
            ],
          });
        } catch {
          // Native local notification optional fallback
        }
      }

      toast.success(titleText, {
        description: bodyText,
        duration: 4000,
        style: {
          background: "#161514",
          border: "2px solid #05DF72",
          color: "#FFFFFF",
        },
      });

      if (onSuccess) {
        onSuccess(data.transaction);
      }

      return { ...parsed, synced: true, duplicate: data.actionTaken === "duplicate_ignored" };
    }
  } catch (err) {
    console.warn("[SmsTracker] Auto-sync network error, mutation will retry:", err);
  }

  return { ...parsed, synced: false };
}
