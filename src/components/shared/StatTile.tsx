"use client";

import { ProgressRing } from "@/components/shared/ProgressRing";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string | number;
  percentage?: number;
  bgClass: string; // e.g. bg-amber-500
  textColorClass?: string; // e.g. text-navy-900
  ringColorClass?: string;
  ringTrackColorClass?: string;
  onClick?: () => void;
  className?: string;
}

export function StatTile({
  label,
  value,
  percentage = 0,
  bgClass,
  textColorClass = "text-[#161514]",
  ringColorClass = "stroke-[#161514]",
  ringTrackColorClass = "stroke-[#161514]/20",
  onClick,
  className = "",
}: StatTileProps) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        bgClass,
        textColorClass,
        "rounded-2xl p-4 text-left border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#161514] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-150 flex flex-col justify-between h-[126px] w-full cursor-pointer select-none group",
        className
      )}
    >
      <div className="flex items-center justify-between w-full">
        <span className="font-heading font-black text-[11px] uppercase tracking-wider text-[#161514]/80 truncate pr-2">
          {label}
        </span>
        <div className="shrink-0 bg-white/40 p-1 rounded-full border border-[#161514]/40">
          <ProgressRing
            percentage={percentage}
            size={22}
            strokeWidth={3}
            colorClass={ringColorClass}
            trackColorClass={ringTrackColorClass}
          />
        </div>
      </div>
      <span className="font-heading text-2xl sm:text-3xl font-black mt-2 leading-none tracking-tight text-[#161514]">
        {value}
      </span>
    </button>
  );
}
