"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { Gauge, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";

export interface TactileThermalGaugeProps {
  current: number;
  target: number;
  label?: string;
  unit?: string;
  symbol?: string;
  subtext?: string;
  onClick?: () => void;
  className?: string;
}

export function TactileThermalGauge({
  current,
  target,
  label = "Daily Allowance",
  unit = "",
  symbol = "₹",
  subtext,
  onClick,
  className,
}: TactileThermalGaugeProps) {
  // Pacing ratio (0.0 to 1.0+)
  const ratio = useMemo(() => {
    if (target <= 0) return 0;
    return Math.max(0, current / target);
  }, [current, target]);

  const percentage = Math.min(100, Math.round(ratio * 100));

  // Determine thermal safety zone:
  // Safe: >= 40% remaining (Green/Lime)
  // Caution: 15% - 39% remaining (Amber)
  // Danger / Blown: < 15% (Rose)
  const thermalZone = useMemo(() => {
    if (percentage > 40) {
      return {
        zone: "safe",
        color: "text-[#161514] dark:text-[#CEF431]",
        barBg: "bg-[#CEF431]",
        pillBg: "bg-[#CEF431]/20 border-[#CEF431]",
        statusLabel: "Optimal",
        icon: Sparkles,
      };
    }
    if (percentage > 15) {
      return {
        zone: "warning",
        color: "text-[#F59E0B]",
        barBg: "bg-[#F59E0B]",
        pillBg: "bg-[#F59E0B]/20 border-[#F59E0B]",
        statusLabel: "Pacing Tight",
        icon: TrendingUp,
      };
    }
    return {
      zone: "danger",
      color: "text-[#F43F5E]",
      barBg: "bg-[#F43F5E]",
      pillBg: "bg-[#F43F5E]/20 border-[#F43F5E]",
      statusLabel: "Low Cushion",
      icon: ShieldAlert,
    };
  }, [percentage]);

  const StatusIcon = thermalZone.icon;

  return (
    <div
      onClick={() => {
        if (onClick) {
          soundFX.playPop();
          soundFX.vibrate(10);
          onClick();
        }
      }}
      className={cn(
        "relative rounded-2xl border-2 border-[#161514] dark:border-[#2A2724] bg-white dark:bg-[#1C1A18] p-4",
        "shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000]",
        "transition-all duration-150",
        onClick && "cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:border-[#161514]",
        className
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Gauge className="size-4 text-muted-foreground stroke-[2]" />
          <span className="font-heading font-black text-xs text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
        </div>

        {/* Dynamic Thermal Status Pill */}
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold tracking-tight",
            thermalZone.pillBg,
            thermalZone.color
          )}
        >
          <StatusIcon className="size-3 stroke-[2.5]" />
          {thermalZone.statusLabel}
        </span>
      </div>

      {/* Primary Telemetry Readout */}
      <div className="flex items-baseline gap-1 my-1">
        <span className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-foreground tabular-nums">
          {symbol}
          {current.toLocaleString()}
          {unit}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          / {symbol}
          {target.toLocaleString()}
          {unit}
        </span>
      </div>

      {/* Segmented Neobrutalist Dial Bar */}
      <div className="relative w-full h-3 rounded-full bg-[#161514]/10 dark:bg-white/10 border border-[#161514]/20 dark:border-white/20 overflow-hidden mt-3 p-[1px]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            thermalZone.barBg
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Footer Subtext or percentage */}
      <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mt-2">
        <span>{subtext || "Calculated live from ledger"}</span>
        <span className="font-bold tabular-nums text-foreground">{percentage}% remaining</span>
      </div>
    </div>
  );
}
