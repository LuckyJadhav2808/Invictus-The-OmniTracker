"use client";

import { useState } from "react";
import { Flame, ShieldCheck, Wallet, Plus, CheckCircle2 } from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { Hero, HeroSlide, HeroStatItem } from "@/components/shared/Hero";
import { StrobiCompanion, type StrobiState } from "@/components/mascot/StrobiCompanion";
import { NumberTicker } from "@/components/ui/number-ticker";

export interface TodayHeroPagerProps {
  userName?: string;
  completionPercent: number;
  completedCount: number;
  totalCount: number;
  streakDays: number;
  streakFreezeTokens: number;
  allHabitsConquered: boolean;
  remainingSafeToSpend: number;
  spentToday: number;
  dailySafeToSpend: number;
  currencySymbol: string;
  strobiState?: StrobiState;
  onOpenQuickExpense: () => void;
  onOpenShieldInfo?: () => void;
  className?: string;
}

export function TodayHeroPager({
  userName,
  completionPercent = 0,
  completedCount = 0,
  totalCount = 0,
  streakDays = 0,
  streakFreezeTokens = 0,
  allHabitsConquered = false,
  remainingSafeToSpend = 0,
  spentToday = 0,
  dailySafeToSpend = 0,
  currencySymbol = "₹",
  strobiState = "idle",
  onOpenQuickExpense,
  onOpenShieldInfo,
  className,
}: TodayHeroPagerProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  const displayName = userName?.trim() ? userName.split(" ")[0] : "Friend";
  const pendingCount = Math.max(0, totalCount - completedCount);

  // Top Left: Greeting + Compact Status
  const topLeft = (
    <div className="flex items-center gap-1.5">
      <span className="font-heading font-black text-sm text-foreground tracking-tight">
        Hey, {displayName} 👋
      </span>
    </div>
  );

  // Top Right: Shields Pill + Strobi Ambient Avatar
  const topRight = (
    <div className="flex items-center gap-2">
      {streakFreezeTokens > 0 && (
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            onOpenShieldInfo?.();
          }}
          className="px-2 py-0.5 rounded-md border text-[10px] font-mono font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs bg-[#DCFAE5] text-[#047857] border-[#047857]/30 dark:bg-[#03D26F]/20 dark:text-[#03D26F]"
          title="Cryo-Shield Vault details"
          aria-label={`Cryo-Shield Vault: ${streakFreezeTokens} shields active`}
        >
          <ShieldCheck className="size-3 stroke-[2.2]" />
          <span>{streakFreezeTokens}/2</span>
        </button>
      )}

      {/* Strobi Companion Avatar in Corner only when empty, guides first daily items */}
      {totalCount === 0 && (
        <StrobiCompanion
          state={strobiState}
          gear="gladiator"
          size={28}
          streakDays={streakDays}
          className="cursor-pointer active:scale-90 transition-transform shrink-0"
        />
      )}
    </div>
  );

  // Slide 0: Daily Conquest Score & Geometric Progress Ring
  const slideConquest = (
    <div className="w-full flex flex-col items-center justify-center py-1">
      {/* Dynamic Circular Progress Display */}
      <div className="relative flex items-center justify-center size-36 sm:size-40 select-none">
        <svg className="size-full -rotate-90" viewBox="0 0 100 100">
          {/* Background Track */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="6"
            className="text-[#161514]/10 dark:text-white/10"
          />
          {/* Active Accent Gauge */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke="#03D26F"
            strokeWidth="6.5"
            strokeDasharray={263.89}
            strokeDashoffset={263.89 - (263.89 * Math.min(100, Math.max(0, completionPercent))) / 100}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Primary Metric */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-heading font-black text-4xl sm:text-5xl text-foreground tracking-tight tabular-nums leading-none">
            <NumberTicker value={completionPercent} suffix="%" duration={350} />
          </span>
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-muted-foreground mt-1">
            CONQUERED
          </span>
        </div>
      </div>

      {/* Punchy Coach Directive */}
      <p className="font-heading font-bold text-xs sm:text-sm text-foreground text-center mt-2 px-4 line-clamp-1">
        {strobiState === "celebrate"
          ? "🎉 All daily objectives conquered! Great discipline."
          : pendingCount > 0
          ? `${pendingCount} ${pendingCount === 1 ? "objective" : "objectives"} remaining today.`
          : "Ready when you are. Check off your first task!"}
      </p>
    </div>
  );

  // Slide 1: Safe-to-Spend Daily Cash Flow
  const slideSafeSpend = (
    <div className="w-full flex flex-col items-center justify-center py-2 text-center">
      <div className="size-10 rounded-2xl bg-[#DCFAE5] dark:bg-[#03D26F]/20 text-[#047857] dark:text-[#03D26F] flex items-center justify-center mb-1 shadow-2xs">
        <Wallet className="size-5 stroke-[2.2]" />
      </div>
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
        SAFE TO SPEND TODAY
      </span>
      <span className="font-heading font-black text-3xl sm:text-4xl text-foreground tracking-tight tabular-nums mt-0.5">
        <NumberTicker
          value={Math.max(0, remainingSafeToSpend)}
          prefix={currencySymbol}
          duration={350}
        />
      </span>
      <p className="text-xs font-mono font-medium text-muted-foreground mt-1">
        {spentToday > 0
          ? `Spent ${currencySymbol}${spentToday.toLocaleString()} of ${currencySymbol}${dailySafeToSpend.toLocaleString()} limit`
          : `Full daily budget of ${currencySymbol}${dailySafeToSpend.toLocaleString()} preserved`}
      </p>
      <button
        type="button"
        onClick={() => {
          soundFX.playPop();
          soundFX.vibrate(15);
          onOpenQuickExpense();
        }}
        className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-[#161514] dark:border-[#CEF431] bg-[#CEF431] text-[#161514] font-heading font-black text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
      >
        <Plus className="size-3.5 stroke-[2.5]" />
        <span>Quick Expense</span>
      </button>
    </div>
  );

  // Slide 2: Active Streaks & Cryo-Shields Momentum
  const slideStreaks = (
    <div className="w-full flex flex-col items-center justify-center py-2 text-center">
      <div className="size-10 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-1 shadow-2xs">
        <Flame className="size-5 stroke-[2.2] fill-amber-500 text-amber-500" />
      </div>
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
        ACTIVE MOMENTUM STREAK
      </span>
      <span className="font-heading font-black text-3xl sm:text-4xl text-foreground tracking-tight tabular-nums mt-0.5">
        {streakDays} Days 🔥
      </span>
      <p className="text-xs font-mono font-medium text-muted-foreground mt-1">
        {streakFreezeTokens > 0
          ? `${streakFreezeTokens} Cryo-Shield${streakFreezeTokens > 1 ? "s" : ""} active • Auto-protects missed days`
          : "Complete all daily habits to extend your active streak"}
      </p>
    </div>
  );

  const slides: HeroSlide[] = [
    { id: "conquest", content: slideConquest },
    { id: "safe-spend", content: slideSafeSpend },
    { id: "streaks", content: slideStreaks },
  ];

  // Stats row beneath hero: 3 columns with subtle hairlines
  const stats: HeroStatItem[] = [
    {
      id: "progress",
      icon: <CheckCircle2 className="size-3.5 text-[#03D26F]" />,
      label: "PROGRESS",
      shortLabel: "PROG",
      value: `${completedCount}/${totalCount}`,
      subValue: `${completionPercent}%`,
      progressPercent: completionPercent,
      progressColor: "bg-[#03D26F]",
    },
    {
      id: "safe-spend",
      icon: <Wallet className="size-3.5 text-blue-500" />,
      label: "SAFE",
      shortLabel: "SAFE",
      value: `${currencySymbol}${Math.max(0, remainingSafeToSpend).toLocaleString()}`,
      subValue: spentToday > 0 ? `-${currencySymbol}${spentToday}` : "Clear",
      progressPercent:
        dailySafeToSpend > 0
          ? Math.min(100, Math.max(0, Math.round((remainingSafeToSpend / dailySafeToSpend) * 100)))
          : remainingSafeToSpend > 0
          ? 100
          : 0,
      progressColor: "bg-blue-500",
      onClick: onOpenQuickExpense,
    },
    {
      id: "streak",
      icon: <Flame className="size-3.5 text-orange-500 fill-orange-500" />,
      label: "STREAK",
      shortLabel: "STREAK",
      value: `${streakDays}d`,
      subValue: streakFreezeTokens > 0 ? `${streakFreezeTokens} 🛡️` : "Active",
      progressPercent: Math.min(
        100,
        Math.max(10, Math.round(((streakDays % 7 || (streakDays > 0 ? 7 : 1)) / 7) * 100))
      ),
      progressColor: "bg-orange-500",
      onClick: onOpenShieldInfo,
    },
  ];

  return (
    <Hero
      variant="ring"
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
