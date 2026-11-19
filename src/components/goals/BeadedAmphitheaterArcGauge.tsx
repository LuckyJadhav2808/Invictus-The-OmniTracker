"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface BeadedAmphitheaterArcGaugeProps {
  todayPercent: number; // 0 - 100
  weekPercent?: number; // 0 - 100
  streakPercent?: number; // 0 - 100
  className?: string;
  size?: "sm" | "md" | "lg" | "hero";
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

  // Full-width Hero Canvas Dimensions (Wide, high-presence amphitheater)
  const cx = 170;
  const cy = 152;

  // Outer: Today completion dots (21 dots) - High presence Electric Lime
  const outerDots = calculateArcDots(cx, cy, 126, 21, clampedToday);
  // Middle: Weekly consistency dots (17 dots) - Emerald
  const middleDots = calculateArcDots(cx, cy, 104, 17, clampedWeek);
  // Inner: Streak momentum dots (13 dots) - Amber
  const innerDots = calculateArcDots(cx, cy, 82, 13, clampedStreak);

  return (
    <div
      className={cn(
        "relative w-full flex flex-col items-center justify-center select-none py-1",
        className
      )}
    >
      <svg
        viewBox="0 0 340 195"
        className="w-full max-w-[360px] h-auto overflow-visible"
        aria-label={`Habits completion gauge: ${clampedToday}% today`}
        role="img"
      >
        <defs>
          {/* Curved text path along the outer halo */}
          <path
            id={arcLabelId}
            d="M 26,152 A 144,144 0 0,1 314,152"
            fill="none"
          />
          {/* Glow filter for 100% conquered dots */}
          <filter id="limeArcHeroGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#CEF431" floodOpacity="0.85" />
          </filter>
        </defs>

        {/* Curved Header Label: TODAY • WEEK • STREAK */}
        <text
          fill="currentColor"
          className="text-[9.5px] font-mono font-black uppercase tracking-[0.25em] text-[#8C8882] dark:text-[#A8A29E] select-none"
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
            r={dot.isFilled ? 5.2 : 4.0}
            fill={dot.isFilled ? "#CEF431" : "rgba(150, 150, 150, 0.22)"}
            stroke={dot.isFilled ? "#161514" : "rgba(150, 150, 150, 0.12)"}
            strokeWidth={dot.isFilled ? (clampedToday === 100 ? 1.6 : 1.2) : 0.8}
            className="transition-all duration-300 motion-reduce:transition-none"
            filter={clampedToday === 100 && dot.isFilled ? "url(#limeArcHeroGlow)" : undefined}
            style={{
              transition: "fill 250ms ease-out, stroke 250ms ease-out, r 250ms ease-out",
            }}
          />
        ))}

        {/* 2. Middle Arc: Weekly Consistency (Malachite Emerald #03D26F) */}
        {middleDots.map((dot) => (
          <circle
            key={`middle-${dot.index}`}
            cx={dot.x}
            cy={dot.y}
            r={dot.isFilled ? 4.5 : 3.4}
            fill={dot.isFilled ? "#03D26F" : "rgba(150, 150, 150, 0.18)"}
            stroke={dot.isFilled ? "#161514" : "rgba(150, 150, 150, 0.08)"}
            strokeWidth={dot.isFilled ? 1.2 : 0.8}
            className="transition-all duration-300 motion-reduce:transition-none"
            style={{
              transition: "fill 250ms ease-out, stroke 250ms ease-out, r 250ms ease-out",
            }}
          />
        ))}

        {/* 3. Inner Arc: Streak Momentum (Amber #F59E0B) */}
        {innerDots.map((dot) => (
          <circle
            key={`inner-${dot.index}`}
            cx={dot.x}
            cy={dot.y}
            r={dot.isFilled ? 3.8 : 2.8}
            fill={dot.isFilled ? "#F59E0B" : "rgba(150, 150, 150, 0.16)"}
            stroke={dot.isFilled ? "#161514" : "rgba(150, 150, 150, 0.08)"}
            strokeWidth={dot.isFilled ? 1.0 : 0.8}
            className="transition-all duration-300 motion-reduce:transition-none"
            style={{
              transition: "fill 250ms ease-out, stroke 250ms ease-out, r 250ms ease-out",
            }}
          />
        ))}

        {/* Center Primary Telemetry Display (Unobstructed, Dominant Focal Point) */}
        <g className="select-none">
          {/* Primary Number: 56-64px bold mono, biggest type on screen */}
          <text
            x={cx}
            y={cy - 12}
            textAnchor="middle"
            fill="currentColor"
            className={cn(
              "text-6xl font-mono font-black tracking-tighter transition-colors select-none",
              clampedToday === 100
                ? "fill-[#CEF431] text-[#CEF431]"
                : "fill-[#161514] text-[#161514] dark:fill-[#FAF8F5] dark:text-[#FAF8F5]"
            )}
            style={{
              fontSize: "58px",
              fontWeight: 900,
            }}
          >
            {clampedToday}
          </text>

          {/* Small Caps Label Beneath Primary Number */}
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            fill="currentColor"
            className={cn(
              "text-xs font-mono font-black uppercase tracking-widest transition-colors select-none",
              clampedToday === 100
                ? "fill-[#03D26F] text-[#03D26F]"
                : "fill-[#8C8882] text-[#8C8882] dark:fill-[#A8A29E] dark:text-[#A8A29E]"
            )}
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.18em",
            }}
          >
            {clampedToday === 100 ? "CONQUERED 🏆" : "% TODAY"}
          </text>
        </g>
      </svg>
    </div>
  );
}
