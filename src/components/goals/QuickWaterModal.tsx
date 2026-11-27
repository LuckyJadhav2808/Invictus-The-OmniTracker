"use client";

import { useState, useEffect } from "react";
import { AdaptiveDrawerDialog } from "@/components/shared/AdaptiveDrawerDialog";
import { WATER_VESSELS, type VesselPreset } from "@/components/goals/WaterTracker";
import LiquidSlider from "@/components/kokonutui/liquid-slider";
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
  const [isCustomCapacityOpen, setIsCustomCapacityOpen] = useState(false);
  const [customLitersInput, setCustomLitersInput] = useState(
    ((targetAmount || 1000) / 1000).toFixed(1)
  );

  useEffect(() => {
    if (targetAmount) {
      setLocalTarget(targetAmount);
      setCustomLitersInput((targetAmount / 1000).toFixed(1));
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

        {/* Interactive 3D Physics Liquid Glass Slider + ||| Custom Liters Button */}
        <div className="space-y-2">
          <div className="flex items-start justify-center gap-2">
            <LiquidSlider
              value={Math.min(localTarget, Math.max(0, currentAmount))}
              min={0}
              max={localTarget || 1000}
              step={50}
              unit="ml"
              label="Drag Glass to Log"
              onValueChange={(next) => {
                const delta = next - currentAmount;
                if (delta !== 0) {
                  onLogWater(delta);
                }
              }}
            />

            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                setIsCustomCapacityOpen((prev) => !prev);
              }}
              className={cn(
                "h-11 px-2.5 rounded-xl border-2 border-[#161514] dark:border-[#38332E] font-mono font-black text-xs flex items-center justify-center gap-1 transition-all shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer shrink-0",
                isCustomCapacityOpen
                  ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514]"
                  : "bg-white dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] hover:bg-sky-50 dark:hover:bg-[#252321]"
              )}
              title="Set bottle capacity (custom Liters)"
            >
              <span className="tracking-tighter font-mono font-black text-sm">|||</span>
              <span className="text-[10px] font-heading font-black">L</span>
            </button>
          </div>

          {isCustomCapacityOpen && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const parsedLiters = parseFloat(customLitersInput);
                if (!isNaN(parsedLiters) && parsedLiters >= 0.5) {
                  soundFX.playPop();
                  handleUpdateTarget(Math.round(parsedLiters * 1000));
                  setIsCustomCapacityOpen(false);
                }
              }}
              className="p-3 bg-secondary/60 dark:bg-secondary/30 rounded-2xl border-2 border-[#161514] dark:border-[#38332E] shadow-[2px_2px_0px_0px_#161514] space-y-2 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-heading font-black uppercase tracking-wider text-foreground">
                  Bottle Capacity (Target L)
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Current: {(localTarget / 1000).toFixed(1)}L
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10.0"
                    value={customLitersInput}
                    onChange={(e) => setCustomLitersInput(e.target.value)}
                    placeholder="e.g. 2.5"
                    className="w-full h-9 px-3 pr-8 bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] rounded-xl text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#CEF431]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground font-bold">
                    L
                  </span>
                </div>
                <button
                  type="submit"
                  className="h-9 px-3.5 bg-[#161514] dark:bg-[#CEF431] text-white dark:text-[#161514] border border-[#161514] rounded-xl text-xs font-heading font-black shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
                >
                  Set L
                </button>
              </div>
            </form>
          )}
        </div>

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
