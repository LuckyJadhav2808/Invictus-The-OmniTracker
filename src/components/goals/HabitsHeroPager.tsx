"use client";

import React, { useState, useRef, useMemo } from "react";
import { Flame, ShieldCheck, Trophy, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { BeadedAmphitheaterArcGauge } from "./BeadedAmphitheaterArcGauge";
import { StrobiCompanion } from "@/components/mascot/StrobiCompanion";

export interface HabitsHeroPagerProps {
  dailyCompletionPercent: number;
  weeklyAveragePercent: number;
  longestStreakValue: number;
  streakTarget?: number;
  streakFreeze: {
    tokensAvailable: number;
    frozenDates: string[];
    lastMonthlyCredit?: string;
  };
  completedCount: number;
  dueCount: number;
  userLevel?: number;
  totalXP?: number;
  onOpenShieldInfo: () => void;
  onOpenNewHabit?: () => void;
  className?: string;
}

export function HabitsHeroPager({
  dailyCompletionPercent = 0,
  weeklyAveragePercent = 85,
  longestStreakValue = 0,
  streakTarget = 14,
  streakFreeze,
  completedCount = 0,
  dueCount = 0,
  userLevel = 1,
  totalXP = 100,
  onOpenShieldInfo,
  className,
}: HabitsHeroPagerProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);

  const streakPercent = Math.min(100, Math.round((longestStreakValue / streakTarget) * 100));
  const isConquered = dueCount > 0 && completedCount >= dueCount;

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
    }
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null) return;
    const delta = touchDeltaXRef.current;
    const threshold = 35;

    if (delta < -threshold && activeSlide < 2) {
      soundFX.playPop();
      soundFX.vibrate(12);
      setActiveSlide((prev) => prev + 1);
    } else if (delta > threshold && activeSlide > 0) {
      soundFX.playPop();
      soundFX.vibrate(12);
      setActiveSlide((prev) => prev - 1);
    }

    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  };

  return (
    <div
      role="region"
      aria-label="Habits Momentum Carousel"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        "relative bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] rounded-3xl p-3 shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_#000000] select-none overflow-hidden transition-all flex flex-col justify-between h-[175px]",
        isConquered && "border-[#03D26F] dark:border-[#03D26F]",
        className
      )}
    >
      {/* Top Header Chips Row: Level & XP (Left) + Cryo-Shield (Right) */}
      <div className="flex items-center justify-between gap-2 shrink-0 z-10 px-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] shadow-2xs">
            Lvl {userLevel}
          </span>
          <span className="text-[10px] font-mono font-bold text-muted-foreground">
            {totalXP} XP
          </span>
        </div>

        {/* Cryo-Shield Inventory Pill */}
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            onOpenShieldInfo();
          }}
          className={cn(
            "px-2 py-0.5 rounded-md border text-[10px] font-mono font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs",
            streakFreeze.tokensAvailable > 0
              ? "bg-[#DCFAE5] text-[#047857] border-[#047857]/30 dark:bg-[#03D26F]/20 dark:text-[#03D26F]"
              : "bg-amber-100 text-amber-900 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300"
          )}
          title="Cryo-Shield Vault details"
        >
          <ShieldCheck className="size-3 stroke-[2.2]" />
          <span>{streakFreeze.tokensAvailable}/2 Shields</span>
        </button>
      </div>

      {/* Slide Body (Fixed ~110px Area) */}
      <div className="relative flex-1 flex items-center justify-center my-1">
        {/* ================= SLIDE 0: TODAY CONQUEST GAUGE ================= */}
        <div
          className={cn(
            "w-full h-full transition-all duration-200 ease-out flex items-center justify-between px-2",
            activeSlide === 0
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-95 pointer-events-none absolute inset-0"
          )}
          style={{ willChange: "transform, opacity" }}
        >
          {/* Arc Gauge */}
          <div className="flex-1 flex justify-center max-w-[170px] sm:max-w-[220px]">
            <BeadedAmphitheaterArcGauge
              todayPercent={dailyCompletionPercent}
              weekPercent={weeklyAveragePercent}
              streakPercent={streakPercent}
              className="scale-[0.75] origin-center -my-3"
            />
          </div>

          {/* Strobi Avatar in Corner + Single-Line Telemetry */}
          <div className="flex flex-col items-center text-center space-y-1 shrink-0 pr-1">
            <div className="relative">
              <StrobiCompanion
                state={isConquered ? "celebrate" : longestStreakValue >= 3 ? "fire" : "idle"}
                gear="fitness"
                size={38}
                streakDays={longestStreakValue}
                className="cursor-pointer active:scale-95 transition-transform"
              />
            </div>

            <span
              className={cn(
                "text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full border shadow-2xs",
                isConquered
                  ? "bg-[#03D26F] text-[#161514] border-[#161514]"
                  : "bg-secondary text-foreground border-border"
              )}
            >
              {isConquered ? "Conquered ⚡" : `${completedCount}/${dueCount} Reps Done`}
            </span>
          </div>
        </div>

        {/* ================= SLIDE 1: WEEKLY VELOCITY ================= */}
        <div
          className={cn(
            "w-full h-full transition-all duration-200 ease-out flex flex-col justify-center px-3 space-y-2",
            activeSlide === 1
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-95 pointer-events-none absolute inset-0"
          )}
          style={{ willChange: "transform, opacity" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-[#03D26F] stroke-[2.5]" />
              <span className="text-xs font-heading font-black text-foreground">
                Weekly Velocity
              </span>
            </div>
            <span className="text-xs font-mono font-black text-[#03D26F]">
              {weeklyAveragePercent}% Average
            </span>
          </div>

          {/* 7 Daily Velocity Bars */}
          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {Array.from({ length: 7 }).map((_, idx) => {
              const isFilled = idx < Math.round((weeklyAveragePercent / 100) * 7);
              const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
              return (
                <div key={`hero-bar-${idx}`} className="flex flex-col items-center gap-0.5">
                  <div
                    className={cn(
                      "w-full h-5 rounded-sm border transition-all",
                      isFilled
                        ? "bg-[#03D26F] border-[#161514]/40 dark:border-black"
                        : "bg-muted border-border"
                    )}
                  />
                  <span className="text-[8px] font-mono font-bold text-muted-foreground">
                    {dayLabels[idx]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= SLIDE 2: STREAK & FLAME ================= */}
        <div
          className={cn(
            "w-full h-full transition-all duration-200 ease-out flex items-center justify-around px-3",
            activeSlide === 2
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-95 pointer-events-none absolute inset-0"
          )}
          style={{ willChange: "transform, opacity" }}
        >
          {/* Flame Card */}
          <div className="text-center space-y-1">
            <div className="size-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-500">
              <Flame className="size-5 fill-orange-500" />
            </div>
            <div className="font-mono font-black text-sm text-foreground">
              {longestStreakValue} Days
            </div>
            <div className="text-[9px] font-mono text-muted-foreground">
              Best Active Streak
            </div>
          </div>

          {/* Shield Status */}
          <div className="text-center space-y-1">
            <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center mx-auto text-[#03D26F]">
              <ShieldCheck className="size-5 stroke-[2.5]" />
            </div>
            <div className="font-mono font-black text-sm text-foreground">
              Auto-Armed
            </div>
            <div className="text-[9px] font-mono text-muted-foreground">
              Refills 1st of month
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Pager Dots Indicator */}
      <div className="flex items-center justify-center gap-1.5 shrink-0 pt-0.5">
        {[0, 1, 2].map((idx) => (
          <button
            key={`dot-${idx}`}
            type="button"
            onClick={() => {
              soundFX.playPop();
              setActiveSlide(idx);
            }}
            className={cn(
              "h-1.5 rounded-full transition-all cursor-pointer",
              activeSlide === idx
                ? "w-5 bg-[#161514] dark:bg-[#CEF431]"
                : "w-1.5 bg-[#161514]/20 dark:bg-white/20 hover:bg-[#161514]/40"
            )}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
