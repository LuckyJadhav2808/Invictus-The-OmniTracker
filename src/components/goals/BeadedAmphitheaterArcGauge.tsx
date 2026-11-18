"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface BeadedAmphitheaterArcGaugeProps {
  todayPercent: number; // 0 - 100
  weekPercent?: number; // 0 - 100
  streakPercent?: number; // 0 - 100
  className?: string;
}

export interface DotPoint {
  x: number;
  y: number;
  isFilled: boolean;
  index: number;
}

export function calculateArcDots(
  cx: number,
  cy: number,
  radius: number,
  count: number,
  percent: number,
  startAngle = 200,
  totalSweep = 220
): DotPoint[] {
  const dots: DotPoint[] = [];
  const filledCount = Math.round((percent / 100) * count);

  for (let i = 0; i < count; i++) {
    const fraction = count > 1 ? i / (count - 1) : 0;
    const angleDeg = startAngle - fraction * totalSweep;
    const angleRad = (angleDeg * Math.PI) / 180;

    const x = cx + radius * Math.cos(angleRad);
    const y = cy - radius * Math.sin(angleRad);

    dots.push({
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      isFilled: i < filledCount,
      index: i,
    });
  }
  return dots;
}

export function BeadedAmphitheaterArcGauge({
  todayPercent = 0,
  weekPercent = 75,
  streakPercent = 50,
  className,
}: BeadedAmphitheaterArcGaugeProps) {
  const arcLabelId = useId();

  // Clamp percentages between 0 and 100
  const clampedToday = Math.max(0, Math.min(100, Math.round(todayPercent)));
  const clampedWeek = Math.max(0, Math.min(100, Math.round(weekPercent)));
  const clampedStreak = Math.max(0, Math.min(100, Math.round(streakPercent)));

  const cx = 160;
  const cy = 145;

  // Outer: Today completion dots (21 dots)
  const outerDots = calculateArcDots(cx, cy, 116, 21, clampedToday);
  // Middle: Weekly consistency dots (17 dots)
  const middleDots = calculateArcDots(cx, cy, 96, 17, clampedWeek);
  // Inner: Streak momentum dots (13 dots)
  const innerDots = calculateArcDots(cx, cy, 76, 13, clampedStreak);

  return (
    <div className={cn("relative flex flex-col items-center justify-center select-none", className)}>
      <svg
        viewBox="0 0 320 185"
        className="w-full max-w-[320px] h-auto overflow-visible"
        aria-hidden="true"
      >
        <defs>
          {/* Curved text path along the outer halo */}
          <path
            id={arcLabelId}
            d="M 28,145 A 136,136 0 0,1 292,145"
            fill="none"
          />
          {/* Linear gradient for 100% conquer glow */}
          <linearGradient id="limeConquerGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CEF431" />
            <stop offset="100%" stopColor="#03D26F" />
          </linearGradient>
        </defs>

        {/* Curved Header Label: TODAY • WEEK • STREAK */}
        <text
          fill="currentColor"
          className="text-[9.5px] font-mono font-black uppercase tracking-[0.25em] text-[#6B6B6B] dark:text-[#A8A29E]"
        >
          <textPath href={`#${arcLabelId}`} startOffset="50%" textAnchor="middle">
            TODAY • WEEK • STREAK
          </textPath>
        </text>

        {/* 1. Outer Arc: Today's Completion (Electric Lime #CEF431) */}
        {outerDots.map((dot) => (
          <circle
            key={`outer-${dot.index}`}
            cx={dot.x}
            cy={dot.y}
            r={dot.isFilled ? 4.5 : 3.8}
            className={cn(
              "transition-all duration-300",
              dot.isFilled
                ? clampedToday === 100
                  ? "fill-[#CEF431] stroke-[#161514] stroke-[1.2]"
                  : "fill-[#CEF431] stroke-[#161514] dark:stroke-black stroke-[1]"
                : "fill-[#161514]/15 dark:fill-white/20 stroke-[#161514]/10 dark:stroke-white/10 stroke-[0.8]"
            )}
          />
        ))}

        {/* 2. Middle Arc: Weekly Consistency (Malachite Emerald #03D26F) */}
        {middleDots.map((dot) => (
          <circle
            key={`middle-${dot.index}`}
            cx={dot.x}
            cy={dot.y}
            r={dot.isFilled ? 4 : 3.2}
            className={cn(
              "transition-all duration-300",
              dot.isFilled
                ? "fill-[#03D26F] stroke-[#161514]/60 dark:stroke-black stroke-[0.8]"
                : "fill-[#161514]/10 dark:fill-white/15 stroke-[#161514]/10 dark:stroke-white/10 stroke-[0.8]"
            )}
          />
        ))}

        {/* 3. Inner Arc: Streak Momentum (Lavender #C084FC) */}
        {innerDots.map((dot) => (
          <circle
            key={`inner-${dot.index}`}
            cx={dot.x}
            cy={dot.y}
            r={dot.isFilled ? 3.5 : 2.8}
            className={cn(
              "transition-all duration-300",
              dot.isFilled
                ? "fill-[#C084FC] stroke-[#161514]/60 dark:stroke-black stroke-[0.8]"
                : "fill-[#161514]/10 dark:fill-white/15 stroke-[#161514]/10 dark:stroke-white/10 stroke-[0.8]"
            )}
          />
        ))}

        {/* Center Telemetry Display */}
        <g className="text-center">
          <text
            x={cx}
            y={cy - 14}
            textAnchor="middle"
            fill="currentColor"
            className="text-4xl sm:text-5xl font-mono font-black tracking-tighter text-[#161514] dark:text-[#FAF8F5]"
          >
            {clampedToday}
          </text>
          <text
            x={cx}
            y={cy + 8}
            textAnchor="middle"
            fill="currentColor"
            className="text-[11px] font-mono font-black uppercase tracking-widest text-[#6B6B6B] dark:text-[#A8A29E]"
          >
            {clampedToday === 100 ? "CONQUERED 🏆" : "% TODAY"}
          </text>
        </g>
      </svg>
    </div>
  );
}
