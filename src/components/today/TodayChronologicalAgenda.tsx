"use client";

import React, { useState, useMemo } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Flame,
  Clock,
  Sparkles,
  CheckCircle2,
  ListTodo,
} from "lucide-react";
import { type Habit, type HabitLog, type Streak } from "@/types";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

export interface AgendaItem {
  id: string;
  type: "habit" | "task";
  title: string;
  isCompleted: boolean;
  timeLabel?: string;
  priority?: "p1" | "p2" | "p3" | "p4";
  habitId?: string;
  taskId?: string;
  streakCount?: number;
  icon?: string;
}

export interface TodayChronologicalAgendaProps {
  habits: Habit[];
  logs: HabitLog[];
  streaks: Record<string, Streak>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority?: "p1" | "p2" | "p3" | "p4";
    dueDate?: string;
    dueTime?: string;
  }>;
  selectedDate: string;
  isToday: boolean;
  onToggleHabit: (habitId: string, completed: boolean) => void;
  onToggleTask: (taskId: string, completed: boolean) => void;
  className?: string;
}

type AgendaFilter = "todo" | "completed" | "all";

export const TodayChronologicalAgenda = React.memo(function TodayChronologicalAgenda({
  habits,
  logs,
  streaks,
  tasks,
  selectedDate,
  isToday,
  onToggleHabit,
  onToggleTask,
  className,
}: TodayChronologicalAgendaProps) {
  const [filter, setFilter] = useState<AgendaFilter>("todo");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    morning: false,
    workload: false,
    night: false,
  });

  const toggleSection = (section: "morning" | "workload" | "night") => {
    soundFX.playPop();
    soundFX.vibrate(10);
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Build active completed set for habits
  const completedHabitIdSet = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      if (log.completed) set.add(log.habitId);
    });
    return set;
  }, [logs]);

  // Contextual icon selector
  const resolveItemIcon = (title: string, type: "habit" | "task", habitIcon?: string): string => {
    const t = title.toLowerCase();
    if (/wake|alarm|morning/.test(t)) return "⏰";
    if (/gym|workout|train|lift|pushup|pullup/.test(t)) return "🏋️";
    if (/run|jog|sprint|walk|cardio/.test(t)) return "🏃";
    if (/water|hydrate|hydration/.test(t)) return "💧";
    if (/stretch|yoga|meditat/.test(t)) return "🧘";
    if (/read|book|study|math|physics|chapter/.test(t)) return "📚";
    if (/ui|design|component|css|style|figma/.test(t)) return "🎨";
    if (/code|bug|dev|refactor|test|pr|commit|turbopack/.test(t)) return "💻";
    if (/team|client|meeting|call|sync|share|chat/.test(t)) return "💬";
    if (/portfolio|case study|doc|spec|write/.test(t)) return "📄";
    if (/plan|task|todo|priority|review|ledger/.test(t)) return "📝";
    if (/spend|money|budget|expense|upi/.test(t)) return "💳";
    if (/phone|screen|blue light|scroll/.test(t)) return "📵";
    if (/sleep|bed|night|rest/.test(t)) return "🌙";
    return type === "habit" ? "🎯" : "⚡";
  };

  // Classify Habit into Morning / Workload / Night
  const classifyHabit = (h: Habit, index: number): "morning" | "workload" | "night" => {
    if (h.reminderTime) {
      const parts = h.reminderTime.split(":");
      const hour = parseInt(parts[0], 10);
      if (!isNaN(hour)) {
        if (hour < 12) return "morning";
        if (hour < 18) return "workload";
        return "night";
      }
    }
    const title = h.title.toLowerCase();
    if (/wake|morning|sun|breakfast|workout|gym|stretch|hydrate|water|meditat|cold shower|run|jog|pushup/.test(title)) {
      return "morning";
    }
    if (/sleep|bed|night|evening|read|journal|wind|screen|phone|spend|reflect|teeth|floss/.test(title)) {
      return "night";
    }
    return index % 2 === 0 ? "morning" : "workload";
  };

  // Classify Task into Morning / Workload / Night
  const classifyTask = (t: { title: string; dueTime?: string }): "morning" | "workload" | "night" => {
    if (t.dueTime) {
      const parts = t.dueTime.split(":");
      const hour = parseInt(parts[0], 10);
      if (!isNaN(hour)) {
        if (hour < 12) return "morning";
        if (hour < 18) return "workload";
        return "night";
      }
    }
    const title = t.title.toLowerCase();
    if (/morning|breakfast|sunrise/.test(title)) return "morning";
    if (/night|evening|review|sleep/.test(title)) return "night";
    return "workload";
  };

  // Convert raw items into unified agenda format
  const { morningItems, workloadItems, nightItems, totalAll, totalCompleted, totalTodo } = useMemo(() => {
    const morning: AgendaItem[] = [];
    const workload: AgendaItem[] = [];
    const night: AgendaItem[] = [];

    // 1. Active Habits
    const activeHabits = habits.filter((h) => !h.archived);
    activeHabits.forEach((h, idx) => {
      const isCompleted = completedHabitIdSet.has(h.id);
      const streak = streaks[h.id]?.currentStreak || 0;
      const bucket = classifyHabit(h, idx);
      const item: AgendaItem = {
        id: `habit-${h.id}`,
        type: "habit",
        habitId: h.id,
        title: h.title,
        isCompleted,
        timeLabel: h.reminderTime || undefined,
        streakCount: streak,
        icon: resolveItemIcon(h.title, "habit", h.icon),
      };
      if (bucket === "morning") morning.push(item);
      else if (bucket === "night") night.push(item);
      else workload.push(item);
    });

    // 2. Active Tasks (Scheduled for selectedDate, or active P1 due today)
    const relevantTasks = tasks.filter((t) => {
      if (t.dueDate) {
        return t.dueDate === selectedDate;
      }
      // If task has no explicit due date, only show in Today's agenda if it is today and marked P1
      return isToday && t.priority === "p1" && t.status !== "completed";
    });

    relevantTasks.forEach((t) => {
      const isCompleted = t.status === "completed";
      const bucket = classifyTask(t);
      const item: AgendaItem = {
        id: `task-${t.id}`,
        type: "task",
        taskId: t.id,
        title: t.title,
        isCompleted,
        timeLabel: t.dueTime || (t.dueDate === selectedDate ? "Today" : undefined),
        priority: t.priority,
        icon: resolveItemIcon(t.title, "task"),
      };
      if (bucket === "morning") morning.push(item);
      else if (bucket === "night") night.push(item);
      else workload.push(item);
    });

    const all = [...morning, ...workload, ...night];
    const completed = all.filter((i) => i.isCompleted).length;
    const todo = all.length - completed;

    return {
      morningItems: morning,
      workloadItems: workload,
      nightItems: night,
      totalAll: all.length,
      totalCompleted: completed,
      totalTodo: todo,
    };
  }, [habits, completedHabitIdSet, streaks, tasks, selectedDate]);

  // Filter helper
  const filterList = (items: AgendaItem[]) => {
    if (filter === "all") return items;
    if (filter === "todo") return items.filter((i) => !i.isCompleted);
    return items.filter((i) => i.isCompleted);
  };

  const filteredMorning = filterList(morningItems);
  const filteredWorkload = filterList(workloadItems);
  const filteredNight = filterList(nightItems);

  const handleItemToggle = (item: AgendaItem) => {
    if (item.type === "habit" && item.habitId) {
      const nextState = !item.isCompleted;
      if (nextState) {
        soundFX.playCompleteChime();
        soundFX.vibrate(20);
      } else {
        soundFX.playPop();
        soundFX.vibrate(10);
      }
      onToggleHabit(item.habitId, nextState);
    } else if (item.type === "task" && item.taskId) {
      const nextState = !item.isCompleted;
      if (nextState) {
        soundFX.playCompleteChime();
        soundFX.vibrate(20);
      } else {
        soundFX.playPop();
        soundFX.vibrate(10);
      }
      onToggleTask(item.taskId, nextState);
    }
  };

  // Render a clean, single-row checklist item (Benchmark matching reference image)
  const renderChecklistRow = (item: AgendaItem) => {
    return (
      <div
        key={item.id}
        onClick={() => handleItemToggle(item)}
        className={cn(
          "group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer select-none",
          item.isCompleted
            ? "opacity-60 hover:opacity-80"
            : "hover:bg-black/4 dark:hover:bg-white/4 active:scale-[0.99]"
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* 24px Rounded Checkbox (Physical feel from reference) */}
          <button
            type="button"
            aria-label={`Toggle ${item.title}`}
            className={cn(
              "size-5.5 sm:size-6 rounded-md border-2 flex items-center justify-center transition-all shrink-0 active:scale-95",
              item.isCompleted
                ? "bg-[#161514] border-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:border-[#CEF431] dark:text-[#161514]"
                : "border-[#161514]/30 dark:border-white/30 bg-transparent group-hover:border-[#161514] dark:group-hover:border-white"
            )}
          >
            {item.isCompleted && (
              <Check className="size-3.5 stroke-[3] animate-in zoom-in-75 duration-150" />
            )}
          </button>

          {/* Contextual Emoji / Icon */}
          <span className="text-base select-none shrink-0" aria-hidden="true">
            {item.icon}
          </span>

          {/* Title */}
          <span
            className={cn(
              "font-heading text-xs sm:text-sm tracking-tight truncate transition-all leading-snug",
              item.isCompleted
                ? "line-through text-muted-foreground font-normal"
                : "text-foreground font-bold"
            )}
          >
            {item.title}
          </span>
        </div>

        {/* Right Metadata: Time or Streak (Clean & Quiet) */}
        <div className="flex items-center gap-2 shrink-0">
          {item.streakCount !== undefined && item.streakCount > 0 && !item.isCompleted && (
            <span className="flex items-center gap-0.5 text-xs font-heading font-bold text-orange-600 dark:text-orange-400 tabular-nums">
              <Flame className="size-3 fill-current" />
              {item.streakCount}d
            </span>
          )}

          {item.timeLabel && !item.isCompleted && (
            <span className="text-xs font-sans font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              {item.timeLabel}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-2xl p-3.5 sm:p-5 shadow-xs transition-colors",
        className
      )}
    >
      {/* 1. TOP FILTER BAR (Exact Benchmark from Reference Image: To Do | Completed | Pending/All) */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-secondary border border-border mb-3.5">
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            setFilter("todo");
          }}
          className={cn(
            "flex-1 py-1.5 px-2.5 rounded-lg text-xs font-heading font-black transition-all cursor-pointer flex items-center justify-center gap-1.5",
            filter === "todo"
              ? "bg-[#161514] text-[#FAF8F5] dark:bg-[#CEF431] dark:text-[#161514] shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="size-3 stroke-[2.5]" />
          <span>To Do ({totalTodo})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            setFilter("completed");
          }}
          className={cn(
            "flex-1 py-1.5 px-2.5 rounded-lg text-xs font-heading font-black transition-all cursor-pointer flex items-center justify-center gap-1.5",
            filter === "completed"
              ? "bg-[#161514] text-[#FAF8F5] dark:bg-[#CEF431] dark:text-[#161514] shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CheckCircle2 className="size-3 stroke-[2.5]" />
          <span>Done ({totalCompleted})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            setFilter("all");
          }}
          className={cn(
            "flex-1 py-1.5 px-2.5 rounded-lg text-xs font-heading font-black transition-all cursor-pointer flex items-center justify-center gap-1.5",
            filter === "all"
              ? "bg-[#161514] text-[#FAF8F5] dark:bg-[#CEF431] dark:text-[#161514] shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ListTodo className="size-3 stroke-[2.5]" />
          <span>All ({totalAll})</span>
        </button>
      </div>

      {/* 2. SINGLE UNIFIED AGENDA CANVAS (Flowing Morning, Workload, Night) */}
      <div className="space-y-4">
        {/* SECTION 1: MORNING */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection("morning")}
            className="w-full flex items-center justify-between text-left py-1 text-xs font-heading font-black text-foreground cursor-pointer select-none group"
          >
            <div className="flex items-center gap-1.5">
              {collapsedSections.morning ? (
                <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-transform" />
              ) : (
                <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-foreground transition-transform" />
              )}
              <span className="font-heading font-black text-xs sm:text-sm text-foreground tracking-tight">
                Morning
              </span>
            </div>
            <span className="text-xs font-sans font-medium text-muted-foreground tabular-nums">
              {morningItems.filter((i) => i.isCompleted).length}/{morningItems.length}
            </span>
          </button>

          {!collapsedSections.morning && (
            <div className="mt-1 divide-y divide-[#161514]/5 dark:divide-white/5">
              {filteredMorning.length > 0 ? (
                filteredMorning.map((item) => renderChecklistRow(item))
              ) : (
                <div className="py-2.5 px-3 text-xs font-sans font-medium text-muted-foreground/60 italic">
                  {filter === "completed" ? "No morning items completed." : "Morning clear!"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: WORKLOAD */}
        <div className="pt-2 border-t border-[#161514]/10 dark:border-white/10">
          <button
            type="button"
            onClick={() => toggleSection("workload")}
            className="w-full flex items-center justify-between text-left py-1 text-xs font-heading font-black text-foreground cursor-pointer select-none group"
          >
            <div className="flex items-center gap-1.5">
              {collapsedSections.workload ? (
                <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-transform" />
              ) : (
                <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-foreground transition-transform" />
              )}
              <span className="font-heading font-black text-xs sm:text-sm text-foreground tracking-tight">
                Workload
              </span>
            </div>
            <span className="text-xs font-sans font-medium text-muted-foreground tabular-nums">
              {workloadItems.filter((i) => i.isCompleted).length}/{workloadItems.length}
            </span>
          </button>

          {!collapsedSections.workload && (
            <div className="mt-1 divide-y divide-[#161514]/5 dark:divide-white/5">
              {filteredWorkload.length > 0 ? (
                filteredWorkload.map((item) => renderChecklistRow(item))
              ) : (
                <div className="py-2.5 px-3 text-xs font-sans font-medium text-muted-foreground/60 italic">
                  {filter === "completed" ? "No workload items completed." : "Workload clear!"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 3: NIGHT */}
        <div className="pt-2 border-t border-[#161514]/10 dark:border-white/10">
          <button
            type="button"
            onClick={() => toggleSection("night")}
            className="w-full flex items-center justify-between text-left py-1 text-xs font-heading font-black text-foreground cursor-pointer select-none group"
          >
            <div className="flex items-center gap-1.5">
              {collapsedSections.night ? (
                <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-transform" />
              ) : (
                <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-foreground transition-transform" />
              )}
              <span className="font-heading font-black text-xs sm:text-sm text-foreground tracking-tight">
                Night
              </span>
            </div>
            <span className="text-xs font-sans font-medium text-muted-foreground tabular-nums">
              {nightItems.filter((i) => i.isCompleted).length}/{nightItems.length}
            </span>
          </button>

          {!collapsedSections.night && (
            <div className="mt-1 divide-y divide-[#161514]/5 dark:divide-white/5">
              {filteredNight.length > 0 ? (
                filteredNight.map((item) => renderChecklistRow(item))
              ) : (
                <div className="py-2.5 px-3 text-xs font-sans font-medium text-muted-foreground/60 italic">
                  {filter === "completed" ? "No night items completed." : "Night routine clear!"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
