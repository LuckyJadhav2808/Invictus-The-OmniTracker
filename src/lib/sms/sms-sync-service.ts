/**
 * Invictus Native Android SMS Sync Service
 * Bridges Capacitor Telephony Plugin with Local Zero-Knowledge Regex Parser
 * and Constrained Categorizer.
 */

import { registerPlugin } from "@capacitor/core";
import { parseBankSms, ParsedSmsTransaction } from "./sms-local-parser";
import { categorizeMerchants } from "./constrained-categorizer";
import { type Category, type Transaction } from "@/types";

export interface SmsBridgePluginInterface {
  checkPermissions(): Promise<{ smsGranted: boolean; notificationsGranted: boolean; allGranted: boolean }>;
  requestPermissions(): Promise<{ smsGranted: boolean; notificationsGranted: boolean; allGranted: boolean }>;
  openAppSettings(): Promise<void>;
  fetchInboxSms(options: { startTime: number; endTime?: number; limit?: number }): Promise<{
    messages: Array<{ id: string; address: string; body: string; date: number }>;
    count: number;
  }>;
  setSyncConfig(options: { userId: string; endpoint?: string }): Promise<{ success: boolean }>;
}

export const SmsBridge = registerPlugin<SmsBridgePluginInterface>("SmsBridge");

export const LAST_SMS_SYNC_KEY = "invictus_last_sms_sync_timestamp";

export async function isSmsSyncAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  } catch {
    return false;
  }
}

export interface SyncSmsResult {
  scannedCount: number;
  parsedCount: number;
  savedCount: number;
  transactions: Array<{
    amount: number;
    merchant: string;
    categoryId: string;
    paymentMethod: string;
    date: string;
    dedupSignature: string;
  }>;
}

/**
 * Scans recent bank SMS from the Android device inbox, parses them locally with regex,
 * classifies categories, and returns new deduplicated transaction records.
 */
export async function syncRecentBankSms(
  categories: Category[],
  existingTransactions: Transaction[] = [],
  options?: {
    forceFullScan?: boolean;
    provider?: "gemini" | "openai" | "none";
  }
): Promise<SyncSmsResult> {
  const isNative = await isSmsSyncAvailable();
  if (!isNative) {
    return { scannedCount: 0, parsedCount: 0, savedCount: 0, transactions: [] };
  }

  // 1. Check & Request Permissions
  const perm = await SmsBridge.checkPermissions();
  if (!perm.smsGranted) {
    const req = await SmsBridge.requestPermissions();
    if (!req.smsGranted) {
      throw new Error("SMS permission is required to automatically parse bank transaction SMS.");
    }
  }

  // 2. Determine High-Water Mark Timestamp
  let startTime = 0;
  if (!options?.forceFullScan) {
    const saved = localStorage.getItem(LAST_SMS_SYNC_KEY);
    if (saved) {
      startTime = Math.max(0, parseInt(saved, 10) - 24 * 60 * 60 * 1000); // 24hr lookback buffer
    } else {
      // Default initial scan: last 30 days
      startTime = Date.now() - 30 * 24 * 60 * 60 * 1000;
    }
  }

  // 3. Fetch from Content Provider
  const res = await SmsBridge.fetchInboxSms({
    startTime,
    endTime: Date.now(),
    limit: 300,
  });

  const rawMessages = res.messages || [];
  if (rawMessages.length === 0) {
    localStorage.setItem(LAST_SMS_SYNC_KEY, String(Date.now()));
    return { scannedCount: 0, parsedCount: 0, savedCount: 0, transactions: [] };
  }

  // Existing signatures index
  const existingSignatures = new Set<string>();
  existingTransactions.forEach((tx) => {
    if (tx.dedupSignature) existingSignatures.add(tx.dedupSignature);
  });

  // 4. Parse Messages Locally with Zero-Knowledge Regex
  const parsedList: ParsedSmsTransaction[] = [];
  const seenSignatures = new Set<string>();

  for (const msg of rawMessages) {
    const parsed = parseBankSms(msg.body, msg.address, msg.date);
    if (!parsed) continue; // Dropped OTP, credit, or non-bank SMS

    // Avoid duplicate parsing in the same batch or with existing DB records
    if (seenSignatures.has(parsed.dedupSignature) || existingSignatures.has(parsed.dedupSignature)) {
      continue;
    }

    seenSignatures.add(parsed.dedupSignature);
    parsedList.push(parsed);
  }

  if (parsedList.length === 0) {
    localStorage.setItem(LAST_SMS_SYNC_KEY, String(Date.now()));
    return { scannedCount: rawMessages.length, parsedCount: 0, savedCount: 0, transactions: [] };
  }

  // 5. Categorize Merchants
  const uniqueMerchants = Array.from(new Set(parsedList.map((p) => p.merchant)));
  const categorizations = await categorizeMerchants(uniqueMerchants, categories, {
    provider: options?.provider || "none",
  });

  // 6. Build Final Transaction List
  const transactionsToSave = parsedList.map((p) => {
    const cat = categorizations[p.merchant];
    const categoryId = cat?.categoryId || "cat-food";
    return {
      amount: p.amount,
      type: "expense" as const,
      merchant: p.merchant,
      note: p.merchant,
      categoryId,
      paymentMethod: p.paymentMethod,
      date: p.date,
      source: "bank_sms" as const,
      dedupSignature: p.dedupSignature,
      sourceMetadata: {
        bankName: p.bankName,
        accountMasked: p.accountMasked,
        rawSender: p.bankName,
      },
    };
  });

  // Update high-water mark
  localStorage.setItem(LAST_SMS_SYNC_KEY, String(Date.now()));

  return {
    scannedCount: rawMessages.length,
    parsedCount: parsedList.length,
    savedCount: transactionsToSave.length,
    transactions: transactionsToSave,
  };
}
