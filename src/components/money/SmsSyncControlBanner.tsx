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

  // Autonomous On-Launch Silent Background Auto-Scan (Runs once per session with 15-min cooldown)
  useEffect(() => {
    if (!isNative || hasSmsPermission !== true) return;

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
        <div className="bg-[#FAF8F5] border-2 border-[#161514] rounded-2xl p-4 shadow-[4px_4px_0px_0px_#161514] mb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-xl bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center shadow-[1px_1px_0px_0px_#161514] shrink-0">
              <Smartphone className="size-5 text-[#161514]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-black uppercase text-[#161514] font-heading">
                Enable Automatic Bank SMS Tracking
              </h4>
              <p className="text-xs text-[#161514]/75 font-medium mt-0.5">
                Invictus automatically captures your daily bank transactions locally on your phone.
                Zero personal messages, chats, or OTPs are ever read or uploaded.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-4 py-2 rounded-xl border-2 border-[#161514] bg-[#CEF431] text-[#161514] font-black text-xs uppercase hover:bg-[#bfe627] shadow-[2px_2px_0px_0px_#161514] active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Smartphone className="size-3.5" />
              <span>Allow SMS Access (Android Dialog)</span>
            </button>

            {permissionDeniedPermanently && (
              <button
                type="button"
                onClick={handleOpenAppSettings}
                className="px-3.5 py-2 rounded-xl border-2 border-[#161514] bg-[#FFFFFF] text-[#161514] font-black text-xs uppercase hover:bg-zinc-100 shadow-[2px_2px_0px_0px_#161514] active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ExternalLink className="size-3.5" />
                <span>Open App Settings</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Main SMS Telemetry & Action Banner */}
      <div className="bg-[#FAF8F5] border-2 border-[#161514] rounded-2xl p-3 sm:p-3.5 shadow-[3px_3px_0px_0px_#161514] mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
          {/* Left Side: Telemetry Info */}
          <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
            <div className="size-8 rounded-xl bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center shadow-[1px_1px_0px_0px_#161514] shrink-0 mt-0.5 sm:mt-0">
              <Smartphone className="size-4 text-[#161514]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black uppercase text-[#161514] font-heading">
                  {isNative ? "Bank SMS Auto-Sync" : "Local SMS Engine"}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-400 shrink-0">
                  <ShieldCheck className="size-3" />
                  <span>On-Device</span>
                </span>
              </div>
              <p className="text-[11px] text-[#161514]/75 font-medium leading-relaxed break-words whitespace-normal mt-0.5">
                {isNative
                  ? `Launch auto-scan active. Last scan: ${lastSyncText || "Never"}`
                  : "Air-gapped on-device regex. Configure learned rules in Settings."}
              </p>
            </div>
          </div>

          {/* Right Side: Primary Actions with Zero Overlap */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end shrink-0 flex-wrap sm:flex-nowrap pt-1 sm:pt-0">
            {/* Quick Cash Button */}
            <button
              type="button"
              onClick={onOpenCashModal}
              className="px-3 py-1.5 rounded-xl border-2 border-[#161514] bg-[#FFFFFF] text-[#161514] font-black text-xs uppercase hover:bg-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514] active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
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
                className="px-3 py-1.5 rounded-xl border-2 border-[#161514] bg-[#FFFFFF] text-[#161514] font-black text-xs uppercase hover:bg-zinc-50 shadow-[2px_2px_0px_0px_#161514] active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0"
                title="Filter & scan SMS by date (Today, Yesterday, Custom)"
              >
                <Calendar className="size-3.5 text-[#161514]" />
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
                  "min-w-[124px] px-3.5 py-1.5 rounded-xl border-2 border-[#161514] font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#161514] active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap shrink-0",
                  isSyncing ? "bg-zinc-200 text-zinc-500 cursor-not-allowed" : "bg-[#CEF431] text-[#161514] hover:bg-[#bfe627]"
                )}
              >
                <RefreshCw className={cn("size-3.5 shrink-0", isSyncing && "animate-spin")} />
                <span>{isSyncing ? "Scanning..." : "Scan Inbox"}</span>
              </button>
            )}

            {/* Discrete Shortcut to Settings > Bank SMS */}
            <Link
              href="/settings#bank-sms"
              className="size-8 rounded-xl border-2 border-[#161514] bg-[#FFFFFF] text-[#161514] hover:bg-[#FAF8F5] flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-y-0.5 transition-all shrink-0 cursor-pointer"
              title="Configure Bank SMS Rules & Parser Sandbox in Settings"
            >
              <Sliders className="size-3.5 text-[#161514]" />
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
