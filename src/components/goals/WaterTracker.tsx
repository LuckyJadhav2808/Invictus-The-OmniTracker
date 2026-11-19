"use client";

import React, { useState, useEffect } from "react";
import { Droplet, Settings2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { AdaptiveDrawerDialog } from "@/components/shared/AdaptiveDrawerDialog";
import { toast } from "sonner";

export interface WaterTrackerProps {
  amount: number; // in ml
  onLogWater: (amountDelta: number) => void;
  onSetWater: (absoluteAmount: number, target?: number) => Promise<void>;
  targetAmount?: number; // daily target in ml (default 2000ml)
  className?: string;
}

interface SplashTag {
  id: number;
  text: string;
}

export function WaterTracker({
  amount,
  onLogWater,
  onSetWater,
  targetAmount = 2000,
  className,
}: WaterTrackerProps) {
  const [localAmount, setLocalAmount] = useState(amount);
  const [dailyTarget, setDailyTarget] = useState(targetAmount);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [customInput, setCustomInput] = useState(String(amount));
  const [targetInput, setTargetInput] = useState(String(targetAmount));
  const [splashTags, setSplashTags] = useState<SplashTag[]>([]);

  // Sync inputs when props change
  useEffect(() => {
    setLocalAmount(amount);
    setCustomInput(String(amount));
  }, [amount]);

  useEffect(() => {
    if (targetAmount) {
      setDailyTarget(targetAmount);
      setTargetInput(String(targetAmount));
    }
  }, [targetAmount]);

  const percentage = Math.min(100, Math.round((localAmount / dailyTarget) * 100));
  const isGoalMet = localAmount >= dailyTarget;

  const handleQuickAdd = (delta: number = 250) => {
    soundFX.playSplash();
    soundFX.vibrate(15);

    // Instant optimistic local update
    const next = Math.max(0, localAmount + delta);
    setLocalAmount(next);
    setCustomInput(String(next));
    onLogWater(delta);

    // Spawn floating splash badge
    const newTag: SplashTag = {
      id: Date.now() + Math.random(),
      text: delta > 0 ? `+${delta}ml` : `${delta}ml`,
    };
    setSplashTags((prev) => [...prev, newTag]);

    setTimeout(() => {
      setSplashTags((prev) => prev.filter((t) => t.id !== newTag.id));
    }, 1200);

    if (localAmount + delta >= dailyTarget && localAmount < dailyTarget) {
      soundFX.playCompleteChime();
      toast.success("Daily hydration target achieved! Outstanding discipline. 💧");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAmount = parseInt(customInput, 10);
    const newTarget = parseInt(targetInput, 10);

    const validTarget = !isNaN(newTarget) && newTarget >= 500 ? newTarget : dailyTarget;
    setDailyTarget(validTarget);

    if (!isNaN(newAmount) && newAmount >= 0) {
      setLocalAmount(newAmount);
      try {
        await onSetWater(newAmount, validTarget);
        toast.success("Hydration settings updated!");
        setIsEditOpen(false);
      } catch {
        toast.error("Failed to update water intake");
      }
    }
  };

  return (
    <div
      className={cn(
        "bg-[#161514] dark:bg-[#1C1A18] text-white rounded-3xl border-2 border-[#161514] dark:border-[#38332E] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] relative overflow-hidden flex items-stretch justify-between select-none min-h-[145px] sm:min-h-[155px]",
        className
      )}
    >
      {/* Floating Splash Bubbles */}
      <div className="absolute top-2 left-1/3 pointer-events-none z-30">
        {splashTags.map((tag) => (
          <div
            key={tag.id}
            className="animate-bounce font-heading font-black text-xs text-[#0091FF] bg-white border border-[#0091FF] px-2 py-0.5 rounded-full shadow-md"
          >
            {tag.text}
          </div>
        ))}
      </div>

      {/* Left Content Area: Telemetry & Actions */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between space-y-3">
        {/* Header Row: Water Droplet & Settings Trigger */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Droplet className="size-4 text-[#0091FF] fill-[#0091FF]" />
            <h3 className="text-sm sm:text-base font-heading font-black text-white tracking-tight">
              Water
            </h3>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setIsEditOpen(true);
            }}
            className="size-7 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer"
            title="Adjust hydration settings"
            aria-label="Water settings"
          >
            <Settings2 className="size-3.5" />
          </button>
        </div>

        {/* Telemetry Stack: 500 ml of 2,000 ml today */}
        <div
          onClick={() => {
            soundFX.playPop();
            setIsEditOpen(true);
          }}
          className="cursor-pointer group"
        >
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-heading font-black text-white tabular-nums tracking-tight">
              {localAmount.toLocaleString()}
            </span>
            <span className="text-sm font-mono text-white/60 font-bold">
              ml
            </span>
          </div>
          <p className="text-xs text-white/50 font-mono font-medium mt-0.5">
            of {dailyTarget.toLocaleString()} ml today
            {isGoalMet && (
              <span className="ml-1.5 text-[#03D26F] font-bold">✓ Goal Met</span>
            )}
          </p>
        </div>

        {/* Vibrant Blue Pill Action Button */}
        <div>
          <button
            type="button"
            onClick={() => handleQuickAdd(250)}
            className="bg-[#0091FF] hover:bg-[#0080e6] active:scale-95 text-white font-heading font-black text-xs sm:text-sm py-2 px-5 rounded-full shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>+250 ml</span>
          </button>
        </div>
      </div>

      {/* Right Edge: Vertical Fluid Reservoir Gauge */}
      <div className="w-10 sm:w-12 bg-white/5 dark:bg-black/40 border-l border-white/10 relative flex flex-col justify-end overflow-hidden">
        {/* Fluid Fill Column */}
        <div
          className="w-full bg-[#0091FF] transition-all duration-500 ease-out relative"
          style={{ height: `${Math.min(100, Math.max(0, percentage))}%` }}
        >
          {/* Fluid Top Highlight */}
          <div className="absolute top-0 inset-x-0 h-1 bg-white/30" />
        </div>
      </div>

      {/* Manual Volume & Target Settings Modal (AdaptiveDrawerDialog) */}
      <AdaptiveDrawerDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Hydration Settings"
        description="Adjust your logged water amount or change your daily target goal."
      >
        <form onSubmit={handleSaveSettings} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wider mb-1.5">
              Water Logged Today (ml)
            </label>
            <input
              type="number"
              min="0"
              step="50"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-full text-base font-bold bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] rounded-xl px-3.5 py-2.5 text-[#161514] dark:text-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] focus:outline-none focus:ring-2 focus:ring-[#0091FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wider mb-1.5">
              Daily Target Goal (ml)
            </label>
            <input
              type="number"
              min="500"
              step="250"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              className="w-full text-base font-bold bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] rounded-xl px-3.5 py-2.5 text-[#161514] dark:text-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] focus:outline-none focus:ring-2 focus:ring-[#0091FF]"
            />
          </div>

          {/* Quick Presets for Target */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#161514]/70 dark:text-[#FAF8F5]/70">Recommended Targets:</span>
            <div className="flex gap-2">
              {[1500, 2000, 2500, 3000].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setTargetInput(String(t));
                  }}
                  className={cn(
                    "text-xs font-bold px-2.5 py-1 rounded-lg border-2 border-[#161514] dark:border-[#38332E] cursor-pointer transition-all",
                    targetInput === String(t)
                      ? "bg-[#0091FF] text-white font-black shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000]"
                      : "bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] hover:bg-slate-100 dark:hover:bg-[#2e2b28] shadow-[1px_1px_0px_0px_#161514] dark:shadow-[1px_1px_0px_0px_#000000]"
                  )}
                >
                  {(t / 1000).toFixed(1)}L
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="flex-1 min-h-[44px] bg-white dark:bg-[#252321] hover:bg-slate-100 dark:hover:bg-[#2e2b28] border-2 border-[#161514] dark:border-[#38332E] rounded-xl text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] bg-[#0091FF] hover:bg-[#0080e6] border-2 border-[#161514] dark:border-[#38332E] rounded-xl text-xs font-heading font-black text-white shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
            >
              Save Hydration
            </button>
          </div>
        </form>
      </AdaptiveDrawerDialog>
    </div>
  );
}
