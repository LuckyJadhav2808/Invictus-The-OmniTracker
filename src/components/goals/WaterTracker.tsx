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

        {/* Full-width Neobrutalist Reservoir Fluid Bar */}
        <div className="space-y-1.5 pt-0.5">
          <div className="h-4 w-full bg-secondary/80 rounded-full border-2 border-[#161514] dark:border-[#38332E] overflow-hidden p-[2px] relative">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out relative",
                isGoalMet
                  ? "bg-[#03D26F]"
                  : "bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-400 dark:from-sky-500 dark:to-cyan-300"
              )}
              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            >
              {/* Fluid specular top sheen */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-white/40 rounded-full" />
            </div>
          </div>

          {/* Fluid Milestone Ticks */}
          <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground/80 px-1 font-bold">
            <span>0ml</span>
            <span>{(dailyTarget * 0.25).toFixed(0)}ml</span>
            <span>{(dailyTarget * 0.5).toFixed(0)}ml</span>
            <span>{(dailyTarget * 0.75).toFixed(0)}ml</span>
            <span className={isGoalMet ? "text-[#03D26F] font-black" : ""}>
              {(dailyTarget / 1000).toFixed(1)}L
            </span>
          </div>
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

      {/* ================= 4. INLINE TARGET GOAL ADJUSTER (NO NESTED MODAL) ================= */}
      <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Target className="size-3.5 text-sky-500" />
            <span className="text-[11px] font-heading font-black uppercase tracking-wider text-foreground">
              Daily Target Goal
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setIsCustomTargetOpen(!isCustomTargetOpen);
            }}
            className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <SlidersHorizontal className="size-3" />
            <span>{isCustomTargetOpen ? "Presets" : "Custom"}</span>
          </button>
        </div>

        {/* Preset Chips */}
        {!isCustomTargetOpen ? (
          <div className="grid grid-cols-4 gap-2">
            {TARGET_PRESETS.map((t) => {
              const active = dailyTarget === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleSelectTarget(t)}
                  className={cn(
                    "min-h-[38px] py-1.5 px-2 rounded-xl text-xs font-heading text-center flex items-center justify-center gap-1 transition-all cursor-pointer",
                    active
                      ? "bg-[#CEF431] text-[#161514] border-2 border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_#161514]"
                      : "bg-white dark:bg-[#1C1A18] text-muted-foreground hover:text-foreground border border-border font-bold hover:bg-secondary"
                  )}
                >
                  <span>{(t / 1000).toFixed(1)}L</span>
                  {active && <Check className="size-3 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        ) : (
          /* Inline Custom Target Goal Form */
          <form onSubmit={handleSaveCustomTarget} className="flex items-center gap-2 pt-0.5">
            <div className="relative flex-1">
              <input
                type="number"
                min="500"
                step="100"
                max="10000"
                value={customTargetInput}
                onChange={(e) => setCustomTargetInput(e.target.value)}
                placeholder="Target in ml"
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
              Set Goal
            </button>
          </form>
        )}
      </div>

      {/* ================= 5. MANUAL VOLUME DIRECT OVERRIDE (COLLAPSIBLE) ================= */}
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
