'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CheckSquare, Check, Flame, ArrowRight, Plus, Droplets } from 'lucide-react';
import { type Habit, type HabitLog } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HabitMomentumCardProps {
  habits: Habit[];
  logs: HabitLog[];
  streaks: Record<string, { currentStreak: number; longestStreak: number }>;
  onToggleHabit: (habitId: string, completed: boolean) => void;
  selectedDate: string;
  waterAmount?: number;
  waterTarget?: number;
  onQuickLogWater?: () => void;
  className?: string;
}

export function HabitMomentumCard({
  habits,
  logs,
  streaks,
  onToggleHabit,
  selectedDate,
  waterAmount,
  waterTarget = 2000,
  onQuickLogWater,
  className,
}: HabitMomentumCardProps) {
  const [habitFilter, setHabitFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const activeHabitIds = useMemo(() => new Set(activeHabits.map((h) => h.id)), [activeHabits]);
  
  const completedHabitLogs = useMemo(
    () => logs.filter((l) => activeHabitIds.has(l.habitId) && l.completed),
    [logs, activeHabitIds]
  );

  const totalCount = activeHabits.length;
  const completedCount = completedHabitLogs.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredHabits = useMemo(() => {
    return activeHabits.filter((h) => {
      const isDone = logs.some((l) => l.habitId === h.id && l.completed);
      if (habitFilter === 'pending') return !isDone;
      if (habitFilter === 'completed') return isDone;
      return true;
    });
  }, [activeHabits, logs, habitFilter]);

  return (
    <div
      id="habits-section"
      className={cn(
        "bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] p-5 rounded-xl flex flex-col justify-between space-y-4",
        className
      )}
    >
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E5DF] dark:border-[#383531] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-[#F1EFEA] dark:bg-[#252321] flex items-center justify-center text-[#161514] dark:text-[#CEF431] shrink-0 border border-[#E8E5DF] dark:border-[#383531]">
            <CheckSquare className="size-3.5 stroke-[1.5]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-sans font-semibold text-[15px] text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                Habit Momentum
              </h2>
              {percent === 100 && totalCount > 0 ? (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#DCFAE5] dark:bg-[#03D26F]/20 text-[#04250e] dark:text-[#03D26F] border border-[#03D26F]/30">
                  Completed
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#F1EFEA] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] tabular-nums border border-[#E8E5DF] dark:border-[#383531]">
                  {percent}%
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] mt-0.5">
              <span className="font-semibold text-[#161514] dark:text-[#FAF8F5] tabular-nums">{completedCount}</span> of <span className="tabular-nums">{totalCount}</span> completed today
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-0.5 bg-[#F1EFEA] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] rounded-lg self-start sm:self-auto">
          {(['all', 'pending', 'completed'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setHabitFilter(mode)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded capitalize transition-colors cursor-pointer',
                habitFilter === mode
                  ? 'bg-white dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] shadow-sm font-semibold'
                  : 'text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5]'
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Hydration Bar */}
      {typeof waterAmount === 'number' && (
        <div className="bg-[#FBF9F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] p-3 rounded-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-7 rounded-lg bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531] flex items-center justify-center shrink-0 text-[#161514] dark:text-[#FAF8F5]">
              <Droplets className="size-3.5 stroke-[1.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-[#161514] dark:text-[#FAF8F5]">Daily Hydration</span>
                <span className="text-xs font-mono text-[#6B6B6B] dark:text-[#A8A29E] tabular-nums">
                  {waterAmount} / {waterTarget} ml ({Math.min(100, Math.round((waterAmount / waterTarget) * 100))}%)
                </span>
              </div>
              <div className="w-28 sm:w-44 h-1.5 bg-[#E8E5DF] dark:bg-[#383531] rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-[#161514] dark:bg-[#03D26F] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((waterAmount / waterTarget) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {onQuickLogWater && (
            <button
              type="button"
              onClick={onQuickLogWater}
              className="px-2.5 py-1 min-h-[34px] rounded-lg bg-white dark:bg-[#1C1A18] hover:bg-[#F5F3EF] dark:hover:bg-[#2A2724] border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors active:translate-y-px shrink-0"
              title="Quick log 250ml glass of water"
            >
              <Plus className="size-3 stroke-[1.5]" />
              <span className="font-mono tabular-nums">250ml</span>
            </button>
          )}
        </div>
      )}

      {/* Habit Items List */}
      {filteredHabits.length === 0 ? (
        <div className="p-8 text-center space-y-3 bg-[#FBF9F5] dark:bg-[#252321] border border-dashed border-[#E8E5DF] dark:border-[#383531] rounded-xl">
          <CheckSquare className="size-8 mx-auto text-[#6B6B6B]/40 dark:text-[#A8A29E]/40" />
          <div className="space-y-1">
            <p className="font-medium text-sm text-[#161514] dark:text-[#FAF8F5]">
              {habitFilter === 'completed'
                ? 'No completed habits yet.'
                : habitFilter === 'pending'
                ? 'All pending habits cleared!'
                : 'No habits scheduled for today.'}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/goals">
              <Plus className="size-3.5" />
              <span>Manage Habits</span>
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto max-h-[300px] sm:max-h-[320px] space-y-2 pr-1 scrollbar-thin">
          {filteredHabits.map((habit) => {
            const isDone = logs.some((l) => l.habitId === habit.id && l.completed);
            const streakData = streaks[habit.id];

            return (
              <div
                key={habit.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border border-[#E8E5DF] dark:border-[#383531] transition-colors',
                  isDone
                    ? 'bg-[#F9FAF9] dark:bg-[#1C1A18]/60 opacity-80'
                    : 'bg-white dark:bg-[#252321] hover:bg-[#FBF9F5] dark:hover:bg-[#2A2724]'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Checkbox button */}
                  <button
                    onClick={() => onToggleHabit(habit.id, !isDone)}
                    aria-label={isDone ? `Mark ${habit.title} incomplete` : `Mark ${habit.title} complete`}
                    className={cn(
                      'size-7 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer active:translate-y-px',
                      isDone
                        ? 'bg-[#03D26F] border-[#03D26F] text-white dark:text-[#161514]'
                        : 'bg-white dark:bg-[#1C1A18] border-[#D1D5DB] dark:border-[#383531] hover:bg-[#F1EFEA] dark:hover:bg-[#2A2724]'
                    )}
                  >
                    {isDone && <Check className="size-3.5 stroke-[2.5]" />}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={cn(
                        'font-medium text-sm truncate text-[#161514] dark:text-[#FAF8F5]',
                        isDone && 'line-through text-[#6B6B6B] dark:text-[#A8A29E]'
                      )}
                    >
                      {habit.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-[#6B6B6B] dark:text-[#A8A29E]">
                      <span className="capitalize">
                        {habit.frequency?.type === 'customDays' ? 'Custom Schedule' : (habit.frequency?.type || 'Daily')}
                      </span>
                      {streakData?.currentStreak > 0 && (
                        <span className="flex items-center gap-0.5 text-orange-600 dark:text-orange-400 font-medium">
                          <Flame className="size-3 fill-orange-500" />
                          {streakData.currentStreak}d
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-mono font-medium',
                    isDone ? 'bg-[#DCFAE5] dark:bg-[#03D26F]/20 text-[#04250e] dark:text-[#03D26F]' : 'bg-[#F1EFEA] dark:bg-[#1C1A18] text-[#6B6B6B] dark:text-[#A8A29E]'
                  )}
                >
                  {isDone ? 'Done' : 'Due'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
