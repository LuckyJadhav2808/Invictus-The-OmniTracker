"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { format, subDays } from "date-fns";
import { useHabits, useMonthHabitLogs } from "@/lib/queries/goals";
import { useStudySessions, useSubjects } from "@/lib/queries/study";
import { useTransactions, useCategories } from "@/lib/queries/money";
import {
  generateYearlyMatrixData,
  MatrixFilterType,
  MatrixRangeType,
  ActivityDayDetail,
} from "@/lib/utils/activity-matrix";
import {
  Flame,
  Trophy,
  Zap,
  Calendar,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Wallet,
  Layers,
  ArrowRight,
  TrendingUp,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface YearlyActivityMatrixProps {
  initialFilter?: MatrixFilterType;
  initialRange?: MatrixRangeType;
  className?: string;
  title?: string;
}

export function YearlyActivityMatrix({
  initialFilter = "all",
  initialRange = "1y",
  className,
  title = "365-DAY LIFE MOMENTUM MATRIX",
}: YearlyActivityMatrixProps) {
  const [filter, setFilter] = useState<MatrixFilterType>(initialFilter);
  const [range, setRange] = useState<MatrixRangeType>(initialRange);
  const [selectedDay, setSelectedDay] = useState<ActivityDayDetail | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => format(today, "yyyy-MM-dd"), [today]);
  const rangeStartStr = useMemo(() => {
    const days = range === "3m" ? 95 : range === "6m" ? 185 : 370;
    return format(subDays(today, days), "yyyy-MM-dd");
  }, [today, range]);

  // Data Queries
  const { data: habits = [] } = useHabits();
  const { data: habitLogs = [], isLoading: logsLoading } = useMonthHabitLogs(rangeStartStr, todayStr);
  const { data: studySessions = [], isLoading: studyLoading } = useStudySessions();
  const { data: subjects = [] } = useSubjects();
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: categories = [] } = useCategories();

  const habitsMap = useMemo(() => {
    const map: Record<string, string> = {};
    habits.forEach((h) => {
      map[h.id] = h.title;
    });
    return map;
  }, [habits]);

  const categoriesMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const subjectsMap = useMemo(() => {
    const map: Record<string, string> = {};
    subjects.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [subjects]);

  // Generate Matrix Structure & Summary Stats
  const { weeks, stats, maxScore } = useMemo(() => {
    return generateYearlyMatrixData(
      habitLogs,
      studySessions,
      transactions,
      filter,
      range,
      habitsMap,
      categoriesMap,
      subjectsMap
    );
  }, [habitLogs, studySessions, transactions, filter, range, habitsMap, categoriesMap, subjectsMap]);

  // Auto-scroll to current day (right side of grid) on initial load & range change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [range, weeks]);

  // Select today as default inspected day if none selected
  useEffect(() => {
    if (!selectedDay && weeks.length > 0) {
      const lastWeek = weeks[weeks.length - 1];
      const todayCell = lastWeek.days.find((d) => d.isToday) || lastWeek.days[lastWeek.days.length - 1];
      if (todayCell) setSelectedDay(todayCell);
    }
  }, [weeks, selectedDay]);

  const getCellColor = (intensity: number, filterType: MatrixFilterType, isSelected: boolean) => {
    if (intensity === 0) {
      return isSelected
        ? "bg-stone-300 border-[#161514] scale-110 shadow-[1px_1px_0px_0px_#161514] ring-2 ring-[#161514]"
        : "bg-[#F3EFEA] hover:bg-stone-200 border-stone-300/80";
    }

    if (filterType === "all") {
      switch (intensity) {
        case 1:
          return "bg-[#E6F9A2] border-[#161514]/40 hover:brightness-95";
        case 2:
          return "bg-[#D8F763] border-[#161514]/60 hover:brightness-95";
        case 3:
          return "bg-[#CEF431] border-[#161514] font-bold shadow-xs hover:brightness-95";
        case 4:
          return "bg-[#B0E015] border-[#161514] font-black shadow-xs ring-1 ring-[#161514] hover:brightness-95";
      }
    } else if (filterType === "habits") {
      switch (intensity) {
        case 1:
          return "bg-emerald-100 border-emerald-400/50 hover:brightness-95";
        case 2:
          return "bg-emerald-300 border-emerald-600/70 hover:brightness-95";
        case 3:
          return "bg-emerald-400 border-[#161514] font-bold shadow-xs hover:brightness-95";
        case 4:
          return "bg-[#03D26F] border-[#161514] font-black shadow-xs ring-1 ring-[#161514] hover:brightness-95";
      }
    } else if (filterType === "study") {
      switch (intensity) {
        case 1:
          return "bg-purple-100 border-purple-400/50 hover:brightness-95";
        case 2:
          return "bg-purple-300 border-purple-600/70 hover:brightness-95";
        case 3:
          return "bg-[#C084FC] border-[#161514] font-bold shadow-xs hover:brightness-95";
        case 4:
          return "bg-[#A855F7] border-[#161514] font-black shadow-xs ring-1 ring-[#161514] text-white hover:brightness-95";
      }
    } else {
      // Money
      switch (intensity) {
        case 1:
          return "bg-amber-100 border-amber-400/50 hover:brightness-95";
        case 2:
          return "bg-amber-300 border-amber-600/70 hover:brightness-95";
        case 3:
          return "bg-amber-400 border-[#161514] font-bold shadow-xs hover:brightness-95";
        case 4:
          return "bg-[#F59E0B] border-[#161514] font-black shadow-xs ring-1 ring-[#161514] hover:brightness-95";
      }
    }
    return "bg-[#F3EFEA] border-stone-300";
  };

  const dayRowLabels = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

  return (
    <div className={cn("bg-white rounded-3xl p-5 md:p-7 border-[2.5px] border-[#161514] shadow-[5px_5px_0px_0px_#161514] space-y-5", className)}>
      
      {/* 1. Header & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[2px_2px_0px_0px_#161514] shrink-0 font-black text-xl">
            ⚡
          </div>
          <div>
            <h2 className="font-black text-base md:text-lg text-[#161514] uppercase tracking-tight font-heading">
              {title}
            </h2>
            <p className="text-[10px] text-[#161514]/70 font-black uppercase tracking-wide">
              {stats.totalActions} TOTAL LIFE ACTIONS • {stats.activeDaysCount} ACTIVE DAYS ({stats.activePercentage}%)
            </p>
          </div>
        </div>

        {/* Range Selector Pills (3M / 6M / 1Y) */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#FAF8F5] p-1.5 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
          {(["3m", "6m", "1y"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
                range === r
                  ? "bg-[#161514] text-white shadow-[1px_1px_0px_0px_#161514]"
                  : "text-[#161514]/70 hover:text-[#161514] hover:bg-white"
              )}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Cross-Module Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: "all" as const, label: "⚡ All Combined", count: stats.totalActions },
          { id: "habits" as const, label: "🌱 Habits", count: stats.totalHabitsCompleted },
          { id: "study" as const, label: "📚 Study Sessions", count: `${Math.round(stats.totalStudyMinutes / 60)}h` },
          { id: "money" as const, label: "💰 Financial Ledger", count: stats.totalTransactions },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 shrink-0 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
              filter === tab.id
                ? "bg-[#161514] text-white border-[#161514] shadow-[2px_2px_0px_0px_#161514]"
                : "bg-white text-[#161514] border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:bg-[#FFF9EA]"
            )}
          >
            <span>{tab.label}</span>
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full font-black",
              filter === tab.id ? "bg-white/20 text-white" : "bg-[#FAF8F5] text-[#161514] border border-[#161514]"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 3. High-Density Momentum Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#FAF8F5] rounded-2xl p-3.5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-1 text-[10px] font-black text-[#161514]/70 uppercase">
            <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Current Streak
          </div>
          <p className="text-lg font-black text-[#161514] mt-0.5 font-heading">
            {stats.currentStreak} <span className="text-xs font-bold text-[#161514]/70">Days</span>
          </p>
        </div>

        <div className="bg-[#FAF8F5] rounded-2xl p-3.5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-1 text-[10px] font-black text-[#161514]/70 uppercase">
            <Trophy className="h-3.5 w-3.5 text-amber-500" /> Longest Streak
          </div>
          <p className="text-lg font-black text-[#161514] mt-0.5 font-heading">
            {stats.longestStreak} <span className="text-xs font-bold text-[#161514]/70">Days</span>
          </p>
        </div>

        <div className="bg-[#FAF8F5] rounded-2xl p-3.5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-1 text-[10px] font-black text-[#161514]/70 uppercase">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Active Rate
          </div>
          <p className="text-lg font-black text-[#161514] mt-0.5 font-heading">
            {stats.activePercentage}% <span className="text-[10px] font-bold text-[#161514]/70">({stats.activeDaysCount}d)</span>
          </p>
        </div>

        <div className="bg-[#FAF8F5] rounded-2xl p-3.5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-1 text-[10px] font-black text-[#161514]/70 uppercase">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Peak Day
          </div>
          <p className="text-lg font-black text-[#161514] mt-0.5 truncate font-heading">
            {stats.peakDayName.slice(0, 3)} <span className="text-[10px] font-bold text-[#161514]/70">({stats.peakDayCount})</span>
          </p>
        </div>
      </div>

      {/* 4. The 365-Day Contribution Heatmap Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-black uppercase text-[#161514]/70 tracking-wider">
          <span>Activity Timeline ({range.toUpperCase()})</span>
          <button
            type="button"
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({
                  left: scrollContainerRef.current.scrollWidth,
                  behavior: "smooth",
                });
              }
            }}
            className="text-[#161514] underline underline-offset-2 hover:text-amber-600 cursor-pointer font-black flex items-center gap-1"
          >
            <span>Scroll to Today</span>
            <ArrowRight className="h-3 w-3 stroke-[2.5]" />
          </button>
        </div>

        <div
          ref={scrollContainerRef}
          className="overflow-x-auto no-scrollbar rounded-2xl border-2 border-[#161514] bg-[#FAF8F5] p-4 shadow-[2px_2px_0px_0px_#161514]"
        >
          <div className="min-w-max flex gap-2">
            
            {/* Day of Week Row Labels (Mon, Wed, Fri, Sun) */}
            <div className="flex flex-col justify-between pt-5 pb-1 pr-1 text-[9px] font-black text-[#161514]/40 select-none">
              {dayRowLabels.map((lbl, idx) => (
                <span key={idx} className="h-3 leading-3">{lbl}</span>
              ))}
            </div>

            {/* Matrix Columns (Weeks) */}
            <div className="flex flex-col gap-1">
              
              {/* Month Header Labels Row */}
              <div className="flex gap-1 h-4">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="w-3 text-[9px] font-black text-[#161514]/80 tracking-tighter">
                    {week.monthLabel ? week.monthLabel.slice(0, 3) : ""}
                  </div>
                ))}
              </div>

              {/* 7-Row Week Columns Grid */}
              <div className="flex gap-1">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1">
                    {week.days.map((day, dIdx) => {
                      const isSelected = selectedDay?.dateStr === day.dateStr;
                      const cellColor = getCellColor(day.intensity, filter, isSelected);

                      return (
                        <button
                          key={dIdx}
                          type="button"
                          onClick={() => setSelectedDay(day)}
                          onMouseEnter={() => setSelectedDay(day)}
                          title={`${day.shortDate}: ${day.totalScore} action(s)`}
                          className={cn(
                            "h-3 w-3 rounded-xs border transition-all cursor-pointer relative",
                            cellColor,
                            day.isToday && "ring-2 ring-amber-500 z-10",
                            isSelected && "ring-2 ring-[#161514] z-20 scale-125"
                          )}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* Legend Indicator */}
        <div className="flex items-center justify-between text-[10px] font-black text-[#161514]/70 pt-1">
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-[#161514]/60" />
            <span>Tap any cell to inspect breakdown</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[9px] font-black uppercase text-[#161514]/50">Less</span>
            {[0, 1, 2, 3, 4].map((lvl) => (
              <span
                key={lvl}
                className={cn("h-2.5 w-2.5 rounded-xs border", getCellColor(lvl, filter, false))}
              />
            ))}
            <span className="text-[9px] font-black uppercase text-[#161514]/50 ml-0.5">More</span>
          </div>
        </div>
      </div>

      {/* 5. Interactive Day Detail Inspection Panel */}
      {selectedDay && (
        <div className="bg-[#FAF8F5] rounded-2xl p-4 sm:p-5 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-3">
          <div className="flex items-center justify-between border-b-2 border-[#161514]/15 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#CEF431] border-2 border-[#161514] shrink-0" />
              <h4 className="font-black text-xs md:text-sm text-[#161514] font-heading">
                {selectedDay.shortDate}
              </h4>
              {selectedDay.isToday && (
                <span className="bg-amber-400 text-[#161514] text-[9px] font-black uppercase px-2 py-0.5 rounded-md border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
                  TODAY
                </span>
              )}
            </div>

            <span className="bg-[#161514] text-white font-black text-xs px-2.5 py-0.5 rounded-lg border border-[#161514]">
              {selectedDay.totalScore} {selectedDay.totalScore === 1 ? "Action" : "Actions"}
            </span>
          </div>

          {/* Breakdown Items List */}
          {selectedDay.totalScore === 0 ? (
            <p className="text-xs text-[#161514]/60 font-bold italic py-1">
              Rest or recovery day — no logged habits, study, or expenses on this date.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              
              {/* Habits */}
              <div className="bg-white rounded-xl p-3 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] space-y-1">
                <span className="text-[9px] font-black uppercase text-emerald-800 block">
                  🌱 Habits Completed ({selectedDay.habitCount})
                </span>
                {selectedDay.habitTitles.length > 0 ? (
                  <div className="space-y-0.5 max-h-24 overflow-y-auto no-scrollbar">
                    {selectedDay.habitTitles.map((t, idx) => (
                      <p key={idx} className="text-[11px] font-bold text-[#161514] truncate flex items-center gap-1">
                        <span className="text-emerald-600 font-black">✓</span> {t}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-[#161514]/40 font-bold">None logged</p>
                )}
              </div>

              {/* Study */}
              <div className="bg-white rounded-xl p-3 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] space-y-1">
                <span className="text-[9px] font-black uppercase text-purple-800 block">
                  📚 Study ({selectedDay.studyMinutes}m)
                </span>
                {selectedDay.studyTopics.length > 0 ? (
                  <div className="space-y-0.5 max-h-24 overflow-y-auto no-scrollbar">
                    {selectedDay.studyTopics.map((t, idx) => (
                      <p key={idx} className="text-[11px] font-bold text-[#161514] truncate flex items-center gap-1">
                        <span className="text-purple-600 font-black">📖</span> {t}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-[#161514]/40 font-bold">0 minutes</p>
                )}
              </div>

              {/* Finance */}
              <div className="bg-white rounded-xl p-3 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] space-y-1">
                <span className="text-[9px] font-black uppercase text-amber-800 block">
                  💰 Ledger Logs ({selectedDay.transactionCount})
                </span>
                {selectedDay.transactionSummaries.length > 0 ? (
                  <div className="space-y-0.5 max-h-24 overflow-y-auto no-scrollbar">
                    {selectedDay.transactionSummaries.map((s, idx) => (
                      <p key={idx} className="text-[11px] font-bold text-[#161514] truncate flex items-center gap-1">
                        <span className="text-amber-600 font-black">💸</span> {s}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-[#161514]/40 font-bold">0 transactions</p>
                )}
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
