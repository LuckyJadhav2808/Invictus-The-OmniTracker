"use client";

import { AdaptiveDrawerDialog } from "@/components/shared/AdaptiveDrawerDialog";
import { WATER_VESSELS, type VesselPreset } from "@/components/goals/WaterTracker";
import { soundFX } from "@/components/shared/SoundFX";
import { strobiToast } from "@/lib/utils/toasts";
import { NumberTicker } from "@/components/ui/number-ticker";
import { cn } from "@/lib/utils";

interface QuickWaterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAmount: number;
  targetAmount: number;
  onLogWater: (delta: number) => void;
}

export function QuickWaterModal({
  open,
  onOpenChange,
  currentAmount,
  targetAmount,
  onLogWater,
}: QuickWaterModalProps) {
  const percentage = Math.min(100, Math.round((currentAmount / Math.max(1, targetAmount)) * 100));
  const remaining = Math.max(0, targetAmount - currentAmount);
  const isGoalMet = currentAmount >= targetAmount && targetAmount > 0;

  const handleVesselTap = (vessel: VesselPreset) => {
    soundFX.playSplash();
    soundFX.vibrate(15);
    onLogWater(vessel.amount);

    const nextAmount = currentAmount + vessel.amount;
    if (nextAmount >= targetAmount && currentAmount < targetAmount) {
      soundFX.playCompleteChime();
      soundFX.vibrate([60, 60, 100]);
      strobiToast.habits("Hydration goal crushed! 💧");
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
      description="Tap a vessel to log instantly"
    >
      <div className="space-y-4 py-1">
        {/* Progress HUD */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-heading font-black tabular-nums text-foreground">
              <NumberTicker value={currentAmount} duration={200} />
            </span>
            <span className="text-xs font-mono text-muted-foreground font-bold">
              / {targetAmount}ml
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

        {/* Progress Bar */}
        <div className="h-3 w-full bg-secondary/80 rounded-full border-2 border-[#161514] dark:border-[#38332E] overflow-hidden p-[1.5px]">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300 ease-out",
              isGoalMet
                ? "bg-[#03D26F]"
                : "bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-400"
            )}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>

        {/* Remaining Telemetry */}
        <p className="text-center text-xs font-mono text-muted-foreground">
          {isGoalMet
            ? "🎯 Goal reached! Extra hydration is bonus."
            : `${remaining.toLocaleString()}ml remaining to daily target`}
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
