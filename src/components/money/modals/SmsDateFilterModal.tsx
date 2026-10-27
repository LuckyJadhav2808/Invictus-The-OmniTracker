"use client";

import React, { useState, useMemo } from "react";
import { format, subDays, startOfMonth, startOfDay, endOfDay } from "date-fns";
import { Calendar, X, RefreshCw, CheckCircle2, Sliders, ArrowRight, ShieldCheck, Sparkles, Clock } from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { syncRecentBankSms, type SmsDatePreset, type SyncSmsResult } from "@/lib/sms/sms-sync-service";
import { type Category, type Transaction } from "@/types";
import { useBulkAddTransactions, useAddCategory } from "@/lib/queries/money";

interface SmsDateFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  transactions: Transaction[];
  onScanComplete?: (result: SyncSmsResult) => void;
}

export function SmsDateFilterModal({
  isOpen,
  onClose,
  categories,
  transactions,
  onScanComplete,
}: SmsDateFilterModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<SmsDatePreset>("today_and_yesterday");
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const [customStartDate, setCustomStartDate] = useState(format(subDays(new Date(), 2), "yyyy-MM-dd"));
  const [customEndDate, setCustomEndDate] = useState(todayStr);
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<SyncSmsResult | null>(null);

  const bulkAddMutation = useBulkAddTransactions();
  const addCategoryMutation = useAddCategory();

  // Compute calculated start and end times in epoch ms based on current selection
  const computedRange = useMemo(() => {
    const now = new Date();
    const safeFutureBuffer = 12 * 60 * 60 * 1000; // 12-hr future buffer prevents carrier clock skew exclusion

    if (selectedPreset === "today_and_yesterday") {
      const yesterday = subDays(now, 1);
      return {
        startTime: startOfDay(yesterday).getTime(),
        endTime: now.getTime() + safeFutureBuffer,
        label: "Today & Yesterday (Full 48 hrs)",
      };
    }
    if (selectedPreset === "today") {
      const start = startOfDay(now).getTime();
      return {
        startTime: Math.max(0, start - 2 * 60 * 60 * 1000), // 2hr late-night buffer (10 PM yesterday)
        endTime: now.getTime() + safeFutureBuffer,
        label: "Today (Since midnight)",
      };
    }
    if (selectedPreset === "yesterday") {
      const yesterday = subDays(now, 1);
      return {
        startTime: startOfDay(yesterday).getTime(),
        endTime: endOfDay(yesterday).getTime(),
        label: "Yesterday (Full 24 hrs)",
      };
    }
    if (selectedPreset === "past_7_days") {
      return {
        startTime: subDays(now, 7).getTime(),
        endTime: now.getTime() + safeFutureBuffer,
        label: "Past 7 Days",
      };
    }
    if (selectedPreset === "this_month") {
      return {
        startTime: startOfMonth(now).getTime(),
        endTime: now.getTime() + safeFutureBuffer,
        label: "This Month (1st to Now)",
      };
    }
    // Custom Range
    const start = new Date(customStartDate + "T00:00:00").getTime();
    const end = new Date(customEndDate + "T23:59:59.999").getTime();
    return {
      startTime: isNaN(start) ? startOfDay(now).getTime() : start,
      endTime: isNaN(end) ? now.getTime() + safeFutureBuffer : Math.max(start, end),
      label: `${customStartDate} → ${customEndDate}`,
    };
  }, [selectedPreset, customStartDate, customEndDate]);

  if (!isOpen) return null;

  const handleScan = async () => {
    setIsScanning(true);
    soundFX.play("click");
    setLastResult(null);

    try {
      const result = await syncRecentBankSms(categories, transactions, {
        startTime: computedRange.startTime,
        endTime: computedRange.endTime,
        addCategoryFn: addCategoryMutation.mutateAsync,
      });

      setLastResult(result);

      if (result.transactions.length > 0) {
        soundFX.play("celebrate");
        await bulkAddMutation.mutateAsync(result.transactions);
        toast.success(`⚡ Imported ${result.transactions.length} new transactions!`, {
          description: `Scanned ${result.scannedCount} SMS messages from ${computedRange.label}.`,
        });
      } else {
        soundFX.play("pop");
        toast.info("Ledger up to date", {
          description: `Checked ${result.scannedCount} candidate SMS (${computedRange.label}). All transactions already in ledger.`,
        });
      }

      if (onScanComplete) {
        onScanComplete(result);
      }
    } catch (err: any) {
      soundFX.play("error");
      toast.error(err.message || "Failed to scan SMS for selected dates");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FAF8F5] border-2 border-[#161514] rounded-2xl w-full max-w-lg shadow-[6px_6px_0px_0px_#161514] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#FFFFFF] border-b-2 border-[#161514] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center shadow-[1px_1px_0px_0px_#161514]">
              <Calendar className="size-4 text-[#161514]" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-[#161514] font-heading">
                Date-Targeted SMS Scanner
              </h3>
              <p className="text-[11px] text-[#161514]/70 font-medium">
                Collect bank transactions for today, yesterday, or custom dates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFX.play("click");
              onClose();
            }}
            className="size-8 rounded-xl border-2 border-[#161514] bg-[#FFFFFF] hover:bg-zinc-100 flex items-center justify-center shadow-[2px_2px_0px_0px_#161514] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <X className="size-4 text-[#161514]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Quick Preset Chips */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-[#161514] block mb-2 font-mono">
              Select Date Window:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: "today_and_yesterday", label: "Today & Yesterday", desc: "Current day + day before" },
                  { id: "today", label: "Today Only", desc: "Since midnight" },
                  { id: "yesterday", label: "Yesterday", desc: "Past 24 hours" },
                  { id: "past_7_days", label: "Past 7 Days", desc: "Last 7 days" },
                  { id: "this_month", label: "This Month", desc: "1st to now" },
                  { id: "custom", label: "Custom Range", desc: "Pick dates" },
                ] as const
              ).map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      soundFX.play("pop");
                      setSelectedPreset(preset.id);
                    }}
                    className={cn(
                      "p-2.5 rounded-xl border-2 border-[#161514] text-left transition-all cursor-pointer",
                      isSelected
                        ? "bg-[#CEF431] shadow-[2px_2px_0px_0px_#161514] -translate-y-0.5"
                        : "bg-[#FFFFFF] hover:bg-zinc-50 shadow-[1px_1px_0px_0px_#161514]"
                    )}
                  >
                    <div className="text-xs font-black uppercase text-[#161514] font-heading leading-tight flex items-center justify-between">
                      <span>{preset.label}</span>
                      {preset.id === "today_and_yesterday" && (
                        <span className="text-[8px] bg-[#161514] text-[#FAF8F5] px-1 py-0.2 rounded font-mono">
                          REC
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#161514]/70 font-medium mt-0.5">
                      {preset.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Range Pickers (Visible only when 'custom' is selected) */}
          {selectedPreset === "custom" && (
            <div className="p-3 bg-[#FFFFFF] border-2 border-[#161514] rounded-xl shadow-[2px_2px_0px_0px_#161514] space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="text-xs font-black uppercase text-[#161514] font-mono">
                Custom Window (Start & End):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#161514]/70 block mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    max={customEndDate || todayStr}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-[#FAF8F5] border-2 border-[#161514] rounded-lg shadow-[1px_1px_0px_0px_#161514] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#161514]/70 block mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    min={customStartDate}
                    max={todayStr}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-[#FAF8F5] border-2 border-[#161514] rounded-lg shadow-[1px_1px_0px_0px_#161514] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Range Telemetry Pill */}
          <div className="p-3 rounded-xl bg-zinc-100 border-2 border-[#161514] flex items-center justify-between text-xs font-mono">
            <span className="text-[#161514]/70 font-bold uppercase flex items-center gap-1.5">
              <Clock className="size-3.5 text-[#161514]" />
              <span>Target Span:</span>
            </span>
            <span className="font-black text-[#161514] truncate ml-2">
              {format(new Date(computedRange.startTime), "MMM d, yyyy")} →{" "}
              {format(new Date(Math.min(computedRange.endTime, Date.now())), "MMM d, yyyy")}
            </span>
          </div>

          {/* Real-time Scan Result Summary */}
          {lastResult && (
            <div className="p-3 bg-emerald-50 border-2 border-emerald-500 rounded-xl space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-emerald-900 font-black text-xs uppercase">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Inbox Scan Report ({computedRange.label})</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-1.5 rounded-lg bg-white/80 border border-emerald-300">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase">SMS Read</div>
                  <div className="text-sm font-black font-mono text-zinc-800">{lastResult.scannedCount}</div>
                </div>
                <div className="p-1.5 rounded-lg bg-white/80 border border-emerald-300">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase">Debits Found</div>
                  <div className="text-sm font-black font-mono text-zinc-800">{lastResult.parsedCount}</div>
                </div>
                <div className="p-1.5 rounded-lg bg-emerald-100 border border-emerald-400">
                  <div className="text-[10px] text-emerald-800 font-bold uppercase">Imported</div>
                  <div className="text-sm font-black font-mono text-emerald-900">{lastResult.savedCount}</div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Guarantee */}
          <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-900">
            <ShieldCheck className="size-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              100% on-device zero-knowledge parser. Personal chats, calls, and OTPs are dropped with zero network transfer.
            </p>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-[#FFFFFF] border-t-2 border-[#161514] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border-2 border-[#161514] bg-[#FFFFFF] text-[#161514] font-black text-xs uppercase hover:bg-zinc-50 shadow-[2px_2px_0px_0px_#161514] active:translate-y-0.5 transition-all cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            disabled={isScanning}
            onClick={handleScan}
            className={cn(
              "px-5 py-2 rounded-xl border-2 border-[#161514] font-black text-xs uppercase flex items-center gap-2 shadow-[3px_3px_0px_0px_#161514] active:translate-y-0.5 transition-all cursor-pointer",
              isScanning
                ? "bg-zinc-200 text-zinc-500 cursor-not-allowed"
                : "bg-[#CEF431] text-[#161514] hover:bg-[#bfe627]"
            )}
          >
            <RefreshCw className={cn("size-4 shrink-0", isScanning && "animate-spin")} />
            <span>{isScanning ? "Scanning Dates..." : "Scan & Import Expenses"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
