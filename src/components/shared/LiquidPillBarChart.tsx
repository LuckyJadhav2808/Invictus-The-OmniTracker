"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Calendar, Flame, Target, BookOpen, DollarSign, Check, Plus, ShieldCheck, Zap } from "lucide-react";

export interface BarData {
  label?: string; // e.g. "Mon", "Tue", "Wed" or "Jan", "Feb"
  percentage: number; // 0 to 100
  value?: string | number;
  highlighted?: boolean;
  color?: string;
}

interface LiquidPillBarChartProps {
  title?: string;
  totalValue?: string | number;
  data: BarData[];
  streakDays?: number;
  className?: string;
  onCalendarClick?: () => void;
  onViewModeToggle?: (mode: "week" | "month") => void;
}

export function LiquidPillBarChart({
  title = "Weekly Consistency & Tracker Flow",
  totalValue = "0 Habits | 0.0h Study Logged",
  data = [],
  streakDays = 7,
  className,
  onCalendarClick,
}: LiquidPillBarChartProps) {
  // Compute overall average completion rate across days
  const avgCompletionPct = useMemo(() => {
    if (!data.length) return 0;
    const total = data.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    return Math.min(100, Math.round(total / data.length));
  }, [data]);

  // Extract study hours or habits count from totalValue if available
  const studyHours = useMemo(() => {
    if (typeof totalValue === "string" && totalValue.includes("h Study")) {
      const match = totalValue.match(/([\d.]+)h Study/);
      return match ? match[1] : "0.0";
    }
    return "0.0";
  }, [totalValue]);

  const completedHabitsStr = useMemo(() => {
    if (typeof totalValue === "string" && totalValue.includes("Habits")) {
      const match = totalValue.match(/(\d+)\s+Habits/);
      return match ? match[1] : "0";
    }
    return "0";
  }, [totalValue]);

  const handleCalendarClick = () => {
    if (onCalendarClick) {
      onCalendarClick();
    } else {
      toast.success("Active Tracking Period Updated 📅");
    }
  };

  return (
    <div
      className={cn(
        "bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#161514] shadow-[4px_4px_0px_0px_rgba(22,21,20,1)] text-[#161514] transition-all duration-300 space-y-5",
        className
      )}
    >
      {/* 1. Executive Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#161514]/15">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Active Streak Badge */}
            <span className="bg-amber-300 text-[#161514] text-[10px] font-black px-2.5 py-1 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] uppercase flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-rose-600 fill-rose-600" />
              {streakDays}-Day Active Streak
            </span>

            {/* Verified Tracking Badge */}
            <span className="bg-[#CEF431] text-[#161514] text-[10px] font-black px-2.5 py-1 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] uppercase flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              Verified Velocity
            </span>
          </div>

          <h2
            className="text-xl sm:text-2xl font-black tracking-tight text-[#161514] pt-1 uppercase"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {title}
          </h2>
        </div>

        {/* Date Range Action Button */}
        <button
          type="button"
          onClick={handleCalendarClick}
          className="h-10 px-3.5 rounded-xl bg-[#FAF8F5] hover:bg-[#CEF431] border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] flex items-center gap-1.5 font-black text-xs cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all self-start sm:self-auto"
          title="Filter Active Date Range"
        >
          <Calendar className="h-4 w-4 stroke-[2.5]" />
          <span>Active Period</span>
        </button>
      </div>

      {/* 2. 3 Core Metric Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Pillar 1: Habit Consistency */}
        <div className="bg-[#FAF8F5] rounded-2xl p-4 border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-[#161514]/70 flex items-center gap-1">
              <Target className="h-3.5 w-3.5 text-emerald-600" /> Habit Consistency
            </span>
            <span className="text-xs font-black text-emerald-700 bg-[#03D26F]/20 px-2 py-0.5 rounded-lg border border-[#161514]">
              {avgCompletionPct}%
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-[#161514]">{completedHabitsStr} Habits</span>
            <span className="text-[10px] font-bold text-[#161514]/60">Completed</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-white rounded-full border border-[#161514] p-0.5 overflow-hidden">
            <div
              className="h-full bg-[#03D26F] rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, avgCompletionPct)}%` }}
            />
          </div>
        </div>

        {/* Pillar 2: Study Target Flow */}
        <div className="bg-[#FAF8F5] rounded-2xl p-4 border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-[#161514]/70 flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-blue-600" /> Study Velocity
            </span>
            <span className="text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-lg border border-[#161514]">
              {studyHours}h
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-[#161514]">{studyHours} Hours</span>
            <span className="text-[10px] font-bold text-[#161514]/60">Logged</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-white rounded-full border border-[#161514] p-0.5 overflow-hidden">
            <div
              className="h-full bg-[#38BDF8] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, parseFloat(studyHours) * 10))}%` }}
            />
          </div>
        </div>

        {/* Pillar 3: Financial Health Status */}
        <div className="bg-[#FAF8F5] rounded-2xl p-4 border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-[#161514]/70 flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-amber-600" /> Budget Pacing
            </span>
            <span className="text-xs font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded-lg border border-[#161514]">
              On Track 🟢
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-[#161514]">Healthy</span>
            <span className="text-[10px] font-bold text-[#161514]/60">Pacing</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-white rounded-full border border-[#161514] p-0.5 overflow-hidden">
            <div className="h-full bg-[#CEF431] rounded-full w-[78%] transition-all duration-500" />
          </div>
        </div>
      </div>

      {/* 3. 7-Day Milestone Circle Badges Strip */}
      <div className="bg-[#FAF8F5] rounded-2xl p-4 border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] space-y-2.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#161514]/70 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> 7-Day Velocity Milestones
        </span>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-3 text-center">
          {data.map((day, idx) => {
            const isToday = day.highlighted;
            const isCompleted = day.percentage > 0 && day.value !== "0%";

            return (
              <div key={idx} className="flex flex-col items-center space-y-1.5">
                {/* Milestone Badge Node */}
                <div
                  className={cn(
                    "h-10 w-10 sm:h-12 sm:w-12 rounded-2xl border-2 border-[#161514] flex items-center justify-center font-black text-xs sm:text-sm transition-all select-none",
                    isToday
                      ? "bg-[#CEF431] text-[#161514] ring-2 ring-amber-400 shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] scale-105"
                      : isCompleted
                      ? "bg-[#03D26F] text-white shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]"
                      : "bg-white text-[#161514]/40"
                  )}
                  title={`${day.label}: ${day.value || `${Math.round(day.percentage)}%`}`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3]" />
                  ) : isToday ? (
                    <span className="text-xs sm:text-sm">👑</span>
                  ) : (
                    <span className="text-xs text-[#161514]/30">•</span>
                  )}
                </div>

                {/* Day Label */}
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-tight block",
                  isToday ? "text-[#161514] underline" : "text-[#161514]/70"
                )}>
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
