"use client";

import { useState } from "react";
import { useBankSmsTracker } from "@/lib/hooks/useBankSmsTracker";
import { SmsSimulatorModal } from "./SmsSimulatorModal";
import { Button } from "@/components/ui/button";
import { Zap, ShieldCheck, Lock, Smartphone, Sparkles } from "lucide-react";

export function SmsAutoTrackerCard() {
  const { isEnabled, toggleSmsTracker } = useBankSmsTracker();
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-[#181716] border-2 border-[#2A2826] p-5 shadow-lg">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#05DF72]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#05DF72]/15 border border-[#05DF72]/30 text-[#05DF72] shrink-0 mt-0.5">
              <Zap className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Bank SMS Auto-Tracker
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#05DF72]/20 border border-[#05DF72]/40 text-[#05DF72]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#05DF72] animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1 max-w-md leading-relaxed">
                Automatically extracts transactions from HDFC, SBI, ICICI, Axis, Paytm & CRED notifications without passwords or logins.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSimulatorOpen(true)}
              className="bg-[#242220] border-[#363330] hover:bg-[#2C2927] text-stone-200 text-xs font-bold rounded-xl h-9 px-3.5 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#05DF72]" />
              Test Parser Sandbox
            </Button>

            <div className="flex items-center gap-2 pl-2 border-l border-[#2E2C2A]">
              <button
                type="button"
                onClick={() => toggleSmsTracker()}
                role="switch"
                aria-checked={isEnabled}
                className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                  isEnabled ? "bg-[#05DF72]" : "bg-stone-700"
                }`}
              >
                <div
                  className={`bg-black w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                    isEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Security Pillars Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-[#262422]">
          <div className="flex items-center gap-2 text-[11px] text-stone-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#05DF72] shrink-0" />
            <span>100% On-Device Processing</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-stone-400 font-medium">
            <Lock className="w-4 h-4 text-[#05DF72] shrink-0" />
            <span>Zero OTPs & Credentials Stored</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-stone-400 font-medium">
            <Smartphone className="w-4 h-4 text-[#05DF72] shrink-0" />
            <span>TRAI Bank Header Whitelist</span>
          </div>
        </div>
      </div>

      <SmsSimulatorModal open={isSimulatorOpen} onOpenChange={setIsSimulatorOpen} />
    </>
  );
}
