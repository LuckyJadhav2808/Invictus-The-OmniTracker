"use client";

import React, { useState, useEffect } from "react";
import { Zap, Smartphone, CheckCircle2, Sliders, ArrowUpRight } from "lucide-react";
import { NativeQuickLogBridge } from "@/lib/native/quick-log-bridge";
import { soundFX } from "@/components/shared/SoundFX";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AmbientQuickLogCardProps {
  safeDailyPace: number;
  currencySymbol?: string;
}

export function AmbientQuickLogCard({
  safeDailyPace,
  currencySymbol = "₹",
}: AmbientQuickLogCardProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const isNative = NativeQuickLogBridge.isSupported();

  useEffect(() => {
    let mounted = true;
    NativeQuickLogBridge.isAmbientDockEnabled().then((enabled) => {
      if (mounted) setIsEnabled(enabled);
    });
    // Auto-sync safe daily pace whenever card mounts or budget updates
    NativeQuickLogBridge.syncBudgetTelemetry(safeDailyPace);
    return () => {
      mounted = false;
    };
  }, [safeDailyPace]);

  const handleToggle = async () => {
    soundFX.playPop();
    const nextState = !isEnabled;
    if (nextState && NativeQuickLogBridge.isSupported()) {
      await NativeQuickLogBridge.requestNotificationPermission();
    }
    setIsEnabled(nextState);
    await NativeQuickLogBridge.setAmbientDockEnabled(nextState);

    if (nextState) {
      toast.success("Ambient Quick-Log Dock pinned to Notification Shade! ⚡");
      await NativeQuickLogBridge.syncBudgetTelemetry(safeDailyPace);
    } else {
      toast.info("Ambient Quick-Log Dock unpinned from Notification Shade.");
    }
  };

  const handleTestTrigger = async () => {
    soundFX.playCashRegister();
    setIsSyncing(true);
    try {
      const launched = await NativeQuickLogBridge.launchQuickLogDialog();
      if (!launched) {
        toast.info("Opening Web Micro-Logger...");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] dark:bg-[#1A1816] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl p-4 sm:p-5 shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-[#161514] text-[#CEF431] flex items-center justify-center shrink-0 shadow-2xs">
            <Zap className="size-4.5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight">
              Ambient Zero-App Quick-Log
            </h3>
            <p className="text-xs text-[#161514]/60 dark:text-[#FAF8F5]/60 font-medium">
              Notification shade dock &amp; floating micro-dialog
            </p>
          </div>
        </div>

        {/* Live Badge */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-black border uppercase tracking-wider tabular-nums",
            isEnabled
              ? "bg-[#CEF431] text-[#161514] border-[#161514]"
              : "bg-stone-200 dark:bg-stone-800 text-[#161514]/60 dark:text-[#FAF8F5]/60 border-[#161514]/20"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              isEnabled ? "bg-[#161514] animate-pulse" : "bg-stone-400"
            )}
          />
          {isEnabled ? "Shade Dock Active" : "Disabled"}
        </span>
      </div>

      {/* Telemetry pill */}
      <div className="bg-white dark:bg-[#121110] border border-[#161514]/20 dark:border-white/10 rounded-xl p-3 flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <span className="text-[10px] font-black uppercase text-[#161514]/60 dark:text-[#FAF8F5]/60 block tracking-wider">
            Live Telemetry Pushed to Shade
          </span>
          <span className="text-xs font-mono font-bold text-[#161514] dark:text-[#FAF8F5]">
            Remaining Safe Spend: {currencySymbol}{Math.round(safeDailyPace).toLocaleString()}/day
          </span>
        </div>

        <button
          onClick={handleToggle}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs",
            isEnabled
              ? "bg-[#161514] text-white border-[#161514] dark:bg-white dark:text-[#161514]"
              : "bg-white dark:bg-[#161514] text-[#161514] dark:text-white border-[#161514]/40"
          )}
        >
          {isEnabled ? "Enabled" : "Enable"}
        </button>
      </div>

      {/* Feature Bullet Points & Test Trigger */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="text-[11px] text-[#161514]/75 dark:text-[#FAF8F5]/75 space-y-1">
          <p className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
            <span>Pull down notification shade or Quick Settings tile anytime.</span>
          </p>
          <p className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
            <span>Floating micro-dialog opens over whatever app you are using.</span>
          </p>
          <p className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
            <span>Log expenses with mechanical numpad in under 1.5 seconds.</span>
          </p>
        </div>

        <button
          onClick={handleTestTrigger}
          disabled={isSyncing}
          className="px-3.5 py-2 rounded-xl text-xs font-black bg-[#CEF431] hover:bg-[#bce028] text-[#161514] border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Smartphone className="size-3.5 stroke-[2.2]" />
          <span>Test Micro-Dialog</span>
          <ArrowUpRight className="size-3" />
        </button>
      </div>
    </div>
  );
}
