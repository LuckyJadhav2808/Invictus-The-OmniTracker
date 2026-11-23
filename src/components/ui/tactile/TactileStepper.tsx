"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { Plus, Minus } from "lucide-react";

export interface TactileStepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label?: string;
  presets?: number[];
  className?: string;
}

export function TactileStepper({
  value,
  onChange,
  min = 0,
  max = 10000,
  step = 1,
  unit = "",
  label,
  presets = [],
  className,
}: TactileStepperProps) {
  const handleDecrement = () => {
    soundFX.playPop();
    soundFX.vibrate(10);
    const next = Math.max(min, value - step);
    onChange(next);
  };

  const handleIncrement = () => {
    soundFX.playPop();
    soundFX.vibrate(10);
    const next = Math.min(max, value + step);
    onChange(next);
  };

  const handleSelectPreset = (p: number) => {
    soundFX.playPop();
    soundFX.vibrate(15);
    onChange(p);
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      {label && (
        <span className="block font-heading font-black text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      )}

      {/* Stepper Shell */}
      <div className="flex items-center justify-between gap-3 p-1.5 rounded-2xl border-2 border-[#161514] dark:border-[#2A2724] bg-white dark:bg-[#1C1A18] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000]">
        {/* Decrement Button */}
        <button
          type="button"
          disabled={value <= min}
          onClick={handleDecrement}
          aria-label="Decrement"
          className={cn(
            "size-10 rounded-xl border border-[#161514] dark:border-white/20 bg-secondary flex items-center justify-center transition-all select-none cursor-pointer",
            "active:scale-95 hover:bg-[#161514]/10 dark:hover:bg-white/10",
            value <= min && "opacity-40 cursor-not-allowed pointer-events-none"
          )}
        >
          <Minus className="size-4 stroke-[2.5] text-foreground" />
        </button>

        {/* Center Readout */}
        <div className="flex-1 text-center py-1">
          <span className="font-heading font-black text-xl sm:text-2xl text-foreground tabular-nums tracking-tight">
            {value.toLocaleString()}
          </span>
          {unit && (
            <span className="font-mono text-xs text-muted-foreground ml-1">
              {unit}
            </span>
          )}
        </div>

        {/* Increment Button */}
        <button
          type="button"
          disabled={value >= max}
          onClick={handleIncrement}
          aria-label="Increment"
          className={cn(
            "size-10 rounded-xl border border-[#161514] dark:border-white/20 bg-[#CEF431] text-[#161514] flex items-center justify-center transition-all select-none cursor-pointer",
            "active:scale-95 shadow-xs hover:brightness-105",
            value >= max && "opacity-40 cursor-not-allowed pointer-events-none"
          )}
        >
          <Plus className="size-4 stroke-[3]" />
        </button>
      </div>

      {/* Optional Preset Quick-Select Chips */}
      {presets.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {presets.map((preset) => {
            const isSelected = value === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer",
                  isSelected
                    ? "bg-[#161514] text-[#FAF8F5] border-[#161514] dark:bg-[#CEF431] dark:text-[#161514] dark:border-[#CEF431] shadow-xs"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-[#161514]/40"
                )}
              >
                +{preset}
                {unit}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
