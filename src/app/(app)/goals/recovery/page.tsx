"use client";

import { useState, useEffect } from "react";
import { Moon, Droplet, Plus, Sparkles, Activity } from "lucide-react";
import { SubpageHeader } from "@/components/shared/SubpageHeader";
import { MobileAppBar } from "@/components/mobile/MobileAppBar";
import { SleepAndActiveWidgets } from "@/components/goals/SleepAndActiveWidgets";
import { WaterTracker } from "@/components/goals/WaterTracker";
import { soundFX } from "@/components/shared/SoundFX";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function RecoveryPage() {
  const [activeTab, setActiveTab] = useState<"sleep" | "hydration">("sleep");
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const [waterAmount, setWaterAmount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        return Number(localStorage.getItem(`invictus_water_${todayStr}`) || 1250);
      } catch {}
    }
    return 1250;
  });

  const handleLogWater = (delta: number) => {
    soundFX.playPop();
    soundFX.vibrate(20);
    const updated = Math.max(0, waterAmount + delta);
    setWaterAmount(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`invictus_water_${todayStr}`, String(updated));
      } catch {}
    }
  };

  const handleSetWater = async (absolute: number) => {
    setWaterAmount(absolute);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`invictus_water_${todayStr}`, String(absolute));
      } catch {}
    }
  };

  return (
    <div className="w-full max-w-xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-3.5 select-none animate-in fade-in duration-200 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      {/* Dynamic Strobi Top App Bar */}
      <div className="-mx-2 -mt-2 sm:-mx-4 sm:-mt-4 lg:hidden">
        <MobileAppBar title="Recovery" showDynamicIsland={true} />
      </div>

      {/* 1. Title Bar with inline back button */}
      <SubpageHeader
        backHref="/goals"
        backLabel="Habits"
        title="Recovery & Biomarkers"
        badge="Circadian Engine"
        badgeColorClass="bg-sky-400/20 text-sky-700 dark:text-sky-300 border-sky-500/30"
        subtitle="Sleep quality, circadian productivity rhythms & hydration pacing"
        icon={Moon}
        rightAction={
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              soundFX.vibrate(15);
              window.dispatchEvent(new CustomEvent("invictus:open-water-modal"));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#161514] bg-[#38BDF8] text-[#161514] font-heading font-black text-xs shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <Plus className="size-3.5 stroke-[3]" />
            <span>+ Water</span>
          </button>
        }
      />

      {/* 2. Strict 2-Tab Navigation */}
      <div className="grid grid-cols-2 p-1 bg-muted/60 dark:bg-card border-2 border-[#161514] dark:border-white/20 rounded-xl shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] gap-1">
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            soundFX.vibrate(10);
            setActiveTab("sleep");
          }}
          className={cn(
            "py-2 text-xs font-heading font-black rounded-lg transition-all text-center cursor-pointer",
            activeTab === "sleep"
              ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          🌙 Sleep &amp; Circadian
        </button>
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            soundFX.vibrate(10);
            setActiveTab("hydration");
          }}
          className={cn(
            "py-2 text-xs font-heading font-black rounded-lg transition-all text-center cursor-pointer",
            activeTab === "hydration"
              ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          💧 Hydration Pacing
        </button>
      </div>

      {/* TAB 1: Sleep & Circadian */}
      {activeTab === "sleep" && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          <SleepAndActiveWidgets />
        </div>
      )}

      {/* TAB 2: Hydration Pacing */}
      {activeTab === "hydration" && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          <WaterTracker
            amount={waterAmount}
            onLogWater={handleLogWater}
            onSetWater={handleSetWater}
            targetAmount={2500}
          />
        </div>
      )}
    </div>
  );
}
