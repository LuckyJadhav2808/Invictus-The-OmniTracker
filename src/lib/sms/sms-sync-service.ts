/**
 * Invictus Native Android SMS Sync Service
 * Bridges Capacitor Telephony Plugin with Local Zero-Knowledge Regex Parser
 * and Constrained Categorizer.
 * 
 * Includes:
 * 1. Automatic On-Launch Background Scanner for Current Day's SMS (with 2hr midnight buffer & 15-min cooldown)
 * 2. Targeted Date Range Scanning (Today, Yesterday, Past 7 Days, This Month, Custom)
 * 3. Native Android Runtime Permission Checking & Trigger
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
export const LAST_AUTO_SCAN_KEY = "invictus_last_auto_scan_timestamp";
export const AUTO_SCAN_COOLDOWN_MS = 15 * 60 * 1000; // 15-minute cooldown between background auto-scans

export function getLastSmsSyncTimestamp(): number | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(LAST_SMS_SYNC_KEY);
  if (!saved) return null;
  const num = parseInt(saved, 10);
  return isNaN(num) ? null : num;
}

export function resetLastSmsSyncTimestamp(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(LAST_SMS_SYNC_KEY);
  }
}

export function getLastAutoScanTimestamp(): number | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(LAST_AUTO_SCAN_KEY);
  if (!saved) return null;
  const num = parseInt(saved, 10);
  return isNaN(num) ? null : num;
}

export function setLastAutoScanTimestamp(timestamp: number): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(LAST_AUTO_SCAN_KEY, String(timestamp));
  }
}

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
    type: "expense";
    note: string;
    source: "bank_sms";
    sourceMetadata: {
      bankName: string;
      accountMasked?: string;
      rawSender: string;
    };
  }>;
}

export interface SyncBankSmsOptions {
  forceFullScan?: boolean;
  startTime?: number;
  endTime?: number;
  provider?: "gemini" | "openai" | "none";
  requestPermissionIfNeeded?: boolean;
  addCategoryFn?: (
    cat: Omit<Category, "id" | "archived" | "createdAt"> & { id?: string }
  ) => Promise<Category>;
}

export type SmsDatePreset = "today" | "yesterday" | "past_7_days" | "this_month" | "custom";

export function getPresetDateRange(preset: SmsDatePreset): { startTime: number; endTime: number; label: string } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = now.getTime();

  switch (preset) {
    case "today": {
      // 2hr buffer back to 10:00 PM yesterday for midnight transactions
      return {
        startTime: Math.max(0, startOfToday - 2 * 60 * 60 * 1000),
        endTime: endOfToday,
        label: "Today (with late-night buffer)",
      };
    }
    case "yesterday": {
      const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
      const endOfYesterday = startOfToday - 1; // 23:59:59.999
      return {
        startTime: startOfYesterday,
        endTime: endOfYesterday,
        label: "Yesterday (Full 24 hrs)",
      };
    }
    case "past_7_days": {
      return {
        startTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
        endTime: endOfToday,
        label: "Past 7 Days",
      };
    }
    case "this_month": {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return {
        startTime: startOfMonth,
        endTime: endOfToday,
        label: "This Month (1st to Now)",
      };
    }
    case "custom":
    default: {
      return {
        startTime: startOfToday,
        endTime: endOfToday,
        label: "Custom Range",
      };
    }
  }
}

/**
 * Scans bank SMS from the Android device inbox, parses them locally with regex,
 * classifies categories, and returns new deduplicated transaction records.
 */
export async function syncRecentBankSms(
  categories: Category[],
  existingTransactions: Transaction[] = [],
  options?: SyncBankSmsOptions
): Promise<SyncSmsResult> {
  const isNative = await isSmsSyncAvailable();
  if (!isNative) {
    return { scannedCount: 0, parsedCount: 0, savedCount: 0, transactions: [] };
  }

  // 1. Check & Request Permissions
  const perm = await SmsBridge.checkPermissions();
  if (!perm.smsGranted) {
    if (options?.requestPermissionIfNeeded === false) {
      return { scannedCount: 0, parsedCount: 0, savedCount: 0, transactions: [] };
    }
    const req = await SmsBridge.requestPermissions();
    if (!req.smsGranted) {
      throw new Error("SMS permission is required to automatically parse bank transaction SMS.");
    }
  }

  // 2. Determine Query Time Bounds
  let startTime = 0;
  let endTime = options?.endTime ?? Date.now();

  if (options?.startTime !== undefined) {
    startTime = options.startTime;
  } else if (options?.forceFullScan) {
    startTime = Date.now() - 30 * 24 * 60 * 60 * 1000; // Force 30-day lookback
  } else {
    const saved = localStorage.getItem(LAST_SMS_SYNC_KEY);
    if (saved) {
      startTime = Math.max(0, parseInt(saved, 10) - 48 * 60 * 60 * 1000); // 48hr lookback buffer ensures today + yesterday are captured
    } else {
      startTime = Date.now() - 30 * 24 * 60 * 60 * 1000;
    }
  }

  // 3. Fetch from Content Provider
  const res = await SmsBridge.fetchInboxSms({
    startTime,
    endTime,
    limit: 500,
  });

  const rawMessages = res.messages || [];
  if (rawMessages.length === 0) {
    if (!options?.startTime) {
      localStorage.setItem(LAST_SMS_SYNC_KEY, String(Date.now()));
    }
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
    if (!options?.startTime) {
      localStorage.setItem(LAST_SMS_SYNC_KEY, String(Date.now()));
    }
    return { scannedCount: rawMessages.length, parsedCount: 0, savedCount: 0, transactions: [] };
  }

  // 5. Categorize Merchants
  const uniqueMerchants = Array.from(new Set(parsedList.map((p) => p.merchant)));
  const categorizations = await categorizeMerchants(uniqueMerchants, categories, {
    provider: options?.provider || "none",
    addCategoryFn: options?.addCategoryFn,
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
        accountMasked: p.accountMasked || "",
        rawSender: p.bankName,
      },
    };
  });

  // Update high-water mark only if doing normal forward sync
  if (!options?.startTime) {
    localStorage.setItem(LAST_SMS_SYNC_KEY, String(Date.now()));
  }

  return {
    scannedCount: rawMessages.length,
    parsedCount: parsedList.length,
    savedCount: transactionsToSave.length,
    transactions: transactionsToSave,
  };
}

/**
 * Autonomous On-Launch Background Scanner:
 * Checks for current day's SMS (with 2-hour late night buffer)
 * Protected by 15-minute cooldown guardrail to prevent battery and CPU thrashing.
 * Never throws errors or pops intrusive permission prompts.
 */
export async function autoScanTodayBankSms(
  categories: Category[],
  existingTransactions: Transaction[] = [],
  options?: {
    forceCooldownBypass?: boolean;
    addCategoryFn?: (
      cat: Omit<Category, "id" | "archived" | "createdAt"> & { id?: string }
    ) => Promise<Category>;
  }
): Promise<SyncSmsResult | null> {
  const isNative = await isSmsSyncAvailable();
  if (!isNative) return null;

  try {
    const perm = await SmsBridge.checkPermissions();
    if (!perm.smsGranted) {
      // Permission not granted yet: do not harass on background launch
      return null;
    }

    // Cooldown check
    const lastScan = getLastAutoScanTimestamp();
    const now = Date.now();
    if (!options?.forceCooldownBypass && lastScan && now - lastScan < AUTO_SCAN_COOLDOWN_MS) {
      return null;
    }

    // Current Day bounds with 2hr late-night buffer
    const range = getPresetDateRange("today");

    const result = await syncRecentBankSms(categories, existingTransactions, {
      startTime: range.startTime,
      endTime: range.endTime,
      requestPermissionIfNeeded: false,
      addCategoryFn: options?.addCategoryFn,
    });

    setLastAutoScanTimestamp(now);
    return result;
  } catch (err) {
    console.warn("[AutoScanTodayBankSms]: Silent background scan failed gracefully:", err);
    return null;
  }
}
