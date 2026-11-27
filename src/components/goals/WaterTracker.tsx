"use client";

import { useState, useEffect } from "react";
import {
  Droplets,
  Coffee,
  GlassWater,
  CupSoda,
  RotateCcw,
  Plus,
  Minus,
  Target,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { toast } from "sonner";
import { NumberTicker } from "@/components/ui/number-ticker";
import LiquidSlider from "@/components/kokonutui/liquid-slider";

export interface WaterTrackerProps {
  amount: number; // in ml
  onLogWater: (amountDelta: number) => void;
  onSetWater: (absoluteAmount: number, target?: number) => Promise<void>;
  targetAmount?: number; // daily target in ml (default 2000ml)
  className?: string;
}

export interface VesselPreset {
  id: string;
  name: string;
  subtitle: string;
  amount: number;
  icon: React.ElementType;
}

export const WATER_VESSELS: VesselPreset[] = [
  {
    id: "cup",
    name: "Cup",
    subtitle: "Coffee / Tea",
    amount: 150,
    icon: Coffee,
  },
  {
    id: "glass",
    name: "Glass",
    subtitle: "Standard Glass",
    amount: 250,
    icon: GlassWater,
  },
  {
    id: "mug",
    name: "Mug / Shaker",
    subtitle: "Large Tumbler",
    amount: 500,
    icon: CupSoda,
  },
  {
    id: "bottle",
    name: "Flask / Bottle",
    subtitle: "Hydro Bottle",
    amount: 750,
    icon: Droplets,
  },
];

export const TARGET_PRESETS = [1500, 2000, 2500, 3000];

export function WaterTracker({
  amount,
  onLogWater,
  onSetWater,
  targetAmount = 2000,
  className,
}: WaterTrackerProps) {
  const [localAmount, setLocalAmount] = useState(amount);
  const [dailyTarget, setDailyTarget] = useState(targetAmount);
  const [isCustomTargetOpen, setIsCustomTargetOpen] = useState(false);
  const [customTargetInput, setCustomTargetInput] = useState(String(targetAmount));
  const [isManualOverrideOpen, setIsManualOverrideOpen] = useState(false);
  const [manualAmountInput, setManualAmountInput] = useState(String(amount));

  // Sync inputs when props change
  useEffect(() => {
    setLocalAmount(amount);
    setManualAmountInput(String(amount));
  }, [amount]);

  useEffect(() => {
    if (targetAmount) {
      setDailyTarget(targetAmount);
      setCustomTargetInput(String(targetAmount));
    }
  }, [targetAmount]);

  const percentage = Math.round((localAmount / (dailyTarget || 2000)) * 100);
  const isGoalMet = localAmount >= dailyTarget && dailyTarget > 0;
  const remaining = Math.max(0, dailyTarget - localAmount);

  // Single-tap vessel logger
  const handleQuickAdd = (delta: number) => {
    soundFX.playSplash();
    soundFX.vibrate(15);

    const next = Math.max(0, localAmount + delta);
    setLocalAmount(next);
    setManualAmountInput(String(next));
    onLogWater(delta);

    // Goal met celebratory trigger
    if (next >= dailyTarget && localAmount < dailyTarget) {
      soundFX.playCompleteChime();
      soundFX.vibrate([60, 60, 100]);
      toast.success(`Daily hydration goal completed (${dailyTarget.toLocaleString()} ml)! Outstanding discipline. 💧`);
    } else if (delta > 0) {
      toast.info(`+${delta} ml logged`, {
        description: `${Math.max(0, dailyTarget - next)} ml remaining to reach goal`,
      });
    }
  };

  // Fine adjust / Undo
  const handleAdjust = (delta: number) => {
    soundFX.playPop();
    soundFX.vibrate(10);
    const next = Math.max(0, localAmount + delta);
    setLocalAmount(next);
    setManualAmountInput(String(next));
    onLogWater(delta);
  };

  // Reset water for today
  const handleReset = async () => {
    soundFX.playPop();
    soundFX.vibrate(20);
    setLocalAmount(0);
    setManualAmountInput("0");
    try {
      await onSetWater(0, dailyTarget);
      toast.info(`Hydration reset for today (0 / ${dailyTarget.toLocaleString()} ml).`);
    } catch {
      toast.error("Failed to reset water");
    }
  };

  // Inline target selector
  const handleSelectTarget = async (target: number) => {
    soundFX.playPop();
    soundFX.vibrate(15);
    setDailyTarget(target);
    setCustomTargetInput(String(target));
    setIsCustomTargetOpen(false);
    try {
      await onSetWater(localAmount, target);
      toast.success(`Target goal updated to ${(target / 1000).toFixed(1)}L`);
    } catch {
      toast.error("Failed to update hydration goal");
    }
  };

  // Save custom target input
  const handleSaveCustomTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customTargetInput, 10);
    if (!isNaN(parsed) && parsed >= 500) {
      await handleSelectTarget(parsed);
    } else {
      toast.error("Please enter a valid goal (min 500 ml)");
    }
  };

  // Save manual override amount
  const handleSaveManualAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(manualAmountInput, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      soundFX.playPop();
      setLocalAmount(parsed);
      setIsManualOverrideOpen(false);
      try {
        await onSetWater(parsed, dailyTarget);
        toast.success(`Hydration volume set to ${parsed.toLocaleString()} ml`);
      } catch {
        toast.error("Failed to update water volume");
      }
    }
  };

  return (
    <div className={cn("w-full space-y-4 select-none", className)}>
      {/* ================= 1. HERO RESERVOIR HUD ================= */}
      <div className="bg-white dark:bg-[#1C1A18] rounded-3xl border-2 border-[#161514] dark:border-[#38332E] p-4 sm:p-5 shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] relative overflow-hidden space-y-4">
        {/* Top telemetry bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center shrink-0">
              <Droplets className="size-4 stroke-[2.2]" />
            </span>
            <div>
              <h3 className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wider">
                Daily Hydration
              </h3>
            </div>
          </div>

          {/* Goal status badge */}
          {isGoalMet ? (
            <span className="bg-[#CEF431] text-[#161514] border border-[#161514] font-heading font-black text-[11px] px-2.5 py-1 rounded-full shadow-[1.5px_1.5px_0px_0px_#161514] flex items-center gap-1 shrink-0 animate-in fade-in duration-200">
              <Check className="size-3 stroke-[3]" />
              <span>Goal Reached</span>
            </span>
          ) : (
            <span className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-mono font-bold text-[11px] px-2.5 py-1 rounded-full shrink-0">
              <NumberTicker value={remaining} suffix=" ml left" duration={250} />
            </span>
          )}
        </div>

        {/* Primary Numbers Stack */}
        <div className="flex items-baseline justify-between pt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl sm:text-5xl font-heading font-black tabular-nums tracking-tight text-foreground">
              <NumberTicker value={localAmount} duration={250} />
            </span>
            <span className="text-sm sm:text-base font-mono text-muted-foreground font-bold">
              / <NumberTicker value={dailyTarget} suffix=" ml" duration={250} />
            </span>
          </div>

          <div className="text-right">
            <span
              className={cn(
                "text-2xl sm:text-3xl font-heading font-black tabular-nums tracking-tight",
                isGoalMet ? "text-[#03D26F]" : "text-sky-600 dark:text-sky-400"
              )}
            >
              <NumberTicker value={percentage} suffix="%" duration={250} />
            </span>
          </div>
        </div>

        {/* Interactive 3D Physics Liquid Bottle Slider + ||| Custom Liters Button */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-start justify-center gap-2">
            <LiquidSlider
              value={Math.min(dailyTarget, Math.max(0, localAmount))}
              min={0}
              max={dailyTarget || 2000}
              step={50}
              unit="ml"
              label="Drag Liquid or Tap Vessel"
              onValueChange={(next) => {
                const delta = next - localAmount;
                if (delta !== 0) {
                  setLocalAmount(next);
                  setManualAmountInput(String(next));
                  onLogWater(delta);
                }
              }}
            />

            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                setIsCustomTargetOpen((prev) => !prev);
              }}
              className={cn(
                "h-11 px-2.5 rounded-xl border-2 border-[#161514] dark:border-[#38332E] font-mono font-black text-xs flex items-center justify-center gap-1 transition-all shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer shrink-0",
                isCustomTargetOpen
                  ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514]"
                  : "bg-white dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] hover:bg-sky-50 dark:hover:bg-[#252321]"
              )}
              title="Set bottle capacity (custom ml)"
            >
              <span className="tracking-tighter font-mono font-black text-sm">|||</span>
              <span className="text-[10px] font-heading font-black">L</span>
            </button>
          </div>

          {isCustomTargetOpen && (
            <form
              onSubmit={handleSaveCustomTarget}
              className="p-3 rounded-2xl bg-secondary/60 dark:bg-secondary/30 border-2 border-[#161514] dark:border-[#38332E] shadow-[2px_2px_0px_0px_#161514] space-y-2 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-heading font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Target className="size-3.5 text-sky-500" />
                  <span>Daily Target Goal (ml)</span>
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {(dailyTarget / 1000).toFixed(1)}L
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="500"
                    step="100"
                    max="10000"
                    value={customTargetInput}
                    onChange={(e) => setCustomTargetInput(e.target.value)}
                    placeholder="Target in ml"
                    className="w-full h-9 px-3 pr-9 bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] rounded-xl text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#CEF431]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground font-bold">
                    ml
                  </span>
                </div>
                <button
                  type="submit"
                  className="h-9 px-4 bg-[#161514] dark:bg-[#CEF431] text-white dark:text-[#161514] border border-[#161514] rounded-xl text-xs font-heading font-black shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                >
                  Set Goal
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ================= 2. QUICK VESSEL TACTILE DECK (WATERLLAMA-GRADE) ================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-heading font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span>Tap to Log Vessel</span>
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            Single-tap instant add
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {WATER_VESSELS.map((vessel) => {
            const Icon = vessel.icon;
            return (
              <button
                key={vessel.id}
                type="button"
                onClick={() => handleQuickAdd(vessel.amount)}
                className="group min-h-[58px] p-3 rounded-2xl border-2 border-[#161514] dark:border-[#38332E] bg-white dark:bg-[#1C1A18] hover:bg-sky-50/60 dark:hover:bg-sky-950/30 text-foreground flex items-center justify-between shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_#000000] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <span className="size-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="size-4 stroke-[2.2]" />
                  </span>
                  <div className="text-left min-w-0 flex-1">
                    <span className="block font-heading font-black text-xs text-foreground leading-snug break-words line-clamp-1">
                      {vessel.name}
                    </span>
                    <span className="block text-[10px] font-mono text-muted-foreground leading-snug break-words line-clamp-1">
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

      {/* ================= 3. MICRO-ADJUSTER & UNDO STRIP (ANTI-REGRET) ================= */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {/* Undo -250ml */}
        <button
          type="button"
          disabled={localAmount === 0}
          onClick={() => handleAdjust(-250)}
          className={cn(
            "min-h-[44px] py-2 px-2 rounded-xl border-2 border-[#161514] dark:border-[#38332E] font-heading font-black text-xs flex items-center justify-center gap-1 transition-all",
            localAmount === 0
              ? "opacity-40 cursor-not-allowed bg-secondary text-muted-foreground"
              : "bg-white dark:bg-[#1C1A18] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[#161514] dark:text-[#FAF8F5] hover:text-rose-600 shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
          )}
          title="Undo 250ml"
        >
          <RotateCcw className="size-3.5 stroke-[2.2]" />
          <span>-250</span>
        </button>

        {/* -50ml Micro Decrement */}
        <button
          type="button"
          disabled={localAmount === 0}
          onClick={() => handleAdjust(-50)}
          className={cn(
            "min-h-[44px] py-2 px-2 rounded-xl border-2 border-[#161514] dark:border-[#38332E] font-mono font-bold text-xs flex items-center justify-center gap-0.5 transition-all",
            localAmount === 0
              ? "opacity-40 cursor-not-allowed bg-secondary text-muted-foreground"
              : "bg-white dark:bg-[#1C1A18] hover:bg-secondary text-[#161514] dark:text-[#FAF8F5] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
          )}
          title="Decrease 50ml"
        >
          <Minus className="size-3 stroke-[2.5]" />
          <span>50ml</span>
        </button>

        {/* +50ml Micro Increment */}
        <button
          type="button"
          onClick={() => handleAdjust(50)}
          className="min-h-[44px] py-2 px-2 rounded-xl border-2 border-[#161514] dark:border-[#38332E] bg-white dark:bg-[#1C1A18] hover:bg-secondary text-[#161514] dark:text-[#FAF8F5] font-mono font-bold text-xs flex items-center justify-center gap-0.5 shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer transition-all"
          title="Add 50ml"
        >
          <Plus className="size-3 stroke-[2.5]" />
          <span>50ml</span>
        </button>

        {/* Reset / Clear Today */}
        <button
          type="button"
          disabled={localAmount === 0}
          onClick={handleReset}
          className={cn(
            "min-h-[44px] py-2 px-2 rounded-xl border-2 border-[#161514] dark:border-[#38332E] font-heading font-black text-xs flex items-center justify-center gap-1 transition-all",
            localAmount === 0
              ? "opacity-40 cursor-not-allowed bg-secondary text-muted-foreground"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-900 shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
          )}
          title="Reset to 0"
        >
          <span>Reset</span>
        </button>
      </div>

      {/* ================= 4. MANUAL VOLUME DIRECT OVERRIDE (COLLAPSIBLE) ================= */}
      <div className="pt-0.5">
        {!isManualOverrideOpen ? (
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setIsManualOverrideOpen(true);
            }}
            className="w-full text-center text-[10px] font-mono font-bold text-muted-foreground hover:text-foreground py-1 cursor-pointer transition-colors"
          >
            Manual exact volume entry ▾
          </button>
        ) : (
          <form
            onSubmit={handleSaveManualAmount}
            className="p-3 rounded-2xl bg-secondary/40 border border-border space-y-2 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-heading font-black text-foreground">
                Set Exact Water Volume
              </span>
              <button
                type="button"
                onClick={() => setIsManualOverrideOpen(false)}
                className="text-[10px] font-mono text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  step="50"
                  max="15000"
                  value={manualAmountInput}
                  onChange={(e) => setManualAmountInput(e.target.value)}
                  className="w-full h-10 px-3 bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] rounded-xl text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#CEF431]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground font-bold">
                  ml
                </span>
              </div>

              <button
                type="submit"
                className="h-10 px-4 bg-[#161514] dark:bg-[#CEF431] text-white dark:text-[#161514] border border-[#161514] rounded-xl text-xs font-heading font-black shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
