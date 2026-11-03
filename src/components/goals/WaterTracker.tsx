"use client";

import React, { useState, useEffect } from "react";
import { Droplets, Plus, Minus, Settings2, Sparkles, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { AdaptiveDrawerDialog } from "@/components/shared/AdaptiveDrawerDialog";
import { toast } from "sonner";

interface WaterTrackerProps {
  amount: number; // in ml
  onLogWater: (amountDelta: number) => void;
  onSetWater: (absoluteAmount: number, target?: number) => Promise<void>;
  targetAmount?: number; // daily target in ml (default 2000ml)
}

interface SplashTag {
  id: number;
  text: string;
  x: number;
  y: number;
}

export function WaterTracker({
  amount,
  onLogWater,
  onSetWater,
  targetAmount = 2000,
}: WaterTrackerProps) {
  const [localAmount, setLocalAmount] = useState(amount);
  const [dailyTarget, setDailyTarget] = useState(targetAmount);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [customInput, setCustomInput] = useState(String(amount));
  const [targetInput, setTargetInput] = useState(String(targetAmount));
  const [splashTags, setSplashTags] = useState<SplashTag[]>([]);
  const [waveOffset, setWaveOffset] = useState(0);

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

  // Gentle wave oscillation animation
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveOffset((prev) => (prev + 0.08) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const percentage = Math.min(100, Math.round((localAmount / dailyTarget) * 100));
  const isGoalMet = localAmount >= dailyTarget;

  // Rewarding visual fill percentage:
  // When 0ml: 0% (vessel is clearly empty)
  // When >0ml: generous base (18%) + scaled progress so 250ml (1 glass) fills ~28% of the tumbler!
  const visualHeightPercent = localAmount <= 0
    ? 0
    : Math.min(100, Math.round(18 + (percentage * 0.82)));

  // Commentary based on hydration tier
  const getCommentary = () => {
    if (percentage === 0) return { title: "Desert Mode", desc: "Prime hydration with your first glass" };
    if (percentage < 35) return { title: "Cellular Awakening", desc: "Hydration climbing. Keep the flow going" };
    if (percentage < 70) return { title: "Optimal Velocity", desc: "Over halfway. Focus and energy sustained" };
    if (percentage < 100) return { title: "Final Stretch", desc: "Almost ironclad. Lock in the daily target" };
    return { title: "Hydrated Peak", desc: "Target achieved. Optimal cognitive and physical state." };
  };

  const commentary = getCommentary();

  const handleQuickAdd = (delta: number, e: React.MouseEvent) => {
    soundFX.playSplash();
    soundFX.vibrate(15);

    // Instant optimistic local update
    const next = Math.max(0, localAmount + delta);
    setLocalAmount(next);
    setCustomInput(String(next));
    onLogWater(delta);

    // Spawn floating splash badge
    const rect = e.currentTarget.getBoundingClientRect();
    const newTag: SplashTag = {
      id: Date.now() + Math.random(),
      text: delta > 0 ? `+${delta}ml` : `${delta}ml`,
      x: rect.width / 2,
      y: 0,
    };
    setSplashTags((prev) => [...prev, newTag]);

    // Cleanup after animation completes
    setTimeout(() => {
      setSplashTags((prev) => prev.filter((t) => t.id !== newTag.id));
    }, 1200);

    if (localAmount + delta >= dailyTarget && localAmount < dailyTarget) {
      soundFX.playCompleteChime();
      toast.success("Daily hydration target achieved! Well done.");
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
    <div className="bg-white dark:bg-[#1C1A18] rounded-xl p-5 border border-[#E8E5DF] dark:border-[#383531] space-y-4 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-[#F1EFEA] dark:bg-[#252321] flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Droplets className="size-4 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="text-[15px] font-sans font-semibold text-[#161514] dark:text-[#FAF8F5] tracking-tight leading-none">
              Water intake
            </h3>
            <span className="text-xs font-mono text-[#6B6B6B] dark:text-[#A8A29E] mt-0.5 block">
              {localAmount} ml / {dailyTarget} ml ({percentage}%)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            setIsEditOpen(true);
          }}
          className="size-8 rounded-lg border border-[#E8E5DF] dark:border-[#383531] bg-white dark:bg-[#252321] hover:bg-[#F5F3EF] dark:hover:bg-[#2e2b28] text-[#161514] dark:text-[#FAF8F5] flex items-center justify-center transition-colors cursor-pointer"
          title="Adjust Target or Volume"
        >
          <Settings2 className="size-3.5 stroke-[1.5]" />
        </button>
      </div>

      {/* Main Hydration Visualizer: Tumbler + Info */}
      <div className="flex items-center gap-3.5 sm:gap-4.5">
        {/* Left Column: Refined Living Tumbler Vessel */}
        <div className="shrink-0 flex flex-col items-center">
          <div
            onClick={() => {
              soundFX.playPop();
              setIsEditOpen(true);
            }}
            className="relative w-20 sm:w-24 h-40 sm:h-44 rounded-xl border border-[#E8E5DF] dark:border-[#383531] bg-[#F0F9FF] dark:bg-[#082032] overflow-hidden cursor-pointer group select-none flex flex-col justify-end"
            title="Click to manually set volume"
          >
            {/* Measurement Graduations */}
            <div className="absolute inset-y-0 right-2 w-3 flex flex-col justify-between py-3 pointer-events-none z-20 opacity-30">
              <div className="border-t border-[#161514] dark:border-[#FAF8F5] w-2.5 ml-auto" />
              <div className="border-t border-[#161514] dark:border-[#FAF8F5] w-1.5 ml-auto" />
              <div className="border-t border-[#161514] dark:border-[#FAF8F5] w-2.5 ml-auto" />
              <div className="border-t border-[#161514] dark:border-[#FAF8F5] w-1.5 ml-auto" />
              <div className="border-t border-[#161514] dark:border-[#FAF8F5] w-2.5 ml-auto" />
            </div>

            {/* Empty State Prompt if 0ml */}
            {localAmount <= 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 px-2 text-center">
                <Droplets className="size-5 text-sky-400/60 mb-1 stroke-[2]" />
                <span className="text-[10px] font-bold text-[#161514]/50 dark:text-[#FAF8F5]/50">
                  Empty
                </span>
                <span className="text-[8px] font-medium text-[#161514]/40 dark:text-[#FAF8F5]/40">
                  Tap + below
                </span>
              </div>
            )}

            {/* Rising Liquid Column with smooth hardware-accelerated CSS transition */}
            <div
              className="absolute inset-x-0 bottom-0 overflow-hidden transition-all duration-700 ease-out pointer-events-none z-10"
              style={{ height: `${visualHeightPercent}%` }}
            >
              {/* Deep Water Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0284C7] via-[#0284C7] to-[#38BDF8]" />

              {/* Surface Liquid Wave Shimmer */}
              <svg
                viewBox="0 0 100 14"
                preserveAspectRatio="none"
                className="absolute top-0 inset-x-0 w-full h-3.5 -translate-y-1/2 pointer-events-none"
              >
                <path
                  d={`M 0 ${7 + Math.sin(waveOffset) * 2.5} Q 25 ${7 - Math.cos(waveOffset) * 2.5} 50 ${7 + Math.sin(waveOffset) * 2.5} T 100 ${7 - Math.cos(waveOffset) * 2.5} L 100 14 L 0 14 Z`}
                  fill="#7DD3FC"
                  fillOpacity="0.75"
                />
                <path
                  d={`M 0 ${7 - Math.cos(waveOffset) * 2} Q 25 ${7 + Math.sin(waveOffset) * 2} 50 ${7 - Math.cos(waveOffset) * 2} T 100 ${7 + Math.sin(waveOffset) * 2} L 100 14 L 0 14 Z`}
                  fill="#BAE6FD"
                  fillOpacity="0.9"
                />
              </svg>

              {/* Subtle rising ambient bubbles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute bottom-2 left-2 size-1.5 rounded-full bg-white animate-pulse" />
                <div className="absolute bottom-6 right-3 size-1 rounded-full bg-white animate-ping" />
                <div className="absolute bottom-12 left-4 size-2 rounded-full bg-white/60 animate-bounce" />
              </div>
            </div>

            {/* Center Volume Floating Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30">
              <div className="bg-white/95 dark:bg-[#161514]/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-[#E8E5DF] dark:border-[#383531] shadow-xs text-center">
                <span className="text-sm sm:text-base font-sans font-semibold text-[#161514] dark:text-[#FAF8F5] block leading-none font-mono tabular-nums">
                  {localAmount}
                </span>
                <span className="text-[9px] font-medium text-sky-700 dark:text-sky-400 block mt-0.5">
                  ml
                </span>
              </div>
            </div>

            {/* Hover tooltip hint */}
            <div className="absolute inset-x-0 bottom-1 text-center opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-none">
              <span className="text-[8px] font-medium bg-[#161514] text-white px-1.5 py-0.5 rounded">
                Edit
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Commentary & Quick-Pour Buttons */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Status Box */}
          <div
            className={cn(
              "p-2.5 rounded-lg border transition-colors",
              isGoalMet
                ? "bg-[#DCFAE5] dark:bg-[#03D26F]/20 border-[#03D26F]/30 text-[#04250e] dark:text-[#03D26F]"
                : "bg-[#F1EFEA] dark:bg-[#252321] border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5]"
            )}
          >
            <div className="flex items-center gap-1.5">
              {isGoalMet ? (
                <Award className="size-3.5 shrink-0 text-[#047857] dark:text-[#03D26F] stroke-[1.5]" />
              ) : (
                <Sparkles className="size-3.5 shrink-0 text-sky-600 dark:text-sky-400 stroke-[1.5]" />
              )}
              <h4 className="text-xs font-sans font-semibold truncate">
                {commentary.title}
              </h4>
            </div>
            <p className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E] mt-0.5 leading-snug line-clamp-2">
              {commentary.desc}
            </p>
          </div>

          {/* Quick 1-Tap Ergonomic Pour Buttons (Minimum 44px touch height) */}
          <div className="grid grid-cols-2 gap-2 relative">
            <button
              type="button"
              onClick={(e) => handleQuickAdd(250, e)}
              className="min-h-[44px] py-1.5 px-1 bg-white dark:bg-[#252321] hover:bg-[#F5F3EF] dark:hover:bg-[#2e2b28] border border-[#E8E5DF] dark:border-[#383531] rounded-lg text-[#161514] dark:text-[#FAF8F5] transition-colors flex flex-col items-center justify-center cursor-pointer select-none active:translate-y-px"
            >
              <span className="text-xs font-mono font-medium tracking-tight flex items-center gap-0.5 tabular-nums text-[#161514] dark:text-[#FAF8F5]">
                <Plus className="size-2.5 stroke-[2]" />
                250ml
              </span>
              <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">
                Glass
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => handleQuickAdd(500, e)}
              className="min-h-[44px] py-1.5 px-1 bg-white dark:bg-[#252321] hover:bg-[#F5F3EF] dark:hover:bg-[#2e2b28] border border-[#E8E5DF] dark:border-[#383531] rounded-lg text-[#161514] dark:text-[#FAF8F5] transition-colors flex flex-col items-center justify-center cursor-pointer select-none active:translate-y-px"
            >
              <span className="text-xs font-mono font-medium tracking-tight flex items-center gap-0.5 tabular-nums text-[#161514] dark:text-[#FAF8F5]">
                <Plus className="size-2.5 stroke-[2]" />
                500ml
              </span>
              <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">
                Bottle
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => handleQuickAdd(750, e)}
              className="min-h-[44px] py-1.5 px-1 bg-white dark:bg-[#252321] hover:bg-[#F5F3EF] dark:hover:bg-[#2e2b28] border border-[#E8E5DF] dark:border-[#383531] rounded-lg text-[#161514] dark:text-[#FAF8F5] transition-colors flex flex-col items-center justify-center cursor-pointer select-none active:translate-y-px"
            >
              <span className="text-xs font-mono font-medium tracking-tight flex items-center gap-0.5 tabular-nums text-[#161514] dark:text-[#FAF8F5]">
                <Plus className="size-2.5 stroke-[2]" />
                750ml
              </span>
              <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">
                Shaker
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => handleQuickAdd(-250, e)}
              disabled={localAmount <= 0}
              className="min-h-[44px] py-1.5 px-1 bg-white dark:bg-[#252321] hover:bg-[#F5F3EF] dark:hover:bg-[#2e2b28] disabled:opacity-40 border border-[#E8E5DF] dark:border-[#383531] rounded-lg text-[#6B6B6B] dark:text-[#A8A29E] hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex flex-col items-center justify-center cursor-pointer select-none active:translate-y-px"
            >
              <span className="text-xs font-mono font-medium tracking-tight flex items-center gap-0.5 font-mono tabular-nums">
                <Minus className="size-2.5 stroke-[2]" />
                250ml
              </span>
              <span className="text-[10px] text-[#6B6B6B]">
                Undo
              </span>
            </button>

            {/* Floating Splash Tags Animation */}
            {splashTags.map((tag) => (
              <div
                key={tag.id}
                className="absolute pointer-events-none -top-4 left-1/2 -translate-x-1/2 font-heading font-black text-xs text-sky-700 bg-white border-2 border-[#161514] px-2 py-0.5 rounded-full shadow-[2px_2px_0px_0px_#161514] animate-bounce z-30"
              >
                {tag.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Volume & Target Settings Modal (Powered by AdaptiveDrawerDialog) */}
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
              className="w-full text-base font-bold bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] rounded-xl px-3.5 py-2.5 text-[#161514] dark:text-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] focus:outline-none focus:ring-2 focus:ring-[#161514] dark:focus:ring-[#CEF431]"
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
              className="w-full text-base font-bold bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] rounded-xl px-3.5 py-2.5 text-[#161514] dark:text-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] focus:outline-none focus:ring-2 focus:ring-[#161514] dark:focus:ring-[#CEF431]"
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
                    "text-xs font-bold px-2.5 py-1 rounded-lg border-2 border-[#161514] dark:border-[#383531] cursor-pointer transition-all",
                    targetInput === String(t)
                      ? "bg-[#03D26F] text-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000]"
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
              className="flex-1 min-h-[44px] bg-white dark:bg-[#252321] hover:bg-slate-100 dark:hover:bg-[#2e2b28] border-2 border-[#161514] dark:border-[#383531] rounded-xl text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] bg-[#03D26F] hover:bg-[#02b861] border-2 border-[#161514] dark:border-[#383531] rounded-xl text-xs font-heading font-black text-[#161514] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
            >
              Save Hydration
            </button>
          </div>
        </form>
      </AdaptiveDrawerDialog>
    </div>
  );
}
