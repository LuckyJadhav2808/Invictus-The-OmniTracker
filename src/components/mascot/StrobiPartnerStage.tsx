"use client";

import React, { useState } from "react";
import { Sparkles, MessageSquare, Zap, Trophy, Flame } from "lucide-react";
import { StrobiCompanion, type StrobiState, type StrobiGear } from "./StrobiCompanion";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface StrobiPartnerStageProps {
  state?: StrobiState;
  gear?: StrobiGear;
  size?: number; // Default 76px
  moodBadge?: string;
  quip?: string;
  subtitle?: string;
  streakDays?: number;
  onClick?: () => void;
  className?: string;
}

const DEFAULT_QUIPS: Record<StrobiGear, string[]> = {
  gladiator: [
    "Good morning! Win the day with small consistent steps.",
    "Discipline and consistency build lasting habits.",
    "The mind seeks comfort; consistency builds momentum.",
    "One focus block at a time. Steady progress!",
  ],
  fitness: [
    "Discipline beats motivation every single day. Let's get these reps!",
    "Your streak is your foundation. Keep it going!",
    "Small daily habits compound into lasting progress.",
    "Start your day strong by checking off that first habit.",
  ],
  tasks: [
    "Prioritize ruthlessly. Knock out your top priorities first!",
    "Action cures hesitation. Start with the smallest subtask.",
    "Clear checklist, clear mind. Let's clear the queue!",
  ],
  study: [
    "Deep work session active. Lock in and protect your focus block.",
    "Active recall over passive reading. Test your understanding!",
    "25 minutes of unbroken focus is worth 2 hours of distraction.",
  ],
  money: [
    "Every Rupee saved builds financial flexibility.",
    "Stay within your safe daily pace — protect your envelope!",
    "Mindful cashflow beats impulsive spending every time.",
  ],
};

/**
 * 🌟 StrobiPartnerStage (Duolingo & Finch Production Benchmark)
 * An elevated, spacious companion stage where Strobi lives at true production size (72px - 84px),
 * paired with real-time contextual speech dialogue, mood chips, and tactile pet physics.
 */
export function StrobiPartnerStage({
  state = "idle",
  gear = "fitness",
  size = 76,
  moodBadge,
  quip,
  subtitle = "Daily Companion",
  streakDays = 0,
  onClick,
  className,
}: StrobiPartnerStageProps) {
  const [quipCycle, setQuipCycle] = useState(0);

  const gearQuipList = DEFAULT_QUIPS[gear] || DEFAULT_QUIPS.fitness;
  const currentQuip = quip || gearQuipList[quipCycle % gearQuipList.length];

  const handleStageClick = () => {
    soundFX.playBotChirp("happy");
    soundFX.vibrate(20);
    setQuipCycle((prev) => prev + 1);
    if (onClick) onClick();
  };

  const isCelebratory = state === "celebrate";
  const isFiery = state === "fire" || streakDays >= 3;

  const defaultMoodBadge = isCelebratory
    ? "🏆 ALL COMPLETED"
    : isFiery
    ? `🔥 ${streakDays}D STREAK ON FIRE`
    : state === "focus"
    ? "⚡ DEEP FOCUS"
    : state === "sleep"
    ? "😴 REST & RECHARGE"
    : "⚡ READY TO FOCUS";

  return (
    <div
      onClick={handleStageClick}
      role="region"
      aria-label="Strobi Companion Stage"
      className={cn(
        "relative rounded-2xl border-2 border-[#161514] dark:border-[#38332E] p-4 bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_#000000] flex flex-col items-center justify-between gap-3 transition-all cursor-pointer group hover:border-[#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none select-none",
        isCelebratory && "border-[#03D26F] shadow-[3px_3px_0px_0px_#03D26F]",
        className
      )}
    >
      {/* 1. Top Telemetry Pill: Mood Badge & Status */}
      <div className="flex items-center justify-between w-full gap-2">
        <span
          className={cn(
            "text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 shadow-2xs",
            isCelebratory
              ? "bg-[#03D26F] text-[#161514] border-[#161514] animate-pulse"
              : isFiery
              ? "bg-amber-400 text-[#161514] border-[#161514]"
              : "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] border-[#161514]"
          )}
        >
          {isCelebratory ? (
            <Trophy className="size-2.5 stroke-[2.5]" />
          ) : isFiery ? (
            <Flame className="size-2.5 stroke-[2.5]" />
          ) : (
            <Zap className="size-2.5 stroke-[2.5]" />
          )}
          <span>{moodBadge || defaultMoodBadge}</span>
        </span>

        <span className="text-[10px] font-mono font-bold text-muted-foreground flex items-center gap-1 group-hover:text-foreground transition-colors">
          <Sparkles className="size-2.5 text-[#CEF431]" />
          <span>Tap Strobi</span>
        </span>
      </div>

      {/* 2. Center Stage: Free-Standing 3D Strobi Sphere */}
      <div className="relative my-2 flex items-center justify-center">
        <StrobiCompanion
          state={state}
          gear={gear}
          size={size}
          streakDays={streakDays}
          className="group-hover:scale-105 transition-transform"
          onClick={handleStageClick}
        />
      </div>

      {/* 3. Bottom Speech Bubble: Dynamic Dialogue */}
      <div className="relative w-full bg-white dark:bg-[#25221F] border-2 border-[#161514] dark:border-[#38332E] rounded-xl p-2.5 sm:p-3 shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] text-center">
        {/* Speech Bubble Pointer Arrow */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 size-2.5 bg-white dark:bg-[#25221F] border-t-2 border-l-2 border-[#161514] dark:border-[#38332E] rotate-45" />

        <p className="text-xs font-heading font-black text-foreground leading-snug tracking-tight">
          &ldquo;{currentQuip}&rdquo;
        </p>
      </div>
    </div>
  );
}
