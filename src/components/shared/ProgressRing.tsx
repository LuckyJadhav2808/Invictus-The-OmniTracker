"use client";

import { useEffect, useState } from "react";

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string; // e.g. "stroke-amber-500" or similar
  trackColorClass?: string; // e.g. "stroke-amber-100" or translucent
}

export function ProgressRing({
  percentage,
  size = 40,
  strokeWidth = 4,
  colorClass = "stroke-amber-500",
  trackColorClass = "stroke-navy-900/10",
}: ProgressRingProps) {
  const [offset, setOffset] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    const rawProgress = typeof percentage === "number" && !isNaN(percentage) && isFinite(percentage) ? percentage : 0;
    const progress = Math.min(Math.max(rawProgress, 0), 100);
    const progressOffset = circumference - (progress / 100) * circumference;
    setOffset(progressOffset);
  }, [percentage, circumference]);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        className={`${trackColorClass} fill-transparent transition-all`}
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className={`${colorClass} fill-transparent transition-all duration-500 ease-out`}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
    </svg>
  );
}
