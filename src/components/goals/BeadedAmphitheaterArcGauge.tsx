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
          {/* Glow filter for conquered dots */}
          <filter id="limeArcGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#CEF431" floodOpacity="0.8" />
          </filter>
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
            r={dot.isFilled ? 4.5 : 3.6}
            fill={dot.isFilled ? "#CEF431" : "rgba(150, 150, 150, 0.25)"}
            stroke={dot.isFilled ? "#161514" : "rgba(150, 150, 150, 0.15)"}
            strokeWidth={dot.isFilled ? (clampedToday === 100 ? 1.5 : 1) : 0.8}
            className="transition-all duration-300"
            filter={clampedToday === 100 && dot.isFilled ? "url(#limeArcGlow)" : undefined}
            style={{
              fill: dot.isFilled ? "#CEF431" : "rgba(150, 150, 150, 0.25)",
              stroke: dot.isFilled ? "#161514" : "rgba(150, 150, 150, 0.15)",
            }}
          />
        ))}

        {/* 2. Middle Arc: Weekly Consistency (Malachite Emerald #03D26F) */}
        {middleDots.map((dot) => (
          <circle
            key={`middle-${dot.index}`}
            cx={dot.x}
            cy={dot.y}
            r={dot.isFilled ? 4 : 3.2}
            fill={dot.isFilled ? "#03D26F" : "rgba(150, 150, 150, 0.2)"}
            stroke={dot.isFilled ? "#161514" : "rgba(150, 150, 150, 0.1)"}
            strokeWidth={dot.isFilled ? 1 : 0.8}
            className="transition-all duration-300"
            style={{
              fill: dot.isFilled ? "#03D26F" : "rgba(150, 150, 150, 0.2)",
              stroke: dot.isFilled ? "#161514" : "rgba(150, 150, 150, 0.1)",
            }}
          />
        ))}

        {/* 3. Inner Arc: Streak Momentum (Amber #F59E0B) */}
        {innerDots.map((dot) => (
          <circle
            key={`inner-${dot.index}`}
            cx={dot.x}
            cy={dot.y}
            r={dot.isFilled ? 3.5 : 2.8}
            fill={dot.isFilled ? "#F59E0B" : "rgba(150, 150, 150, 0.2)"}
            stroke={dot.isFilled ? "#161514" : "rgba(150, 150, 150, 0.1)"}
            strokeWidth={dot.isFilled ? 1 : 0.8}
            className="transition-all duration-300"
            style={{
              fill: dot.isFilled ? "#F59E0B" : "rgba(150, 150, 150, 0.2)",
              stroke: dot.isFilled ? "#161514" : "rgba(150, 150, 150, 0.1)",
            }}
          />
        ))}

        {/* Center Telemetry Display */}
        <g className="text-center">
          <text
            x={cx}
            y={cy - 14}
            textAnchor="middle"
            fill={clampedToday === 100 ? "#CEF431" : "currentColor"}
            style={{
              fill: clampedToday === 100 ? "#CEF431" : undefined,
            }}
            className={cn(
              "text-4xl sm:text-5xl font-mono font-black tracking-tighter transition-colors",
              clampedToday === 100 ? "text-[#CEF431]" : "text-[#161514] dark:text-[#FAF8F5]"
            )}
          >
            {clampedToday}
          </text>
          <text
            x={cx}
            y={cy + 8}
            textAnchor="middle"
            fill={clampedToday === 100 ? "#03D26F" : "currentColor"}
            style={{
              fill: clampedToday === 100 ? "#03D26F" : undefined,
            }}
            className={cn(
              "text-[11px] font-mono font-black uppercase tracking-widest transition-colors",
              clampedToday === 100 ? "text-[#03D26F]" : "text-[#6B6B6B] dark:text-[#A8A29E]"
            )}
          >
            {clampedToday === 100 ? "CONQUERED 🏆" : "% TODAY"}
          </text>
        </g>
      </svg>
    </div>
  );
}
