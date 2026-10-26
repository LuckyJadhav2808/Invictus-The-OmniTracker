"use client";

import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useHabits,
  useUpdateHabit,
  useDeleteHabit,
  useStreaks,
  useMonthHabitLogs,
  useToggleHabitLog,
} from "@/lib/queries/goals";
import { Button } from "@/components/ui/button";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { NewHabitForm } from "@/components/goals/NewHabitForm";
import {
  HabitCompanionSprite,
  detectHabitArchetype,
  ARCHETYPE_CONFIG,
} from "@/components/mascot/HabitCompanionSprite";
import { soundFX } from "@/components/shared/SoundFX";
import {
  ArrowLeft,
  Trash2,
  Edit3,
  Flame,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  Check,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { format, subDays, eachDayOfInterval, isSameDay, getDay } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function HabitDetailPage({
  params,
}: {
  params: Promise<{ habitId: string }>;
}) {
  const { habitId } = use(params);
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: streaks = {} } = useStreaks();

  const updateHabitMutation = useUpdateHabit();
  const deleteHabitMutation = useDeleteHabit();
  const toggleLogMutation = useToggleHabitLog();

  const habit = habits.find((h) => h.id === habitId);
  const streak = streaks[habitId];

  // 30-day date interval for habit history
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => format(today, "yyyy-MM-dd"), [today]);
  const startDateStr = useMemo(() => format(subDays(today, 29), "yyyy-MM-dd"), [today]);

  const { data: monthLogs = [] } = useMonthHabitLogs(
    startDateStr,
    todayStr
  );

  const days30 = useMemo(() => {
    return eachDayOfInterval({
      start: subDays(today, 29),
      end: today,
    });
  }, [today]);

  // Determine if a given date is a rest day for this habit
  const isDateRestDay = (date: Date) => {
    if (
      habit?.frequency?.type === "customDays" &&
      Array.isArray(habit.frequency.daysOfWeek) &&
      habit.frequency.daysOfWeek.length > 0
    ) {
      const dayOfWeek = getDay(date);
      return !habit.frequency.daysOfWeek.includes(dayOfWeek);
    }
    return false;
  };

  const isTodayCompleted = useMemo(() => {
    return monthLogs.some(
      (l) => l.habitId === habitId && l.date === todayStr && l.completed
    );
  }, [monthLogs, habitId, todayStr]);

  const isTodayRestDay = habit ? isDateRestDay(today) : false;

  // 30-Day Metrics Calculation
  const stats30 = useMemo(() => {
    let completedCount = 0;
    let scheduledCount = 0;

    days30.forEach((d) => {
      const dStr = format(d, "yyyy-MM-dd");
      const isRest = isDateRestDay(d);
      const isDone = monthLogs.some(
        (l) => l.habitId === habitId && l.date === dStr && l.completed
      );

      if (isDone) completedCount++;
      if (!isRest) scheduledCount++;
    });

    const completionRate =
      scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 100;

    return {
      completedCount,
      scheduledCount,
      completionRate,
    };
  }, [days30, monthLogs, habitId, habit]);

  if (habitsLoading) {
    return (
      <div className="py-20 flex items-center justify-center p-4">
        <div className="text-center space-y-3 animate-pulse">
          <div className="w-12 h-12 bg-amber-300 rounded-2xl mx-auto border-2 border-[#161514]" />
          <p className="text-xs font-black text-[#161514] uppercase tracking-wider">
            Loading Habit...
          </p>
        </div>
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="py-20 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-[#161514] font-black text-sm">Habit not found</p>
          <Link href="/goals">
            <Button className="rounded-xl border-2 border-[#161514] bg-[#CEF431] text-[#161514] font-black shadow-[2px_2px_0px_0px_#161514]">
              Back to Goals
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const archetype = detectHabitArchetype(habit.icon, habit.title);
  const archetypeConfig = ARCHETYPE_CONFIG[archetype];

  const handleToggleToday = async () => {
    try {
      const targetState = !isTodayCompleted;
      await toggleLogMutation.mutateAsync({
        habitId,
        date: todayStr,
        completed: targetState,
      });

      if (targetState) {
        soundFX.playPop();
        soundFX.vibrate(20);
        toast.success("Habit checked for today! Keep the flame alive 🔥");
      } else {
        toast.success("Habit unchecked for today");
      }
    } catch {
      toast.error("Failed to update habit check-in");
    }
  };

  const handleUpdateHabit = async (data: any) => {
    try {
      await updateHabitMutation.mutateAsync({
        ...data,
        id: habitId,
      });
      toast.success("Habit updated! ✨");
      setIsEditOpen(false);
    } catch {
      toast.error("Failed to update habit");
    }
  };

  const handleDeleteHabit = async () => {
    try {
      await deleteHabitMutation.mutateAsync(habitId);
      toast.success("Habit deleted");
      router.push("/goals");
    } catch {
      toast.error("Failed to delete habit");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="space-y-6">
        {/* Header navigation & actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/goals"
            className="text-[#161514] bg-[#FAF8F5] hover:bg-white flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <ArrowLeft className="h-4 w-4 stroke-[2.5]" /> Back to Goals
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditOpen(true)}
              className="rounded-xl border-2 border-[#161514] text-[#161514] bg-[#CEF431] hover:bg-[#bce023] font-black text-xs px-3 py-1.5 shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="rounded-xl border-2 border-[#161514] text-rose-800 bg-rose-100 hover:bg-rose-200 font-black text-xs px-3 py-1.5 shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>

        {/* Habit Hero Overview Card */}
        <div className="bg-white rounded-2xl p-6 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border",
                    archetypeConfig.badgeBg
                  )}
                >
                  {archetypeConfig.label}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-[#161514] bg-amber-300 text-[#161514]">
                  {habit.frequency?.type || "DAILY"}
                </span>
                {habit.reminderTime && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md border border-[#161514] bg-zinc-100 text-[#161514] flex items-center gap-1">
                    <Clock className="size-3" />
                    {habit.reminderTime}
                  </span>
                )}
              </div>
              <h1
                className="text-2xl sm:text-3xl font-black text-[#161514] leading-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {habit.title}
              </h1>
              <p className="text-xs font-bold text-[#161514]/70">
                {archetypeConfig.quip}
              </p>
            </div>

            <div className="shrink-0 flex items-center justify-center">
              <HabitCompanionSprite
                iconName={habit.icon}
                habitTitle={habit.title}
                isCelebrating={isTodayCompleted}
                className="w-16 h-16"
              />
            </div>
          </div>

          {/* Interactive Check-in Banner for Today */}
          <div
            onClick={handleToggleToday}
            className={cn(
              "rounded-2xl p-4 border-2 border-[#161514] flex items-center justify-between gap-4 cursor-pointer transition-all shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none select-none",
              isTodayCompleted
                ? "bg-[#03D26F] text-[#161514]"
                : isTodayRestDay
                ? "bg-zinc-100 text-[#161514] border-dashed"
                : "bg-[#FAF8F5] text-[#161514] hover:bg-amber-100/60"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-9 rounded-xl border-2 border-[#161514] flex items-center justify-center text-base font-black transition-all shadow-[1.5px_1.5px_0px_0px_#161514]",
                  isTodayCompleted
                    ? "bg-[#161514] text-[#03D26F]"
                    : "bg-white text-[#161514]"
                )}
              >
                {isTodayCompleted ? <Check className="size-5 stroke-[3]" /> : ""}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-xs font-black uppercase tracking-wider"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {isTodayCompleted
                      ? "Completed Today!"
                      : isTodayRestDay
                      ? "Rest Day Scheduled"
                      : "Check-in For Today"}
                  </span>
                  {isTodayRestDay && (
                    <span className="text-[9px] font-black uppercase bg-zinc-200 text-zinc-700 px-1.5 py-0.2 rounded border border-[#161514]">
                      💤 Rest
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-bold opacity-80 mt-0.5">
                  {isTodayCompleted
                    ? "Great work! Tap again anytime if you need to undo."
                    : isTodayRestDay
                    ? "Habit is scheduled for other days. Tap to log an extra session!"
                    : "Tap to lock in today's streak."}
                </p>
              </div>
            </div>

            <span className="text-xs font-black px-2.5 py-1 rounded-xl border-2 border-[#161514] bg-white text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
              {isTodayCompleted ? "Done ✓" : "Log +"}
            </span>
          </div>

          {/* Stats 4-Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#FAF8F5] rounded-xl p-3 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex flex-col items-center justify-center text-center">
              <Flame className="size-5 text-rose-600 fill-rose-600" />
              <span className="text-[9px] font-black text-[#161514]/70 uppercase tracking-wider mt-1">
                Streak
              </span>
              <span
                className="text-xl font-black text-[#161514] mt-0.5"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {streak?.currentStreak || 0}d
              </span>
            </div>

            <div className="bg-[#FAF8F5] rounded-xl p-3 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex flex-col items-center justify-center text-center">
              <Award className="size-5 text-amber-500" />
              <span className="text-[9px] font-black text-[#161514]/70 uppercase tracking-wider mt-1">
                Best Streak
              </span>
              <span
                className="text-xl font-black text-[#161514] mt-0.5"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {streak?.longestStreak || 0}d
              </span>
            </div>

            <div className="bg-[#FAF8F5] rounded-xl p-3 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex flex-col items-center justify-center text-center">
              <Zap className="size-5 text-emerald-600" />
              <span className="text-[9px] font-black text-[#161514]/70 uppercase tracking-wider mt-1">
                30D Rate
              </span>
              <span
                className="text-xl font-black text-[#161514] mt-0.5"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {stats30.completionRate}%
              </span>
            </div>

            <div className="bg-[#FAF8F5] rounded-xl p-3 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="size-5 text-sky-600" />
              <span className="text-[9px] font-black text-[#161514]/70 uppercase tracking-wider mt-1">
                Total Check-ins
              </span>
              <span
                className="text-xl font-black text-[#161514] mt-0.5"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {stats30.completedCount}
              </span>
            </div>
          </div>
        </div>

        {/* 30-Day Heatmap Card */}
        <div className="bg-white rounded-2xl p-6 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-[#161514]" />
              <h2
                className="text-xs font-black uppercase tracking-wider text-[#161514]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                30-Day Consistency Heatmap
              </h2>
            </div>
            <span className="text-[10px] font-black uppercase text-[#161514]/70">
              {stats30.completedCount} / {stats30.scheduledCount} Scheduled Done
            </span>
          </div>

          {/* Heatmap Grid */}
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {days30.map((d) => {
              const dStr = format(d, "yyyy-MM-dd");
              const isToday = isSameDay(d, today);
              const isRest = isDateRestDay(d);
              const isDone = monthLogs.some(
                (l) => l.habitId === habitId && l.date === dStr && l.completed
              );

              return (
                <div
                  key={dStr}
                  title={`${format(d, "MMM d")}: ${
                    isDone ? "Completed" : isRest ? "Rest Day" : "Missed"
                  }`}
                  className={cn(
                    "flex flex-col items-center justify-center p-1.5 rounded-xl border-2 border-[#161514] transition-all text-center",
                    isDone
                      ? "bg-[#03D26F] text-[#161514] shadow-[2px_2px_0px_0px_#161514]"
                      : isRest
                      ? "bg-zinc-100 text-zinc-400 border-dashed"
                      : "bg-[#FAF8F5] text-[#161514]/70 shadow-[1px_1px_0px_0px_#161514]",
                    isToday && "ring-2 ring-[#161514] ring-offset-1 font-black"
                  )}
                >
                  <span className="text-[8px] font-black uppercase">
                    {format(d, "EEE")}
                  </span>
                  <span className="text-[11px] font-black mt-0.5">
                    {format(d, "d")}
                  </span>
                  <span className="text-[9px] mt-0.5">
                    {isDone ? "✓" : isRest ? "💤" : "·"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-[#161514]/70 pt-2 border-t border-[#161514]/10 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-md bg-[#03D26F] border border-[#161514]" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-md bg-zinc-100 border border-[#161514] border-dashed" />
              <span>Rest Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-md bg-[#FAF8F5] border border-[#161514]" />
              <span>Pending / Missed</span>
            </div>
          </div>
        </div>

        {/* Schedule & Rules Card */}
        <div className="bg-white rounded-2xl p-6 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-[#161514]" />
            <h2
              className="text-xs font-black uppercase tracking-wider text-[#161514]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Frequency & Schedule Rules
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border-2 border-[#161514]">
              <span className="text-xs font-black text-[#161514]">Frequency Mode</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border border-[#161514] bg-[#CEF431] text-[#161514]">
                {habit.frequency?.type || "DAILY"}
              </span>
            </div>

            {habit.frequency?.type === "customDays" && (
              <div className="p-3 rounded-xl bg-[#FAF8F5] border-2 border-[#161514] space-y-2">
                <span className="text-xs font-black text-[#161514] block">
                  Scheduled Days of Week
                </span>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS_OF_WEEK.map((dayName, idx) => {
                    const isScheduled =
                      Array.isArray(habit.frequency.daysOfWeek) &&
                      habit.frequency.daysOfWeek.includes(idx);
                    return (
                      <div
                        key={dayName}
                        className={cn(
                          "py-1.5 rounded-lg border-2 border-[#161514] text-center text-[10px] font-black transition-all",
                          isScheduled
                            ? "bg-[#03D26F] text-[#161514] shadow-[1px_1px_0px_0px_#161514]"
                            : "bg-zinc-100 text-zinc-400 border-dashed"
                        )}
                      >
                        {dayName}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border-2 border-[#161514]">
              <span className="text-xs font-black text-[#161514]">Daily Reminder</span>
              <span className="text-xs font-bold text-[#161514]">
                {habit.reminderTime ? `⏰ ${habit.reminderTime}` : "None set"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border-2 border-[#161514]">
              <span className="text-xs font-black text-[#161514]">Grace Skip Shield</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border border-[#161514] bg-white text-[#161514]">
                {habit.allowGraceSkip ? "Enabled" : "Standard"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ResponsiveFormContainer
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit Habit"
        description="Update your settings or tracking options"
      >
        <NewHabitForm
          initialValues={habit}
          onSubmit={handleUpdateHabit}
          loading={updateHabitMutation.isPending}
        />
      </ResponsiveFormContainer>

      <DeleteConfirmationModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteHabit}
        title="Delete Habit"
        description="Are you sure you want to delete this habit? This cannot be undone."
      />
    </div>
  );
}
