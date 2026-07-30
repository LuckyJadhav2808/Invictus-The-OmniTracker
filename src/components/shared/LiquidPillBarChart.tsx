"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface BarData {
  label?: string; // e.g. "M", "T", "W", "T", "F", "S", "S"
  percentage: number; // 0 to 100
  value?: string | number;
  highlighted?: boolean;
  color?: string; // e.g. "#FB7185" (Coral Red) or "#38BDF8" (Sky Blue)
}

interface LiquidPillBarChartProps {
  title?: string;
  totalValue?: string | number;
  data: BarData[];
  className?: string;
  onCalendarClick?: () => void;
  onViewModeToggle?: (mode: "week" | "month") => void;
}

export function LiquidPillBarChart({
  title = "Weekly Consistency & Tracker Flow",
  totalValue = "0 Habits | 0.0h Study",
  data,
  className,
  onCalendarClick,
  onViewModeToggle,
}: LiquidPillBarChartProps) {
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  const handleCalendarClick = () => {
    if (onCalendarClick) {
      onCalendarClick();
    } else {
      toast.success("Showing Current Active Tracking Week 📅");
    }
  };

  const handleToggleView = () => {
    const nextMode = viewMode === "week" ? "month" : "week";
    setViewMode(nextMode);
    if (onViewModeToggle) {
      onViewModeToggle(nextMode);
    } else {
      toast.success(`Switched to ${nextMode === "week" ? "Weekly" : "Monthly"} Analytics Flow 📊`);
    }
  };

  return (
    <div
      className={cn(
        "bg-[#C084FC] rounded-[36px] p-6 border-2.5 border-[#161514] shadow-[5px_5px_0px_0px_rgba(22,21,20,1)] text-[#161514] transition-all duration-300",
        className
      )}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider opacity-90 block">
              {title}
            </span>
            <span className="bg-[#CEF431] text-[#161514] text-[9px] font-black px-2 py-0.5 rounded-full border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] uppercase">
              {viewMode === "week" ? "Weekly" : "Monthly"}
            </span>
          </div>
          <h2
            className="text-2xl sm:text-3xl font-black tracking-tight text-[#161514] mt-0.5"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {totalValue}
          </h2>
        </div>

        {/* Interactive Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCalendarClick}
            className="h-10 w-10 rounded-full bg-white hover:bg-[#CEF431] border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] flex items-center justify-center font-black text-sm cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title="Filter Active Date Range"
          >
            📅
          </button>
          <button
            type="button"
            onClick={handleToggleView}
            className="h-10 w-10 rounded-full bg-white hover:bg-[#CEF431] border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] flex items-center justify-center font-black text-sm cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title="Toggle View Mode (Week/Month)"
          >
            📊
          </button>
        </div>
      </div>

      {/* Liquid Pill Columns Row */}
      <div className="bg-white rounded-3xl p-5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] flex justify-between items-end gap-2 sm:gap-4">
        {data.map((bar, idx) => {
          const isHighlight = bar.highlighted;
          const fillColor = bar.color || (isHighlight ? "#FB7185" : "#38BDF8");

          return (
            <div key={idx} className="flex flex-col items-center flex-1">
              {/* Value Pill Tooltip for Highlighted Column */}
              {isHighlight ? (
                <div className="mb-2 bg-[#161514] text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] animate-bounce">
                  {bar.value || `${Math.round(bar.percentage)}%`}
                </div>
              ) : (
                <div className="h-5 mb-2" />
              )}

              {/* Capsule Shell Bar Column */}
              <div className="relative w-full max-w-[44px] h-40 sm:h-44 rounded-[40px] bg-[#EAF4F4] border-2 border-[#161514] overflow-hidden flex flex-col justify-end p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
                {/* Liquid Level Fill */}
                <div
                  className="w-full rounded-[32px] transition-all duration-700 ease-out relative"
                  style={{
                    height: `${Math.min(100, Math.max(5, bar.percentage))}%`,
                    backgroundColor: fillColor,
                  }}
                >
                  {/* Dotted Liquid Surface Line */}
                  {bar.percentage > 5 && (
                    <div className="absolute top-0 left-0 right-0 border-t-2 border-dashed border-[#161514]/40" />
                  )}
                </div>
              </div>

              {/* Day Label if provided */}
              {bar.label && (
                <span className="text-[11px] font-black uppercase tracking-wider text-[#161514] mt-2.5">
                  {bar.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
