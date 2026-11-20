"use client";

import { useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface HorizontalWaterBottleProps {
  currentAmount: number; // in ml
  targetAmount: number; // in ml
  onSetTarget?: (targetMl: number) => void;
  className?: string;
  showCustomButton?: boolean;
}

const LITERS_PRESETS = [
  { label: "1.0L", ml: 1000 },
  { label: "1.5L", ml: 1500 },
  { label: "2.0L", ml: 2000 },
  { label: "2.5L", ml: 2500 },
  { label: "3.0L", ml: 3000 },
];

export function HorizontalWaterBottle({
  currentAmount,
  targetAmount,
  onSetTarget,
  className,
  showCustomButton = true,
}: HorizontalWaterBottleProps) {
  const [containerRef] = useAutoAnimate<HTMLDivElement>({ duration: 180, easing: "ease-out" });
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customInput, setCustomInput] = useState(
    (targetAmount / 1000).toFixed(1)
  );

  const percentage = Math.min(
    100,
    Math.max(0, Math.round((currentAmount / Math.max(1, targetAmount)) * 100))
  );
  const isGoalMet = currentAmount >= targetAmount && targetAmount > 0;
  const targetLiters = (targetAmount / 1000).toFixed(1);

  const handleSelectPreset = (ml: number) => {
    soundFX.playPop();
    soundFX.vibrate(15);
    onSetTarget?.(ml);
    setCustomInput((ml / 1000).toFixed(1));
    setIsCustomOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLiters = parseFloat(customInput);
    if (!isNaN(parsedLiters) && parsedLiters > 0) {
      soundFX.playPop();
      const ml = Math.round(parsedLiters * 1000);
      onSetTarget?.(ml);
      setIsCustomOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("w-full space-y-2 select-none", className)}>
      {/* Bottle Assembly Row */}
      <div className="flex items-center gap-2">
        {/* Horizontal Water Bottle (Constant Dimensions) */}
        <div className="flex-1 flex items-center min-w-0">
          {/* 1. Bottle Cap with Grip Ribs */}
          <div className="relative w-3.5 h-6 bg-[#161514] dark:bg-[#38332E] rounded-l-md border-2 border-r-0 border-[#161514] dark:border-[#38332E] flex flex-col justify-evenly py-0.5 px-[2px] shrink-0 shadow-[1px_1px_0px_0px_#161514]">
            <div className="h-[2px] bg-white/40 rounded-full" />
            <div className="h-[2px] bg-white/40 rounded-full" />
            <div className="h-[2px] bg-white/40 rounded-full" />
          </div>

          {/* 2. Narrower Bottle Neck */}
          <div className="w-2.5 h-8 bg-sky-100 dark:bg-sky-950/60 border-y-2 border-[#161514] dark:border-[#38332E] shrink-0 relative overflow-hidden">
            {/* Fluid in neck when filling past 96% */}
            <div
              className={cn(
                "h-full transition-all duration-500 ease-out",
                isGoalMet
                  ? "bg-[#03D26F]"
                  : "bg-gradient-to-r from-sky-400 to-sky-500"
              )}
              style={{
                width: percentage >= 96 ? "100%" : "0%",
              }}
            />
          </div>

          {/* 3. Main Bottle Chamber (Lying Sideways) */}
          <div className="flex-1 relative h-11 bg-white dark:bg-[#1C1A18] rounded-r-2xl border-2 border-[#161514] dark:border-[#38332E] shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_#000000] overflow-hidden">
            {/* Fluid Volume Reservoir */}
            <div
              className={cn(
                "h-full transition-all duration-500 ease-out relative",
                isGoalMet
                  ? "bg-[#03D26F]"
                  : "bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-400 dark:from-sky-500 dark:to-cyan-400"
              )}
              style={{ width: `${percentage}%` }}
            >
              {/* Glass Specular Top Sheen */}
              <div className="absolute top-1 inset-x-1 h-[2px] bg-white/60 dark:bg-white/40 rounded-full" />
              {/* Animated Bubbles / Ripple Sheen */}
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 rounded-r" />
            </div>

            {/* Etched Glass Graduation Tick Marks on Bottle */}
            <div className="absolute inset-0 pointer-events-none flex justify-between items-center px-3 text-[9px] font-mono font-black text-[#161514]/70 dark:text-stone-300/80">
              {/* 25% Tick */}
              <div className="flex flex-col items-center h-full justify-center">
                <div className="h-3 w-[1px] bg-[#161514]/30 dark:bg-white/30" />
                <span className="scale-90">{(targetAmount * 0.25).toFixed(0)}</span>
              </div>

              {/* 50% Tick */}
              <div className="flex flex-col items-center h-full justify-center">
                <div className="h-3.5 w-[1.5px] bg-[#161514]/40 dark:bg-white/40" />
                <span className="scale-90">{(targetAmount * 0.5).toFixed(0)}</span>
              </div>

              {/* 75% Tick */}
              <div className="flex flex-col items-center h-full justify-center">
                <div className="h-3 w-[1px] bg-[#161514]/30 dark:bg-white/30" />
                <span className="scale-90">{(targetAmount * 0.75).toFixed(0)}</span>
              </div>

              {/* Target / 1L Mark */}
              <div className="flex flex-col items-center h-full justify-center pr-1">
                <div className="h-4 w-[1.5px] bg-[#161514]/50 dark:bg-white/50" />
                <span className="font-heading font-black scale-95 text-[#161514] dark:text-[#FAF8F5]">
                  {targetLiters}L
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Small ||| Custom Liters Button */}
        {showCustomButton && onSetTarget && (
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setIsCustomOpen(!isCustomOpen);
            }}
            className={cn(
              "h-11 px-2.5 rounded-xl border-2 border-[#161514] dark:border-[#38332E] font-mono font-black text-xs flex items-center justify-center gap-1 transition-all shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer shrink-0",
              isCustomOpen
                ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514]"
                : "bg-white dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] hover:bg-sky-50 dark:hover:bg-[#252321]"
            )}
            title="Set bottle capacity (custom Liters)"
          >
            <span className="tracking-tighter font-mono font-black text-sm">|||</span>
            <span className="text-[10px] font-heading font-black">L</span>
          </button>
        )}
      </div>

      {/* Collapsible Custom Liters Selector Deck */}
      {isCustomOpen && onSetTarget && (
        <div className="p-3 bg-secondary/60 dark:bg-secondary/30 rounded-2xl border-2 border-[#161514] dark:border-[#38332E] shadow-[2px_2px_0px_0px_#161514] space-y-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-heading font-black uppercase tracking-wider text-foreground">
              Bottle Capacity (Target L)
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              Bottle size stays constant
            </span>
          </div>

          {/* Quick Preset Liters Chips */}
          <div className="grid grid-cols-5 gap-1.5">
            {LITERS_PRESETS.map((preset) => {
              const active = targetAmount === preset.ml;
              return (
                <button
                  key={preset.ml}
                  type="button"
                  onClick={() => handleSelectPreset(preset.ml)}
                  className={cn(
                    "h-8 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center justify-center gap-0.5",
                    active
                      ? "bg-[#CEF431] text-[#161514] border-[#161514] font-black shadow-[1px_1px_0px_0px_#161514]"
                      : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>{preset.label}</span>
                  {active && <Check className="size-2.5 stroke-[3]" />}
                </button>
              );
            })}
          </div>

          {/* Freeform Custom L Input */}
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="10.0"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="e.g. 1.8"
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
          </form>
        </div>
      )}
    </div>
  );
}
