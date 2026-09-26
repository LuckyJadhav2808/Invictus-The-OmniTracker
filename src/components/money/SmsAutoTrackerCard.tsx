"use client";

import { useState } from "react";
import { useBankSmsTracker } from "@/lib/hooks/useBankSmsTracker";
import { SmsSimulatorModal } from "./SmsSimulatorModal";
import { SmsFetchModal } from "./SmsFetchModal";
import { Zap, ShieldCheck, Smartphone, Sparkles, AlertCircle, Calendar, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { openNativeAppSettings } from "@/lib/native/sms-bridge";

export function SmsAutoTrackerCard() {
  const { isEnabled, trackingMode, setTrackingMode, hasPermission, toggleSmsTracker } = useBankSmsTracker();
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isFetchModalOpen, setIsFetchModalOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-3xl p-6 border-[2.5px] border-[#161514] shadow-[5px_5px_0px_0px_#161514] space-y-5">
        {/* Header & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#161514] shrink-0">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm uppercase tracking-wider text-[#161514] font-heading">
                  Transaction Tracking Mode
                </h3>
                <span
                  className={cn(
                    "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-[#161514] flex items-center gap-1",
                    trackingMode === "sms_assisted"
                      ? "bg-[#CEF431] text-[#161514]"
                      : "bg-[#E7E5E4] text-[#78716C]"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      trackingMode === "sms_assisted" ? "bg-[#161514] animate-pulse" : "bg-[#A8A29E]"
                    )}
                  />
                  {trackingMode === "sms_assisted" ? "SMS-ASSISTED ACTIVE" : "MANUAL MODE"}
                </span>
              </div>
              <p className="text-xs text-[#161514]/80 font-bold mt-1 leading-snug">
                Choose between standard manual tracking or smart SMS auto-detection & inbox sync.
              </p>
            </div>
          </div>
        </div>

        {/* Dual Mode Selector Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Manual Mode Option */}
          <div
            onClick={() => setTrackingMode("manual")}
            className={cn(
              "p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2",
              trackingMode === "manual"
                ? "bg-[#FFF9EA] border-[#161514] shadow-[3px_3px_0px_0px_#161514] ring-2 ring-amber-400"
                : "bg-[#FAF8F5] border-[#161514]/30 hover:border-[#161514]"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#161514] flex items-center gap-1.5">
                <span>📝</span>
                <span>Manual Only</span>
              </span>
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 border-[#161514] flex items-center justify-center text-[9px] font-black",
                  trackingMode === "manual" ? "bg-[#161514] text-white" : "bg-white"
                )}
              >
                {trackingMode === "manual" ? "✓" : ""}
              </div>
            </div>
            <p className="text-[11px] text-[#161514]/75 font-semibold leading-relaxed">
              Standard manual entry. No SMS reading, zero permissions, total privacy and quiet operation.
            </p>
          </div>

          {/* SMS-Assisted Mode Option */}
          <div
            onClick={() => setTrackingMode("sms_assisted")}
            className={cn(
              "p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2",
              trackingMode === "sms_assisted"
                ? "bg-[#CEF431]/20 border-[#161514] shadow-[3px_3px_0px_0px_#161514] ring-2 ring-[#03D26F]"
                : "bg-[#FAF8F5] border-[#161514]/30 hover:border-[#161514]"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#161514] flex items-center gap-1.5">
                <span>⚡</span>
                <span>SMS-Assisted Mode</span>
              </span>
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 border-[#161514] flex items-center justify-center text-[9px] font-black",
                  trackingMode === "sms_assisted" ? "bg-[#161514] text-white" : "bg-white"
                )}
              >
                {trackingMode === "sms_assisted" ? "✓" : ""}
              </div>
            </div>
            <p className="text-[11px] text-[#161514]/75 font-semibold leading-relaxed">
              On-demand inbox fetching by day, real-time background detection, and zero-knowledge parsing.
            </p>
          </div>
        </div>

        {/* Permission warning banner if native and denied */}
        {Capacitor.isNativePlatform() && !hasPermission && trackingMode === "sms_assisted" && (
          <div className="bg-rose-100 border-2 border-rose-500 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-bold text-rose-900 shadow-[2px_2px_0px_0px_#E11D48]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Android SMS permission is required to fetch and listen for bank alerts.</span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => toggleSmsTracker(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] uppercase border border-rose-900 shadow-[1.5px_1.5px_0px_0px_#881337] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                Grant Permission
              </button>
              <button
                type="button"
                onClick={() => openNativeAppSettings()}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-rose-950 font-black text-[11px] uppercase border border-rose-400 shadow-[1.5px_1.5px_0px_0px_#881337] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                App Settings
              </button>
            </div>
          </div>
        )}

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="bg-[#FAF8F5] border-2 border-[#161514] rounded-2xl p-3 shadow-[2px_2px_0px_0px_#161514] flex items-center gap-2.5">
            <span className="text-lg">🛡️</span>
            <div>
              <p className="text-xs font-black text-[#161514] uppercase leading-tight">Zero-Knowledge</p>
              <p className="text-[11px] text-[#161514]/70 font-semibold leading-tight mt-0.5">
                Balances and OTPs are stripped before parsing. 0 private data saved.
              </p>
            </div>
          </div>

          <div className="bg-[#FAF8F5] border-2 border-[#161514] rounded-2xl p-3 shadow-[2px_2px_0px_0px_#161514] flex items-center gap-2.5">
            <span className="text-lg">📅</span>
            <div>
              <p className="text-xs font-black text-[#161514] uppercase leading-tight">On-Demand Date Fetch</p>
              <p className="text-[11px] text-[#161514]/70 font-semibold leading-tight mt-0.5">
                Fetch transactions for Today, Yesterday, or any specific day with 1 tap.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t-2 border-[#161514] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] font-black text-[#161514]/70 uppercase tracking-tight">
            <span>TRAI DLT Whitelisted</span>
            <span>•</span>
            <span>100% On-Device Filter</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setIsSimulatorOpen(true)}
              className="px-3 py-2 rounded-xl bg-white hover:bg-stone-100 text-[#161514] text-xs font-black uppercase tracking-wider border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Simulator</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFetchModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#CEF431] hover:bg-[#b8dd24] text-[#161514] text-xs font-black uppercase tracking-wider border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Zap className="h-4 w-4 stroke-[2.5]" />
              <span>Fetch SMS by Date</span>
            </button>
          </div>
        </div>
      </div>

      <SmsSimulatorModal
        open={isSimulatorOpen}
        onOpenChange={setIsSimulatorOpen}
      />

      <SmsFetchModal
        open={isFetchModalOpen}
        onOpenChange={setIsFetchModalOpen}
      />
    </>
  );
}
