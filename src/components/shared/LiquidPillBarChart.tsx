"use client";

import { cn } from "@/lib/utils";

interface BarData {
  label: string; // e.g. "Jan", "Feb", "Mar"
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
}

export function LiquidPillBarChart({
  title = "Total Savings",
  totalValue = "$90,744",
  data,
  className,
}: LiquidPillBarChartProps) {
  return (
    <div
      className={cn(
        "bg-[#C084FC] rounded-[36px] p-6 border-2.5 border-[#161514] shadow-[5px_5px_0px_0px_rgba(22,21,20,1)] text-[#161514]",
        className
      )}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-black uppercase tracking-wider opacity-90 block">
            {title}
          </span>
          <h2
            className="text-3xl font-black tracking-tight text-[#161514] mt-0.5"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {totalValue}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-white border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] flex items-center justify-center font-black text-xs cursor-pointer hover:bg-[#CEF431] transition-colors">
            📅
          </div>
          <div className="h-9 w-9 rounded-full bg-white border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] flex items-center justify-center font-black text-xs cursor-pointer hover:bg-[#CEF431] transition-colors">
            📊
          </div>
        </div>
      </div>

      {/* Liquid Pill Columns Row */}
      <div className="bg-white rounded-3xl p-5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] flex justify-between items-end gap-3 sm:gap-4">
        {data.map((bar, idx) => {
          const isHighlight = bar.highlighted;
          const fillColor = bar.color || (isHighlight ? "#FB7185" : "#38BDF8");

          return (
            <div key={idx} className="flex flex-col items-center flex-1">
              {/* Value Pill Tooltip for Highlighted Column */}
              {isHighlight && (
                <div className="mb-2 bg-[#161514] text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] animate-bounce">
                  {bar.value || `${bar.percentage}%`}
                </div>
              )}

              {/* Capsule Shell Bar Column */}
              <div className="relative w-full max-w-[44px] h-44 rounded-[40px] bg-[#EAF4F4] border-2 border-[#161514] overflow-hidden flex flex-col justify-end p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
                {/* Liquid Level Fill */}
                <div
                  className="w-full rounded-[32px] transition-all duration-700 ease-out relative"
                  style={{
                    height: `${Math.min(100, Math.max(10, bar.percentage))}%`,
                    backgroundColor: fillColor,
                  }}
                >
                  {/* Dotted Liquid Surface Line */}
                  <div className="absolute top-0 left-0 right-0 border-t-2 border-dashed border-[#161514]/40" />
                </div>
              </div>

              {/* Month Label */}
              <span className="text-[11px] font-black uppercase tracking-wider text-[#161514] mt-2.5">
                {bar.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
