"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import {
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import { isSmsSyncAvailable, syncRecentBankSms, getLastSmsSyncTimestamp } from "@/lib/sms/sms-sync-service";
import { type Category, type Transaction } from "@/types";
import { useBulkAddTransactions, useAddCategory } from "@/lib/queries/money";

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncText, setLastSyncText] = useState<string | null>(null);

  const bulkAddMutation = useBulkAddTransactions();
  const addCategoryMutation = useAddCategory();

  useEffect(() => {
    isSmsSyncAvailable().then((avail) => {
      setIsNative(avail);
    });

    const savedTimestamp = getLastSmsSyncTimestamp();
    if (savedTimestamp) {
      const d = new Date(savedTimestamp);
      setLastSyncText(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }
  }, []);

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
      setLastSyncText(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err: any) {
      soundFX.play("error");
      toast.error(err.message || "SMS sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] border-2 border-[#161514] rounded-2xl p-3 shadow-[3px_3px_0px_0px_#161514] mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left Side: Telemetry Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-xl bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center shadow-[1px_1px_0px_0px_#161514] shrink-0">
            <Smartphone className="size-4 text-[#161514]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black uppercase text-[#161514] truncate font-heading">
                {isNative ? "Bank SMS Auto-Sync" : "Local SMS Engine"}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-400 shrink-0">
                <ShieldCheck className="size-3" />
                <span>On-Device</span>
              </span>
            </div>
            <p className="text-[11px] text-[#161514]/70 font-medium truncate">
              {isNative
                ? `Android background listener active. Last scan: ${lastSyncText || "Never"}`
                : "Air-gapped on-device regex. Configure learned rules in Settings."}
            </p>
          </div>
        </div>

        {/* Right Side: Primary Actions with Zero Overlap */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          {/* Quick Cash Button */}
          <button
            type="button"
            onClick={onOpenCashModal}
            className="px-3 py-1.5 rounded-xl border-2 border-[#161514] bg-[#FFFFFF] text-[#161514] font-black text-xs uppercase hover:bg-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514] active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap"
          >
            + Log Cash
          </button>

          {/* Native Sync CTA with Fixed Minimum Width to prevent wrapping & overlap */}
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

          {/* Discrete Shortcut to Settings > Bank SMS & Telemetry Rules */}
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
  );
}
