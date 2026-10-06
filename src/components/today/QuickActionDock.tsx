'use client';

import React from 'react';
import Link from 'next/link';
import { Wallet, Play, Pause, CheckSquare, Plus } from 'lucide-react';

interface QuickActionDockProps {
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  onOpenExpenseModal: () => void;
  onScrollToHabits: () => void;
}

export function QuickActionDock({
  isTimerRunning,
  onToggleTimer,
  onOpenExpenseModal,
  onScrollToHabits,
}: QuickActionDockProps) {
  return (
    <section aria-label="Quick Actions Dock" className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {/* 1. Log Expense Trigger */}
      <button
        onClick={onOpenExpenseModal}
        className="min-h-[44px] px-3 py-2.5 bg-white hover:bg-emerald-50 border-2 border-[#161514] rounded-lg shadow-[2px_2px_0px_#161514] active:scale-[0.97] flex items-center justify-center gap-2 font-heading font-black text-xs text-[#161514] transition-all cursor-pointer"
      >
        <div className="size-6 rounded bg-[#03D26F] border border-[#161514] flex items-center justify-center shrink-0">
          <Wallet className="size-3.5 text-[#161514] stroke-[2.5]" />
        </div>
        <span>Log Expense</span>
      </button>

      {/* 2. Focus Stopwatch Trigger */}
      <button
        onClick={onToggleTimer}
        className={`min-h-[44px] px-3 py-2.5 border-2 border-[#161514] rounded-lg shadow-[2px_2px_0px_#161514] active:scale-[0.97] flex items-center justify-center gap-2 font-heading font-black text-xs text-[#161514] transition-all cursor-pointer ${
          isTimerRunning ? 'bg-amber-300 hover:bg-amber-400' : 'bg-[#CEF431] hover:bg-[#D8F74E]'
        }`}
      >
        <div className="size-6 rounded bg-white border border-[#161514] flex items-center justify-center shrink-0">
          {isTimerRunning ? (
            <Pause className="size-3.5 text-[#161514] stroke-[2.5]" />
          ) : (
            <Play className="size-3.5 text-[#161514] fill-current" />
          )}
        </div>
        <span>{isTimerRunning ? 'Pause Sprint' : 'Start Focus'}</span>
      </button>

      {/* 3. Quick Habit Jump */}
      <button
        onClick={onScrollToHabits}
        className="min-h-[44px] px-3 py-2.5 bg-white hover:bg-violet-50 border-2 border-[#161514] rounded-lg shadow-[2px_2px_0px_#161514] active:scale-[0.97] flex items-center justify-center gap-2 font-heading font-black text-xs text-[#161514] transition-all cursor-pointer"
      >
        <div className="size-6 rounded bg-[#C084FC] border border-[#161514] flex items-center justify-center shrink-0">
          <CheckSquare className="size-3.5 text-[#161514] stroke-[2.5]" />
        </div>
        <span>Check Habits</span>
      </button>

      {/* 4. New Task Target Link */}
      <Link
        href="/tasks"
        className="min-h-[44px] px-3 py-2.5 bg-white hover:bg-sky-50 border-2 border-[#161514] rounded-lg shadow-[2px_2px_0px_#161514] active:scale-[0.97] flex items-center justify-center gap-2 font-heading font-black text-xs text-[#161514] transition-all"
      >
        <div className="size-6 rounded bg-[#38BDF8] border border-[#161514] flex items-center justify-center shrink-0">
          <Plus className="size-3.5 text-[#161514] stroke-[3]" />
        </div>
        <span>Task Queue</span>
      </Link>
    </section>
  );
}
