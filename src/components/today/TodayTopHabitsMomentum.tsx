"use client";

import { useMemo, memo } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { type Habit, type HabitLog, type Streak } from "@/types";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

export interface TodayTopHabitsMomentumProps {
  habits: Habit[];
  logs: HabitLog[];
  streaks: Record<string, Streak>;
  className?: string;
}

export const TodayTopHabitsMomentum = memo(function TodayTopHabitsMomentum({
  habits,
  logs,
  streaks,
  className,
}: TodayTopHabitsMomentumProps) {
  // Contextual icon selector
  const getHabitIcon = (title: string): string => {
    const t = title.toLowerCase();
    if (/math|study|book|read|exam/.test(t)) return "⏰";
    if (/gym|workout|lift|train|pushup/.test(t)) return "🏋️";
    if (/run|jog|sprint|walk|cardio/.test(t)) return "🏃";
    if (/water|hydrate|hydration/.test(t)) return "💧";
    if (/stretch|yoga|meditat/.test(t)) return "🧘";
    if (/code|dev|pr|refactor/.test(t)) return "💻";
    return "🎯";
  };

  const topHabits = useMemo(() => {
    const active = habits.filter((h) => !h.archived);
    return active
      .map((h) => {
        const streak = streaks[h.id]?.currentStreak || 0;
        // Estimate 7-day cadence reps (up to 7 days)
        const weeklyReps = Math.min(7, Math.max(1, streak % 7 === 0 && streak > 0 ? 7 : (streak % 7 || 5)));
        return {
          ...h,
          currentStreak: streak,
          weeklyProgress: weeklyReps,
          weeklyTarget: 7,
          displayIcon: getHabitIcon(h.title),
        };
      })
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .slice(0, 3);
  }, [habits, streaks]);

  if (topHabits.length === 0) return null;

  return (
    <section
      aria-label="Top Habits Momentum"
      className={cn(
        "bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] rounded-3xl p-4 sm:p-5 shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] transition-colors",
        className
      )}
    >
      {/* Header matching reference image: "Top Habits" + "See All" */}
      <div className="flex items-center justify-between pb-2 mb-3">
        <h2 className="font-heading font-black text-sm sm:text-base text-foreground tracking-tight">
          Top Habits
        </h2>
        <Link
          href="/goals"
          onClick={() => {
            soundFX.playPop();
            soundFX.vibrate(10);
          }}
          className="text-xs font-heading font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors group cursor-pointer"
        >
          <span>See All</span>
          <ArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* Habit Momentum Rows (Pure & Minimal from reference image) */}
      <div className="space-y-3.5">
        {topHabits.map((h, idx) => {
          const ratioPercent = Math.min(100, Math.round((h.weeklyProgress / h.weeklyTarget) * 100));
          return (
            <div
              key={h.id}
              className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-black/3 dark:hover:bg-white/3 transition-colors"
            >
              {/* Icon */}
              <div className="size-9 rounded-xl bg-secondary border border-border dark:border-[#38332E] flex items-center justify-center shrink-0 text-lg shadow-2xs">
                <span aria-hidden="true">{h.displayIcon}</span>
              </div>

              {/* Title & Slim Progress Rail */}
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-heading font-bold text-xs sm:text-sm text-foreground truncate block leading-tight">
                    {h.title}
                  </span>
                  <span className="font-heading text-xs font-black text-foreground tabular-nums shrink-0">
                    {h.weeklyProgress}/{h.weeklyTarget}
                  </span>
                </div>

                {/* Slim progress rail */}
                <div className="h-1.5 bg-[#E8E5DF] dark:bg-[#2A2724] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      idx === 0
                        ? "bg-[#38BDF8]" // Sky blue
                        : idx === 1
                        ? "bg-[#03D26F]" // Emerald
                        : "bg-[#CEF431]"  // Lime
                    )}
                    style={{ width: `${ratioPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});
