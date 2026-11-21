"use client";

import { useState } from "react";
import { Moon, Plus } from "lucide-react";
import { SubpageLayout } from "@/components/shared/SubpageLayout";
import { SubpageTwoTabs } from "@/components/shared/SubpageTwoTabs";
import { SleepAndActiveWidgets } from "@/components/goals/SleepAndActiveWidgets";
import { WaterTracker } from "@/components/goals/WaterTracker";
import { soundFX } from "@/components/shared/SoundFX";
import { format } from "date-fns";

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
    <SubpageLayout
      appBarTitle="Recovery"
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
    >
      {/* 2-Tab Navigation */}
      <SubpageTwoTabs<"sleep" | "hydration">
        tabs={[
          { id: "sleep", label: "Sleep & Circadian", icon: "🌙" },
          { id: "hydration", label: "Hydration Pacing", icon: "💧" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

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
    </SubpageLayout>
  );
}
