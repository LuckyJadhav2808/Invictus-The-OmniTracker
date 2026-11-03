"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import {
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Calendar,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  isSmsSyncAvailable,
  syncRecentBankSms,
  autoScanTodayBankSms,
  getLastSmsSyncTimestamp,
  SmsBridge,
} from "@/lib/sms/sms-sync-service";
import { type Category, type Transaction } from "@/types";
import { useBulkAddTransactions, useAddCategory } from "@/lib/queries/money";
import { SmsDateFilterModal } from "./modals/SmsDateFilterModal";

interface SmsSyncControlBannerProps {
  categories: Category[];
  transactions: Transaction[];
  onOpenCashModal: () => void;
}

export function SmsSyncControlBanner({
  categories,
  transactions,
  onOpenCashModal,
}: SmsSyncControlBannerProps) {
  const [isNative, setIsNative] = useState(false);
  const [hasSmsPermission, setHasSmsPermission] = useState<boolean | null>(null);
  const [permissionDeniedPermanently, setPermissionDeniedPermanently] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [lastSyncText, setLastSyncText] = useState<string | null>(null);
  // SMS background auto-fetch is STRICTLY toggled OFF by default for all users
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("invictus_sms_auto_fetch_enabled");
      if (saved === "true") setAutoSyncEnabled(true);
    }
  }, []);

  const handleToggleAutoSync = () => {
    soundFX.play("pop");
    const next = !autoSyncEnabled;
    setAutoSyncEnabled(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("invictus_sms_auto_fetch_enabled", String(next));
    }
    toast.info(next ? "Automatic bank SMS fetching enabled" : "Automatic bank SMS fetching disabled");
  };

  const bulkAddMutation = useBulkAddTransactions();
  const addCategoryMutation = useAddCategory();

  const refreshSyncTimestamp = useCallback(() => {
    const savedTimestamp = getLastSmsSyncTimestamp();
    if (savedTimestamp) {
      const d = new Date(savedTimestamp);
      setLastSyncText(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }
  }, []);

  // Check native platform & permissions on mount
  useEffect(() => {
    let mounted = true;

    isSmsSyncAvailable().then(async (avail) => {
      if (!mounted) return;
      setIsNative(avail);

      if (avail) {
        try {
          const perm = await SmsBridge.checkPermissions();
          if (mounted) {
            setHasSmsPermission(perm.smsGranted);
          }
        } catch {
          if (mounted) setHasSmsPermission(false);
        }
      }
    });

    refreshSyncTimestamp();

    return () => {
      mounted = false;
    };
  }, [refreshSyncTimestamp]);

  // Background Auto-Scan (STRICTLY GATED by autoSyncEnabled, which is false by default)
  useEffect(() => {
    if (!isNative || hasSmsPermission !== true || !autoSyncEnabled) return;

    let cancelled = false;

    // Fire auto-scan for today's SMS non-blockingly
    autoScanTodayBankSms(categories, transactions, {
      addCategoryFn: addCategoryMutation.mutateAsync,
    })
      .then(async (result) => {
        if (cancelled || !result) return;

        if (result.transactions.length > 0) {
          soundFX.play("celebrate");
          await bulkAddMutation.mutateAsync(result.transactions);
          toast.success(`⚡ Imported ${result.transactions.length} fresh transactions today!`, {
            description: `Auto-scanned ${result.scannedCount} bank SMS on launch.`,
          });
        }
        refreshSyncTimestamp();
      })
      .catch((err) => {
        console.warn("[AutoScanOnLaunch]: Handled gracefully:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [isNative, hasSmsPermission, refreshSyncTimestamp]);

  // Request Android Runtime Permission via Native System Dialog
  const handleRequestPermission = async () => {
    soundFX.play("click");
    try {
      const req = await SmsBridge.requestPermissions();
      if (req.smsGranted) {
        soundFX.play("celebrate");
        setHasSmsPermission(true);
        setPermissionDeniedPermanently(false);
        toast.success("SMS permission granted!", {
          description: "Invictus can now automatically parse bank transaction alerts.",
        });

        // Trigger immediate on-launch scan since user just allowed permission
        setIsSyncing(true);
        const result = await autoScanTodayBankSms(categories, transactions, {
          forceCooldownBypass: true,
          addCategoryFn: addCategoryMutation.mutateAsync,
        });
        if (result && result.transactions.length > 0) {
          await bulkAddMutation.mutateAsync(result.transactions);
          toast.success(`⚡ Imported ${result.transactions.length} transactions for today!`);
        }
        refreshSyncTimestamp();
      } else {
        soundFX.play("error");
        setHasSmsPermission(false);
        setPermissionDeniedPermanently(true);
        toast.error("SMS permission was not granted by Android.", {
          description: "You can enable it anytime in Android App Settings.",
        });
      }
    } catch (err: any) {
      soundFX.play("error");
      setPermissionDeniedPermanently(true);
      toast.error(err.message || "Could not request Android permission");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenAppSettings = async () => {
    soundFX.play("click");
    try {
      await SmsBridge.openAppSettings();
    } catch {
      toast.error("Could not open Android settings directly.");
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    soundFX.play("click");
    try {
      const result = await syncRecentBankSms(categories, transactions, {
        addCategoryFn: addCategoryMutation.mutateAsync,
      });
      if (result.transactions.length > 0) {
        soundFX.play("celebrate");
        await bulkAddMutation.mutateAsync(result.transactions);
        toast.success(`⚡ Imported ${result.transactions.length} new bank transactions!`, {
          description: `Scanned ${result.scannedCount} SMS messages with 0 duplicates.`,
        });
      } else {
        toast.info("Ledger up to date", {
          description: `Scanned ${result.scannedCount} SMS. No new transactions found.`,
        });
      }
      refreshSyncTimestamp();
    } catch (err: any) {
      soundFX.play("error");
      toast.error(err.message || "SMS sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      {/* 1. Frictionless Native Permission Banner (Shows only if on native Android without permission) */}
      {isNative && hasSmsPermission === false && (
        <div className="bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531] rounded-xl p-4 mb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-lg bg-[#F1EFEA] dark:bg-[#252321] flex items-center justify-center text-[#161514] dark:text-[#CEF431] shrink-0 border border-[#E8E5DF] dark:border-[#383531]">
              <Smartphone className="size-4 stroke-[1.5]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[13px] font-sans font-semibold text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                Enable Automatic Bank SMS Tracking
              </h4>
              <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] mt-0.5 leading-relaxed">
                Invictus automatically captures your daily bank transactions locally on your phone.
                Zero personal messages, chats, or OTPs are ever read or uploaded.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-3.5 py-1.5 rounded-lg bg-[#161514] dark:bg-[#CEF431] hover:bg-[#2A2826] dark:hover:bg-[#b5da28] text-white dark:text-[#161514] font-medium text-xs transition-colors cursor-pointer flex items-center gap-1.5 font-heading font-black"
            >
              <Smartphone className="size-3.5 stroke-[1.5]" />
              <span>Allow SMS Access</span>
            </button>

            {permissionDeniedPermanently && (
              <button
                type="button"
                onClick={handleOpenAppSettings}
                className="px-3 py-1.5 rounded-lg border border-[#E8E5DF] dark:border-[#383531] bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] hover:bg-[#F5F3EF] dark:hover:bg-[#2A2724] font-medium text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ExternalLink className="size-3.5 stroke-[1.5]" />
                <span>Open App Settings</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Main SMS Telemetry & Action Banner */}
      <div className="bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] rounded-xl p-3.5 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
          {/* Left Side: Telemetry Info */}
          <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
            <div className="size-8 rounded-lg bg-[#F1EFEA] dark:bg-[#252321] flex items-center justify-center text-[#161514] dark:text-[#CEF431] shrink-0 mt-0.5 sm:mt-0 border border-[#E8E5DF] dark:border-[#383531]">
              <Smartphone className="size-4 stroke-[1.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[13px] font-sans font-semibold text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                  {isNative ? "Bank SMS Auto-Sync" : "Local SMS Engine"}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#DCFAE5] dark:bg-[#03D26F]/20 text-[#047857] dark:text-[#03D26F] border border-[#03D26F]/30 shrink-0">
                  <ShieldCheck className="size-3 stroke-[1.5]" />
                  <span>On-Device</span>
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] leading-relaxed break-words whitespace-normal mt-0.5">
                {isNative
                  ? (autoSyncEnabled ? `Auto-fetch active. Last scan: ${lastSyncText || "Never"}` : "Auto-fetch off. Tap 'Scan Inbox' to sync on demand.")
                  : "Air-gapped on-device regex. Configure learned rules in Settings."}
              </p>
            </div>
          </div>

          {/* Right Side: Primary Actions with Zero Overlap */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end shrink-0 flex-wrap sm:flex-nowrap pt-1 sm:pt-0">
            {/* Auto-Fetch Toggle (Default OFF for all users) */}
            {isNative && (
              <button
                type="button"
                onClick={handleToggleAutoSync}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5",
                  autoSyncEnabled
                    ? "bg-[#161514] dark:bg-[#CEF431] text-white dark:text-[#161514] border-[#161514] dark:border-[#CEF431]"
                    : "bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#383531] hover:bg-[#F5F3EF] dark:hover:bg-[#2A2724]"
                )}
                title="Toggle automatic bank SMS scanning on launch (Default: Off)"
              >
                <span>Auto-Fetch:</span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded text-[10px] font-mono",
                  autoSyncEnabled ? "bg-white/20 dark:bg-black/20 text-white dark:text-[#161514]" : "bg-[#F1EFEA] dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5]"
                )}>
                  {autoSyncEnabled ? "ON" : "OFF"}
                </span>
              </button>
            )}

            {/* Quick Cash Button */}
            <button
              type="button"
              onClick={onOpenCashModal}
              className="px-2.5 py-1.5 rounded-lg border border-[#E8E5DF] dark:border-[#383531] bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] font-medium text-xs hover:bg-[#F5F3EF] dark:hover:bg-[#2A2724] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              + Log Cash
            </button>

            {/* Interactive Date Filter Button */}
            {isNative && (
              <button
                type="button"
                onClick={() => {
                  soundFX.play("pop");
                  setIsDateFilterOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-[#E8E5DF] dark:border-[#383531] bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] font-medium text-xs hover:bg-[#F5F3EF] dark:hover:bg-[#2A2724] transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0"
                title="Filter & scan SMS by date (Today, Yesterday, Custom)"
              >
                <Calendar className="size-3.5 stroke-[1.5]" />
                <span>Filter Dates</span>
              </button>
            )}

            {/* Native Sync CTA with Fixed Minimum Width */}
            {isNative && (
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleSyncNow}
                className={cn(
                  "min-w-[110px] px-3 py-1.5 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0",
                  isSyncing ? "bg-[#F1EFEA] dark:bg-[#252321] text-[#6B6B6B] dark:text-[#A8A29E] cursor-not-allowed border border-[#E8E5DF] dark:border-[#383531]" : "bg-[#161514] dark:bg-[#CEF431] hover:bg-[#2A2826] dark:hover:bg-[#b5da28] text-white dark:text-[#161514] border border-[#161514] dark:border-[#CEF431] font-heading font-black"
                )}
              >
                <RefreshCw className={cn("size-3.5 stroke-[1.5] shrink-0", isSyncing && "animate-spin")} />
                <span>{isSyncing ? "Scanning..." : "Scan Inbox"}</span>
              </button>
            )}

            {/* Discrete Shortcut to Settings > Bank SMS */}
            <Link
              href="/settings#bank-sms"
              className="size-8 rounded-lg border border-[#E8E5DF] dark:border-[#383531] bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] hover:bg-[#F5F3EF] dark:hover:bg-[#2A2724] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              title="Configure Bank SMS Rules & Parser Sandbox in Settings"
            >
              <Sliders className="size-3.5 stroke-[1.5]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Date Filter Scanner Modal */}
      <SmsDateFilterModal
        isOpen={isDateFilterOpen}
        onClose={() => setIsDateFilterOpen(false)}
        categories={categories}
        transactions={transactions}
        onScanComplete={() => refreshSyncTimestamp()}
      />
    </>
  );
}
