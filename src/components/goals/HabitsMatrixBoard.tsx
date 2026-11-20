"use client";

import { useState, useMemo } from "react";
import {
  format,
  subDays,
  eachDayOfInterval,
  isToday as checkIsToday,
} from "date-fns";
import {
  Sparkles,
  Check,
  Plus,
  LayoutGrid,
  Layers,
  MoreHorizontal,
  Edit3,
  Trash2,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useMonthHabitLogs } from "@/lib/queries/goals";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { type Habit, type Streak } from "@/types";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export interface HabitsMatrixBoardProps {
  habits: Habit[];
  streaks: Record<string, Streak>;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onToggleHabitLog: (habitId: string, completed: boolean, dateStr: string) => void;
  onEditHabit?: (habit: Habit) => void;
  onDeleteHabit?: (habitId: string) => void;
  onOpenNewHabit: () => void;
}

export function HabitsMatrixBoard({
  habits,
  streaks,
  selectedDate,
  onSelectDate,
  onToggleHabitLog,
  onEditHabit,
  onDeleteHabit,
  onOpenNewHabit,
}: HabitsMatrixBoardProps) {
  // Time Window: 14 Days vs 28 Days (4 Weeks)
  const [windowDays, setWindowDays] = useState<14 | 28>(28);
  const [matrixStyle, setMatrixStyle] = useState<"board" | "cards">("board");

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => format(today, "yyyy-MM-dd"), [today]);

  // Compute date array for the selected window ending today
  const rangeStart = useMemo(() => subDays(today, windowDays - 1), [today, windowDays]);
  const rangeStartStr = useMemo(() => format(rangeStart, "yyyy-MM-dd"), [rangeStart]);

  // Query habit logs for this complete window
  const { data: windowLogs = [] } = useMonthHabitLogs(rangeStartStr, todayStr);

  const daysList = useMemo(() => {
    return eachDayOfInterval({ start: rangeStart, end: today }).map((d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      return {
        date: d,
        dateStr,
        dayName: format(d, "EEE"),
        dayLetter: format(d, "EEEEE"),
        dayNum: format(d, "d"),
        monthShort: format(d, "MMM"),
        isToday: checkIsToday(d),
        isSelected: dateStr === selectedDate,
      };
    });
  }, [rangeStart, today, selectedDate]);

  // Compute daily totals across all habits
  const dailyTotals = useMemo(() => {
    return daysList.map((day) => {
      const dayLogs = windowLogs.filter((l) => l.date === day.dateStr && l.completed);
      const doneCount = dayLogs.length;
      const totalCount = habits.length;
      const isConquered = totalCount > 0 && doneCount >= totalCount;
      const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
      return {
        dateStr: day.dateStr,
        doneCount,
        totalCount,
        isConquered,
        pct,
      };
    });
  }, [daysList, windowLogs, habits.length]);

  // Total logs in window
  const totalWindowLogs = useMemo(() => {
    return windowLogs.filter((l) => l.completed).length;
  }, [windowLogs]);

  // Handle tactile toggle
  const handleCellClick = (habitId: string, dateStr: string, currentlyDone: boolean) => {
    soundFX.playPop();
    soundFX.vibrate(18);
    onToggleHabitLog(habitId, !currentlyDone, dateStr);
  };

  return (
    <div className="space-y-4">
      {/* 1. Matrix Control Strip */}
      <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl p-3 sm:p-4 shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] border-2 border-[#161514] flex items-center justify-center font-black shadow-2xs">
            <LayoutGrid className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-black text-sm sm:text-base text-foreground tracking-tight">
                Daily Discipline Matrix
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-[#CEF431] text-[#161514] border border-[#161514] shadow-2xs">
                {windowDays}d View
              </span>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
              {totalWindowLogs} completed logs in the past {windowDays} days
            </p>
          </div>
        </div>

        {/* Right Controls: Window Switcher & View Style */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* 14d / 28d Range Switcher */}
          <div className="flex items-center bg-secondary border-2 border-border rounded-xl p-0.5 text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                setWindowDays(14);
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                windowDays === 14
                  ? "bg-card text-foreground font-black shadow-2xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              14d
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                setWindowDays(28);
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                windowDays === 28
                  ? "bg-card text-foreground font-black shadow-2xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              28d (4w)
            </button>
          </div>

          {/* Sub-style Switcher: Unified Board vs Cards */}
          <div className="flex items-center bg-secondary border-2 border-border rounded-xl p-0.5 text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                setMatrixStyle("board");
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                matrixStyle === "board"
                  ? "bg-card text-foreground font-black shadow-2xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Panoramic Matrix Board"
            >
              <LayoutGrid className="size-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                setMatrixStyle("cards");
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                matrixStyle === "cards"
                  ? "bg-card text-foreground font-black shadow-2xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Individual Calendar Cards"
            >
              <Layers className="size-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Mode A: Unified Multi-Habit Matrix Board */}
      {matrixStyle === "board" && (
        <div className="bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] overflow-hidden">
          {/* Scrollable Container with Sticky Left Column */}
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full border-collapse text-left select-none min-w-[640px]">
              {/* Header Row: Days */}
              <thead>
                <tr className="border-b-2 border-[#161514] dark:border-[#38332E] bg-muted/40">
                  {/* Sticky Habit Header */}
                  <th className="sticky left-0 z-20 bg-[#FAF8F5] dark:bg-[#161514] p-3 border-r-2 border-[#161514] dark:border-[#38332E] min-w-[160px] sm:min-w-[200px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-black uppercase text-foreground tracking-wider">
                        Routines ({habits.length})
                      </span>
                      <button
                        type="button"
                        onClick={onOpenNewHabit}
                        className="size-5 rounded-md bg-[#CEF431] text-[#161514] border border-[#161514] flex items-center justify-center hover:bg-[#bce028] transition-all cursor-pointer shadow-2xs"
                        title="Add Habit"
                      >
                        <Plus className="size-3 stroke-[3]" />
                      </button>
                    </div>
                  </th>

                  {/* Day Columns */}
                  {daysList.map((day) => (
                    <th
                      key={day.dateStr}
                      onClick={() => onSelectDate(day.dateStr)}
                      className={cn(
                        "p-1.5 text-center transition-colors cursor-pointer min-w-[32px] sm:min-w-[36px]",
                        day.isToday && "bg-[#CEF431]/20 dark:bg-[#CEF431]/10 font-black",
                        day.isSelected && "ring-1.5 ring-inset ring-[#161514] dark:ring-[#CEF431]"
                      )}
                      title={`Select ${day.dayName}, ${day.monthShort} ${day.dayNum}`}
                    >
                      <span className="block text-[9px] font-mono font-bold uppercase text-muted-foreground leading-none">
                        {day.dayLetter}
                      </span>
                      <span
                        className={cn(
                          "block text-xs font-mono font-black leading-tight mt-0.5",
                          day.isToday ? "text-[#161514] dark:text-[#CEF431]" : "text-foreground"
                        )}
                      >
                        {day.dayNum}
                      </span>
                    </th>
                  ))}

                  {/* Right Header: Consistency Rate */}
                  <th className="p-3 text-right text-[11px] font-mono font-black uppercase text-muted-foreground tracking-wider min-w-[70px]">
                    Score
                  </th>
                </tr>
              </thead>

              {/* Habit Rows */}
              <tbody className="divide-y-2 divide-[#161514]/10 dark:divide-white/10">
                {habits.map((habit) => {
                  const habitStreak = streaks[habit.id] || { currentStreak: 0, longestStreak: 0 };
                  const logsForHabit = windowLogs.filter((l) => l.habitId === habit.id && l.completed);
                  const completedCount = logsForHabit.length;
                  const scorePct = Math.min(100, Math.round((completedCount / daysList.length) * 100));

                  const IconComponent =
                    (LucideIcons as any)[habit.icon] || LucideIcons.Target;

                  return (
                    <tr
                      key={habit.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Sticky Habit Title & Actions */}
                      <td className="sticky left-0 z-20 bg-[#FAF8F5] dark:bg-[#161514] p-2.5 sm:p-3 border-r-2 border-[#161514] dark:border-[#38332E]">
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="size-6 sm:size-7 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
                              <IconComponent className="size-3 sm:size-3.5 stroke-[2] text-foreground" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-heading font-black text-foreground block truncate group-hover:text-primary transition-colors">
                                {habit.title}
                              </span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">
                                  {habit.frequency?.type || "Daily"}
                                </span>
                                {habitStreak.currentStreak > 0 && (
                                  <span className="text-[9px] font-mono font-black text-amber-500 flex items-center">
                                    🔥{habitStreak.currentStreak}d
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Subtle Edit / Delete Menu */}
                          {(onEditHabit || onDeleteHabit) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    soundFX.playPop();
                                  }}
                                  className="size-6 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors shrink-0"
                                  title="Routine options"
                                >
                                  <MoreHorizontal className="size-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#38332E] rounded-xl shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] p-1 min-w-[130px] z-50">
                                {onEditHabit && (
                                  <DropdownMenuItem
                                    onClick={() => onEditHabit(habit)}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-heading font-bold cursor-pointer rounded-lg hover:bg-secondary"
                                  >
                                    <Edit3 className="size-3.5" />
                                    <span>Edit</span>
                                  </DropdownMenuItem>
                                )}
                                {onDeleteHabit && (
                                  <DropdownMenuItem
                                    onClick={() => onDeleteHabit(habit.id)}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-heading font-bold cursor-pointer rounded-lg text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40"
                                  >
                                    <Trash2 className="size-3.5" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </td>

                      {/* Day Cells: 1-Tap Interactive Squares */}
                      {daysList.map((day) => {
                        const isDone = logsForHabit.some((l) => l.date === day.dateStr);
                        const isToday = day.isToday;

                        return (
                          <td
                            key={day.dateStr}
                            className={cn(
                              "p-1 text-center align-middle",
                              isToday && "bg-[#CEF431]/10 dark:bg-[#CEF431]/5"
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => handleCellClick(habit.id, day.dateStr, isDone)}
                              className={cn(
                                "size-6 sm:size-7.5 rounded-lg border-2 flex items-center justify-center mx-auto transition-all duration-150 cursor-pointer active:scale-90",
                                isDone
                                  ? isToday
                                    ? "bg-[#CEF431] border-[#161514] text-[#161514] shadow-[1px_1px_0px_0px_#161514] font-black"
                                    : "bg-[#03D26F] border-[#161514] text-[#161514] shadow-2xs font-black"
                                  : isToday
                                  ? "border-2 border-dashed border-[#161514] dark:border-[#CEF431] bg-secondary hover:bg-[#CEF431]/20 animate-pulse"
                                  : "bg-secondary/40 border-border hover:border-[#161514] dark:hover:border-white/40 hover:bg-secondary"
                              )}
                              title={`${habit.title} • ${day.dayName} ${day.dayNum} • ${
                                isDone ? "Completed ⚡" : isToday ? "Due Today" : "Not Done"
                              }`}
                            >
                              {isDone ? (
                                <Check className="size-3.5 sm:size-4 stroke-[3]" />
                              ) : isToday ? (
                                <span className="size-1 rounded-full bg-[#161514] dark:bg-[#CEF431]" />
                              ) : null}
                            </button>
                          </td>
                        );
                      })}

                      {/* Right Score */}
                      <td className="p-2.5 text-right font-mono font-black text-xs text-foreground">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded-md",
                            scorePct >= 80
                              ? "bg-[#DCFAE5] text-[#04250e] dark:bg-[#03D26F]/20 dark:text-[#03D26F]"
                              : scorePct >= 50
                              ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                              : "text-muted-foreground"
                          )}
                        >
                          {scorePct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Velocity Summary Footer */}
              <tfoot>
                <tr className="border-t-2 border-[#161514] dark:border-[#38332E] bg-muted/40 font-mono font-bold text-xs">
                  <td className="sticky left-0 z-20 bg-[#FAF8F5] dark:bg-[#161514] p-3 border-r-2 border-[#161514] dark:border-[#38332E]">
                    <span className="text-[11px] font-mono font-black uppercase text-foreground">
                      Completed / Day
                    </span>
                  </td>
                  {dailyTotals.map((tot) => (
                    <td
                      key={tot.dateStr}
                      className={cn(
                        "p-1 text-center align-middle",
                        tot.dateStr === todayStr && "bg-[#CEF431]/20 dark:bg-[#CEF431]/10 font-black"
                      )}
                    >
                      <span
                        className={cn(
                          "block text-[10px] font-mono font-black",
                          tot.isConquered
                            ? "text-[#03D26F] font-black"
                            : tot.doneCount > 0
                            ? "text-foreground"
                            : "text-muted-foreground opacity-50"
                        )}
                      >
                        {tot.doneCount}
                      </span>
                    </td>
                  ))}
                  <td className="p-2.5 text-right text-[10px] font-mono font-black text-muted-foreground uppercase">
                    Reps
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legend Strip */}
          <div className="p-3 bg-muted/20 border-t-2 border-[#161514]/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-sm bg-[#03D26F] border border-[#161514]" />
                <span className="text-[11px] font-bold text-muted-foreground">Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-sm bg-[#CEF431] border border-[#161514]" />
                <span className="text-[11px] font-bold text-muted-foreground">Today Done</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-sm border border-dashed border-[#161514] dark:border-[#CEF431] bg-secondary" />
                <span className="text-[11px] font-bold text-muted-foreground">Due Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-sm bg-secondary border border-border" />
                <span className="text-[11px] font-bold text-muted-foreground">Missed</span>
              </div>
            </div>

            <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
              <Sparkles className="size-3 text-[#03D26F]" />
              <span>Tap any cell to quick-log past or current dates</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Mode B: Calendar Cards (4-Week Heatmap Grids Per Habit) */}
      {matrixStyle === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((habit) => {
            const habitStreak = streaks[habit.id] || { currentStreak: 0, longestStreak: 0 };
            const logsForHabit = windowLogs.filter((l) => l.habitId === habit.id && l.completed);
            const completedCount = logsForHabit.length;
            const consistencyPct = Math.min(100, Math.round((completedCount / daysList.length) * 100));

            const IconComponent =
              (LucideIcons as any)[habit.icon] || LucideIcons.Target;

            return (
              <div
                key={habit.id}
                className="bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl p-4 shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] space-y-3"
              >
                {/* Habit Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-xl bg-secondary border-2 border-border flex items-center justify-center shrink-0">
                      <IconComponent className="size-4 text-foreground stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-heading font-black text-sm text-foreground truncate">
                        {habit.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                        <span className="uppercase font-bold">{habit.frequency?.type || "Daily"}</span>
                        <span>•</span>
                        <span className="font-bold text-amber-500">🔥 {habitStreak.currentStreak}d streak</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono font-black text-xs text-foreground shrink-0">
                    <span className="bg-[#DCFAE5] dark:bg-[#03D26F]/20 text-[#04250e] dark:text-[#03D26F] px-2 py-0.5 rounded-md border border-[#03D26F]/30">
                      {consistencyPct}%
                    </span>
                  </div>
                </div>

                {/* 28-Day Calendar Matrix: 7 Columns Mon-Sun */}
                <div className="space-y-1.5 pt-1 border-t border-[#161514]/10 dark:border-white/10">
                  <div className="flex items-center justify-between text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                    <span>4-Week Momentum</span>
                    <span>{completedCount}/{daysList.length} Completed</span>
                  </div>

                  {/* 7-Col Grid */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {daysList.map((day) => {
                      const isDone = logsForHabit.some((l) => l.date === day.dateStr);
                      const isToday = day.isToday;

                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          onClick={() => handleCellClick(habit.id, day.dateStr, isDone)}
                          className={cn(
                            "h-7 rounded-md border-2 flex items-center justify-center font-mono text-[10px] font-bold transition-all cursor-pointer active:scale-90",
                            isDone
                              ? isToday
                                ? "bg-[#CEF431] border-[#161514] text-[#161514] font-black"
                                : "bg-[#03D26F] border-[#161514] text-[#161514] font-black"
                              : isToday
                              ? "border-2 border-dashed border-[#161514] dark:border-[#CEF431] bg-secondary"
                              : "bg-secondary border-border text-muted-foreground hover:border-[#161514]"
                          )}
                          title={`${day.dayName} ${day.dayNum} • ${isDone ? "Completed" : "Pending"}`}
                        >
                          {isDone ? "✓" : day.dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
