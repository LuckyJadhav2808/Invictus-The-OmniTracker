"use client";

import React, { useState } from "react";
import { Flame, ShieldCheck, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { Hero, HeroSlide, HeroStatItem } from "@/components/shared/Hero";
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

  const streakPercent = Math.min(100, Math.round((longestStreakValue / streakTarget) * 100));
  const isConquered = dueCount > 0 && completedCount >= dueCount;

  // Top Left Chip: Lvl + XP
  const topLeft = (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] shadow-xs">
        Lvl {userLevel}
      </span>
      <span className="text-[10px] font-mono font-bold text-muted-foreground">
        {totalXP} XP
      </span>
    </div>
  );

  // Top Right Group: Shields Pill + Strobi Companion Avatar
  const topRight = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          soundFX.playPop();
          onOpenShieldInfo();
        }}
        className={cn(
          "px-2 py-0.5 rounded-md border text-[10px] font-mono font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs",
          streakFreeze.tokensAvailable > 0
            ? "bg-[#DCFAE5] text-[#047857] border-[#047857]/30 dark:bg-[#03D26F]/20 dark:text-[#03D26F]"
            : "bg-amber-100 text-amber-900 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300"
        )}
        title="Cryo-Shield Vault details"
        aria-label={`Cryo-Shield Vault: ${streakFreeze.tokensAvailable} of 2 shields available`}
      >
        <ShieldCheck className="size-3 stroke-[2.2]" />
        <span>{streakFreeze.tokensAvailable}/2 Shields</span>
      </button>

      {/* Strobi Companion Avatar in Corner (Avatar size, does NOT overlap arc) */}
      <StrobiCompanion
        state={isConquered ? "celebrate" : longestStreakValue >= 3 ? "fire" : "idle"}
        gear="fitness"
        size={26}
        streakDays={longestStreakValue}
        className="cursor-pointer active:scale-90 transition-transform shrink-0"
      />
    </div>
  );

  // Slide 0: Today Beaded Arc Gauge (Full-width, large, focal point)
  const slideGauge = (
    <div className="w-full flex flex-col items-center justify-center">
      <BeadedAmphitheaterArcGauge
        todayPercent={dailyCompletionPercent}
        weekPercent={weeklyAveragePercent}
        streakPercent={streakPercent}
      />
    </div>
  );

  // Slide 1: Weekly Consistency & Velocity (Full-width, borderless)
  const slideWeek = (
    <div className="w-full flex flex-col items-center justify-center py-2 space-y-2 select-none">
      <div className="text-center">
        <div className="text-5xl sm:text-6xl font-mono font-black tracking-tight text-[#03D26F]">
          {weeklyAveragePercent}%
        </div>
        <div className="text-[11px] font-mono font-black uppercase tracking-widest text-[#8C8882] dark:text-[#A8A29E] mt-1">
          WEEKLY VELOCITY
        </div>
      </div>

      {/* 7 Day Velocity Bars */}
      <div className="w-full max-w-[280px] grid grid-cols-7 gap-1.5 pt-1.5">
        {Array.from({ length: 7 }).map((_, idx) => {
          const isFilled = idx < Math.round((weeklyAveragePercent / 100) * 7);
          const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
          return (
            <div key={`hero-week-bar-${idx}`} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-full h-8 rounded-sm border transition-all duration-300",
                  isFilled
                    ? "bg-[#03D26F] border-[#161514] dark:border-black"
                    : "bg-secondary dark:bg-[#252321] border-border"
                )}
              />
              <span className="text-[9px] font-mono font-bold text-muted-foreground">
                {dayLabels[idx]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Slide 2: Active Streak & Protection (Full-width, borderless)
  const slideStreak = (
    <div className="w-full flex flex-col items-center justify-center py-2 space-y-2 select-none">
      <div className="text-center">
        <div className="text-5xl sm:text-6xl font-mono font-black tracking-tight text-amber-500 flex items-center justify-center gap-1">
          <span>{longestStreakValue}</span>
          <span className="text-2xl sm:text-3xl font-heading font-black text-foreground">DAYS</span>
        </div>
        <div className="text-[11px] font-mono font-black uppercase tracking-widest text-[#8C8882] dark:text-[#A8A29E] mt-1">
          ACTIVE DISCIPLINE STREAK
        </div>
      </div>

      <div className="flex items-center gap-4 pt-1">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-muted-foreground">
          <Flame className="size-4 text-amber-500 fill-amber-500 shrink-0" />
          <span>Target: {streakTarget} Days</span>
        </div>
        <span className="text-muted-foreground">•</span>
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-muted-foreground">
          <ShieldCheck className="size-4 text-[#03D26F] shrink-0" />
          <span>{streakFreeze.tokensAvailable}/2 Cryo Armed</span>
        </div>
      </div>
    </div>
  );

  const slides: HeroSlide[] = [
    { id: "today-gauge", title: "Today Arc Gauge", content: slideGauge },
    { id: "week-bars", title: "Weekly Velocity", content: slideWeek },
    { id: "streak-shield", title: "Streak Momentum", content: slideStreak },
  ];

  // Stats Row: 2 columns separated by hairline vertical divider, no cards
  const stats: HeroStatItem[] = [
    {
      id: "stat-week",
      icon: <TrendingUp className="size-3.5 text-[#03D26F]" />,
      label: "THIS WEEK",
      value: `${weeklyAveragePercent}% avg`,
      progressPercent: weeklyAveragePercent,
      progressColor: "bg-[#03D26F]",
    },
    {
      id: "stat-streak",
      icon: <Flame className="size-3.5 text-amber-500 fill-amber-500" />,
      label: "STREAK",
      value: `${longestStreakValue}d streak`,
      progressPercent: streakPercent,
      progressColor: "bg-[#F59E0B]",
    },
  ];

  return (
    <Hero
      variant="gauge"
      slides={slides}
      stats={stats}
      topLeft={topLeft}
      topRight={topRight}
      activeSlideIndex={activeSlide}
      onSlideChange={setActiveSlide}
      className={className}
    />
  );
}
