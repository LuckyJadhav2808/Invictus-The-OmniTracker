"use client";

import { useState, useEffect } from "react";
import { AdaptiveDrawerDialog } from "@/components/shared/AdaptiveDrawerDialog";
import { WATER_VESSELS, type VesselPreset } from "@/components/goals/WaterTracker";
import { HorizontalWaterBottle } from "@/components/goals/HorizontalWaterBottle";
import { soundFX } from "@/components/shared/SoundFX";
import { strobiToast } from "@/lib/utils/toasts";
import { NumberTicker } from "@/components/ui/number-ticker";
import { cn } from "@/lib/utils";

interface QuickWaterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAmount: number;
  targetAmount?: number;
  onLogWater: (delta: number) => void;
  onSetTarget?: (targetMl: number) => void;
}

export function QuickWaterModal({
  open,
  onOpenChange,
  currentAmount,
  targetAmount = 1000,
  onLogWater,
  onSetTarget,
}: QuickWaterModalProps) {
  const [localTarget, setLocalTarget] = useState(targetAmount || 1000);

  useEffect(() => {
    if (targetAmount) {
      setLocalTarget(targetAmount);
    }
  }, [targetAmount]);

  const percentage = Math.min(
    100,
    Math.round((currentAmount / Math.max(1, localTarget)) * 100)
  );
  const remaining = Math.max(0, localTarget - currentAmount);
  const isGoalMet = currentAmount >= localTarget && localTarget > 0;

  const handleUpdateTarget = (newTarget: number) => {
    setLocalTarget(newTarget);
    onSetTarget?.(newTarget);
    strobiToast.habits(`Bottle goal updated to ${(newTarget / 1000).toFixed(1)}L 💧`);
  };

  const handleVesselTap = (vessel: VesselPreset) => {
    soundFX.playSplash();
    soundFX.vibrate(15);
    onLogWater(vessel.amount);

    const nextAmount = currentAmount + vessel.amount;
    if (nextAmount >= localTarget && currentAmount < localTarget) {
      soundFX.playCompleteChime();
      soundFX.vibrate([60, 60, 100]);
      strobiToast.habits("Hydration bottle crushed! 💧");
    } else {
      strobiToast.habits(`+${vessel.amount}ml logged`);
    }

    onOpenChange(false);
  };

  return (
    <AdaptiveDrawerDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Quick Water Log"
      description="Tap a vessel to fill your 1L bottle (or tap ||| for custom L)"
    >
      <div className="space-y-4 py-1">
        {/* Progress HUD Telemetry */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-heading font-black tabular-nums text-foreground">
              <NumberTicker value={currentAmount} duration={200} />
            </span>
            <span className="text-xs font-mono text-muted-foreground font-bold">
              / {localTarget}ml ({(localTarget / 1000).toFixed(1)}L)
            </span>
          </div>
          <span
            className={cn(
              "text-lg font-heading font-black tabular-nums",
              isGoalMet ? "text-[#03D26F]" : "text-sky-600 dark:text-sky-400"
            )}
          >
            {percentage}%
          </span>
        </div>

        {/* 1L Horizontal Water Bottle Progress Bar with ||| Custom L button */}
        <HorizontalWaterBottle
          currentAmount={currentAmount}
          targetAmount={localTarget}
          onSetTarget={handleUpdateTarget}
          showCustomButton={true}
        />

        {/* Remaining Telemetry */}
        <p className="text-center text-xs font-mono text-muted-foreground">
          {isGoalMet
            ? "🎯 Bottle filled to the brim! Extra hydration is bonus."
            : `${remaining.toLocaleString()}ml remaining to fill bottle (${(localTarget / 1000).toFixed(1)}L)`}
        </p>

        {/* 2×2 Vessel Grid — 1-tap actions */}
        <div className="grid grid-cols-2 gap-2.5">
          {WATER_VESSELS.map((vessel) => {
            const Icon = vessel.icon;
            return (
              <button
                key={vessel.id}
                type="button"
                onClick={() => handleVesselTap(vessel)}
                className="group min-h-[64px] p-3.5 rounded-2xl border-2 border-[#161514] dark:border-[#38332E] bg-white dark:bg-[#1C1A18] hover:bg-sky-50/60 dark:hover:bg-sky-950/30 text-foreground flex items-center justify-between shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_#000000] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <span className="size-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="size-4 stroke-[2.2]" />
                  </span>
                  <div className="text-left min-w-0 flex-1">
                    <span className="block font-heading font-black text-xs text-foreground leading-snug">
                      {vessel.name}
                    </span>
                    <span className="block text-[10px] font-mono text-muted-foreground leading-snug">
                      {vessel.subtitle}
                    </span>
                  </div>
                </div>

                <span className="font-mono font-bold text-xs text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-1 rounded-lg border border-sky-200 dark:border-sky-800 shrink-0">
                  +{vessel.amount}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </AdaptiveDrawerDialog>
  );
}
