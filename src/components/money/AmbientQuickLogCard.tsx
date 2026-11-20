"use client";

import { useState, useEffect } from "react";
import { Zap, Smartphone, ArrowUpRight, Bell, Sparkles } from "lucide-react";
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
      toast.success("Notification Logger Active! ⚡", {
        description: "Pinned live safe spend dock to Android Notification Shade.",
      });
      await NativeQuickLogBridge.syncBudgetTelemetry(safeDailyPace);
    } else {
      toast.info("Notification Logger Unpinned", {
        description: "Removed ambient dock from Android Notification Shade.",
      });
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
    <div className="bg-[#FAF8F5] dark:bg-[#1A1816] border-2 border-[#161514] dark:border-[#38332E] rounded-3xl p-5 sm:p-6 shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] space-y-5">
      {/* 1. Header Section */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] border-2 border-[#161514] flex items-center justify-center shrink-0 shadow-2xs">
            <Zap className="size-5 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight font-heading">
                Notification Logger &amp; Android Tile
              </h3>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase bg-[#DCFAE5] text-[#04250e] border border-[#03D26F]/40">
                Native
              </span>
            </div>
            <p className="text-xs text-[#161514]/70 dark:text-[#FAF8F5]/60 font-sans font-medium">
              Zero-app overhead: log expenses from notification shade or Quick Settings tile.
            </p>
          </div>
        </div>

        {/* Live Badge */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono font-black border uppercase tracking-wider tabular-nums shrink-0 shadow-2xs",
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
          {isEnabled ? "Shade Dock ON" : "Muted"}
        </span>
      </div>

      {/* 2. Notification Logger Dock Toggle Box */}
      <div className="bg-white dark:bg-[#121110] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-amber-500 stroke-[2.2]" />
            <span className="text-xs font-black uppercase text-[#161514] dark:text-[#FAF8F5] font-heading tracking-wide">
              Persistent Notification Logger
            </span>
          </div>
          <p className="text-[11px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-sans">
            Pins a silent 1-tap card in your pull-down shade showing:
          </p>
          <div className="inline-flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-[#1C1A18] px-2.5 py-1 rounded-lg border border-[#161514]/20 dark:border-white/10 font-mono text-xs font-bold text-[#161514] dark:text-[#FAF8F5]">
            <span>⚡ Safe Spend Remaining:</span>
            <span className="text-emerald-600 dark:text-[#03D26F]">
              {currencySymbol}{Math.round(safeDailyPace).toLocaleString()}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all cursor-pointer flex items-center gap-2 shadow-2xs active:scale-95 shrink-0",
            isEnabled
              ? "bg-[#161514] text-[#CEF431] border-[#161514] dark:bg-[#CEF431] dark:text-[#161514] dark:border-[#CEF431]"
              : "bg-white dark:bg-[#161514] text-[#161514] dark:text-white border-[#161514] dark:border-[#38332E]"
          )}
        >
          {isEnabled ? "Dock Enabled" : "Enable Dock"}
        </button>
      </div>

      {/* 3. Android Quick Settings Tile ("Beside WiFi & Bluetooth") */}
      <div className="bg-white dark:bg-[#121110] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl p-4 space-y-3 shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Smartphone className="size-4 text-sky-500 stroke-[2.2]" />
            <span className="text-xs font-black uppercase text-[#161514] dark:text-[#FAF8F5] font-heading tracking-wide">
              Native Android Quick Settings Button
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-[#F1EFEA] dark:bg-[#252220] border border-[#161514]/20 text-[#161514] dark:text-[#FAF8F5]">
            Beside Wi-Fi &amp; Bluetooth
          </span>
        </div>

        <div className="bg-[#FAF8F5] dark:bg-[#1A1816] rounded-xl p-3 border border-[#161514]/15 dark:border-white/10 space-y-2 text-xs text-[#161514]/80 dark:text-[#FAF8F5]/80">
          <p className="font-bold flex items-center gap-1.5 text-foreground">
            <Sparkles className="size-3.5 text-amber-500 shrink-0" />
            <span>How to add to your Android Quick Settings bar:</span>
          </p>
          <ol className="list-decimal list-inside space-y-1 text-[11px] font-sans leading-relaxed pl-1 text-[#161514]/70 dark:text-[#FAF8F5]/70">
            <li>Swipe down <strong>twice</strong> from the top of your Android screen (next to Wi-Fi, Bluetooth &amp; Torch).</li>
            <li>Tap the <strong>Edit / Pencil icon (✏️)</strong> in the pull-down control center.</li>
            <li>Scroll down and drag the <strong>&quot;+ Log Expense&quot;</strong> tile into your active top row!</li>
          </ol>
        </div>

        {/* Action Row: Test Trigger & Permission Check */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <p className="text-[11px] text-muted-foreground font-sans">
            Tapping the tile pops the translucent micro-dialog over any open app.
          </p>

          <button
            type="button"
            onClick={handleTestTrigger}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-[#CEF431] hover:bg-[#bce028] text-[#161514] border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            title="Launch translucent micro-dialog"
          >
            <Zap className="size-3.5 fill-[#161514] text-[#161514]" />
            <span>Test Micro-Dialog ⚡</span>
            <ArrowUpRight className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
