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

  // SVG Circular Ring calculation
  const ringRadius = 26;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div id="habits-section" className="bg-white border-2 border-[#161514] p-5 rounded-xl shadow-[3px_3px_0px_#161514] space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#161514]/15 pb-3">
        <div className="flex items-center gap-3">
          {/* Circular Progress Gauge */}
          <div className="relative size-14 shrink-0 flex items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 60 60">
              <circle
                cx="30"
                cy="30"
                r={ringRadius}
                fill="none"
                stroke="#F1EFEA"
                strokeWidth="6"
              />
              <circle
                cx="30"
                cy="30"
                r={ringRadius}
                fill="none"
                stroke={percent === 100 ? '#03D26F' : '#CEF431'}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <span className="absolute font-mono font-black text-xs text-[#161514]">
              {percent}%
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-black text-base text-[#161514] tracking-tight">
                Habit Momentum
              </h2>
              {percent === 100 && totalCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-heading font-black bg-[#03D26F] text-[#161514] border border-[#161514]">
                  CONQUERED
                </span>
              )}
            </div>
            <p className="text-xs text-[#161514]/70 font-medium">
              {completedCount} of {totalCount} completed for today
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-0.5 bg-[#F1EFEA] border-2 border-[#161514] rounded-lg self-start sm:self-auto">
          {(['all', 'pending', 'completed'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setHabitFilter(mode)}
              className={cn(
                'px-2.5 py-1 text-[11px] font-heading font-black rounded capitalize transition-all cursor-pointer',
                habitFilter === mode
                  ? 'bg-white text-[#161514] border border-[#161514] shadow-[1px_1px_0px_#161514]'
                  : 'text-[#161514]/65 hover:text-[#161514]'
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Hydration Velocity Bar (Synchronized with Life / Goals Space) */}
      {typeof waterAmount === 'number' && (
        <div className="bg-[#FAF8F5] border-2 border-[#161514] p-3 rounded-xl flex items-center justify-between gap-3 shadow-[1.5px_1.5px_0px_#161514]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-lg bg-sky-200 border-2 border-[#161514] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#161514]">
              <Droplets className="size-4 text-sky-800 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading font-black text-xs text-[#161514]">Daily Hydration</span>
                <span className="text-[10px] font-mono font-bold text-[#161514]/70">
                  {waterAmount} / {waterTarget} ml ({Math.min(100, Math.round((waterAmount / waterTarget) * 100))}%)
                </span>
              </div>
              <div className="w-28 sm:w-44 h-2 bg-white rounded-full border border-[#161514] overflow-hidden mt-1">
                <div
                  className="h-full bg-sky-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((waterAmount / waterTarget) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {onQuickLogWater && (
            <button
              type="button"
              onClick={onQuickLogWater}
              className="px-2.5 py-1.5 rounded-lg bg-sky-300 hover:bg-sky-400 active:scale-95 text-[#161514] font-heading font-black text-[11px] border-2 border-[#161514] shadow-[1px_1px_0px_#161514] flex items-center gap-1 cursor-pointer transition-all shrink-0"
              title="Quick log 250ml glass of water"
            >
              <Plus className="size-3 stroke-[3]" />
              <span>250ml 💧</span>
            </button>
          )}
        </div>
      )}

      {/* Habit Items List */}
      {filteredHabits.length === 0 ? (
        <div className="p-8 text-center space-y-3 bg-[#FBF9F5] border-2 border-dashed border-[#161514]/25 rounded-xl">
          <CheckSquare className="size-8 mx-auto text-[#161514]/40" />
          <div className="space-y-1">
            <p className="font-heading font-extrabold text-sm text-[#161514]">
              {habitFilter === 'completed'
                ? 'No completed habits yet.'
                : habitFilter === 'pending'
                ? 'All pending habits cleared!'
                : 'No habits scheduled for today.'}
            </p>
            <p className="text-xs text-[#161514]/60">
              Keep your streak alive by logging consistent actions.
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
        <div className="space-y-2.5">
          {filteredHabits.map((habit) => {
            const isDone = logs.some((l) => l.habitId === habit.id && l.completed);
            const streakData = streaks[habit.id];

            return (
              <div
                key={habit.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border-2 border-[#161514] transition-all',
                  isDone
                    ? 'bg-emerald-50/70 border-[#161514] opacity-90 shadow-none'
                    : 'bg-white shadow-[2px_2px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Ergonomic 44px min-touch completion button */}
                  <button
                    onClick={() => onToggleHabit(habit.id, !isDone)}
                    aria-label={isDone ? `Mark ${habit.title} incomplete` : `Mark ${habit.title} complete`}
                    className={cn(
                      'size-9 rounded-lg border-2 border-[#161514] flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-[0.95]',
                      isDone
                        ? 'bg-[#03D26F] text-[#161514] shadow-none'
                        : 'bg-white hover:bg-[#F1EFEA] shadow-[1px_1px_0px_#161514]'
                    )}
                  >
                    {isDone && <Check className="size-4 stroke-[3]" />}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={cn(
                        'font-heading font-black text-sm truncate text-[#161514]',
                        isDone && 'line-through text-[#161514]/50'
                      )}
                    >
                      {habit.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#161514]/70 font-medium">
                      <span className="capitalize">{habit.frequency?.type || 'Daily'}</span>
                      {streakData?.currentStreak > 0 && (
                        <span className="flex items-center gap-0.5 text-orange-600 font-bold">
                          <Flame className="size-3 fill-orange-500" />
                          {streakData.currentStreak}d
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-mono font-extrabold border border-[#161514]',
                    isDone ? 'bg-[#03D26F] text-[#161514]' : 'bg-[#F1EFEA] text-[#161514]/70'
                  )}
                >
                  {isDone ? 'Done' : 'Due'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Navigation Link */}
      <div className="pt-2 border-t border-[#161514]/15 flex items-center justify-between text-xs">
        <span className="text-[#161514]/60 font-medium">Routine configuration & splits</span>
        <Link
          href="/goals"
          className="font-heading font-black text-[#161514] hover:underline flex items-center gap-1"
        >
          <span>Habits Hub</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
