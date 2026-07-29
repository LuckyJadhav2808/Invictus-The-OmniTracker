"use client";

import { ProgressRing } from "@/components/shared/ProgressRing";

interface StatTileProps {
  label: string;
  value: string | number;
  percentage?: number;
  bgClass: string; // e.g. bg-amber-500
  textColorClass?: string; // e.g. text-navy-900
  ringColorClass?: string;
  ringTrackColorClass?: string;
  onClick?: () => void;
}

export function StatTile({
  label,
  value,
  percentage = 0,
  bgClass,
  textColorClass = "text-navy-900",
  ringColorClass = "stroke-navy-900",
  ringTrackColorClass = "stroke-white/25",
  onClick,
}: StatTileProps) {
  return (
    <button
      onClick={onClick}
      className={`${bgClass} ${textColorClass} rounded-[var(--radius-md)] p-4 text-left shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-between h-[120px] w-full`}
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
          {label}
        </span>
        <ProgressRing
          percentage={percentage}
          size={24}
          strokeWidth={3}
          colorClass={ringColorClass}
          trackColorClass={ringTrackColorClass}
        />
      </div>
      <span className="text-3xl font-extrabold mt-2 leading-none" style={{ fontFamily: "var(--font-heading)" }}>
        {value}
      </span>
    </button>
  );
}
