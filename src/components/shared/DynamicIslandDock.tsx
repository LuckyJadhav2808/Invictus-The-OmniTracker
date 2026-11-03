"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Timer,
  Play,
  Pause,
  ChevronUp,
  X,
  Flame,
  ArrowUpRight,
  Sparkles,
  Dumbbell,
  Clock,
  BookOpen,
  Wallet,
} from "lucide-react";
import { useLiveActivityStore } from "@/store/live-activity-store";
import { soundFX } from "@/components/shared/SoundFX";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DynamicIslandDockProps {
  variant?: "header" | "mobile";
}

export function DynamicIslandDock({ variant = "header" }: DynamicIslandDockProps) {
  const router = useRouter();

  const {
    activeActivity,
    isExpanded,
    isAmbientDismissed,
    gymRest,
    pomodoro,
    ambient,
    setIsExpanded,
    toggleExpanded,
    dismissAmbient,
    togglePauseGymRest,
    addGymRestSeconds,
    stopGymRest,
    tickGymRest,
    togglePausePomodoro,
    addPomodoroMinutes,
    stopPomodoro,
    tickPomodoro,
    startPomodoro,
  } = useLiveActivityStore();

  const islandRef = useRef<HTMLDivElement>(null);
  const prevGymSecondsRef = useRef<number | null>(null);
  const prevPomoSecondsRef = useRef<number | null>(null);

  // 1. Unified Background Ticker Loop for Live Activities
  useEffect(() => {
    // Only run the ticker loop in the header variant to avoid duplicate intervals
    if (variant !== "header") return;

    const isGymRunning = activeActivity === "gym_rest" && !gymRest.isPaused && Boolean(gymRest.targetEndTime);
    const isPomoRunning = activeActivity === "pomodoro" && !pomodoro.isPaused && Boolean(pomodoro.targetEndTime);

    if (!isGymRunning && !isPomoRunning) return;

    const interval = setInterval(() => {
      if (isGymRunning) {
        tickGymRest();
      }
      if (isPomoRunning) {
        tickPomodoro();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [variant, activeActivity, gymRest.isPaused, gymRest.targetEndTime, pomodoro.isPaused, pomodoro.targetEndTime, tickGymRest, tickPomodoro]);

  // 2. Audio & Haptic Alarm on Timer Finish (only in primary variant)
  useEffect(() => {
    if (variant !== "header") return;

    // Gym rest finished
    if (
      prevGymSecondsRef.current !== null &&
      prevGymSecondsRef.current > 0 &&
      gymRest.secondsLeft === 0 &&
      activeActivity === "none"
    ) {
      soundFX.playRestDoneDoubleBeep();
      soundFX.vibrate([60, 60, 100]);
      toast.success("REST OVER — CRUSH THE NEXT SET! 🏋️", {
        description: gymRest.exerciseName ? `Up next: ${gymRest.exerciseName}` : undefined,
      });
    }
    prevGymSecondsRef.current = gymRest.secondsLeft;
  }, [variant, gymRest.secondsLeft, gymRest.exerciseName, activeActivity]);

  useEffect(() => {
    if (variant !== "header") return;

    // Pomodoro finished
    if (
      prevPomoSecondsRef.current !== null &&
      prevPomoSecondsRef.current > 0 &&
      pomodoro.secondsLeft === 0 &&
      activeActivity === "none"
    ) {
      soundFX.playCompleteChime();
      soundFX.vibrate([80, 50, 80]);
      toast.success(
        pomodoro.phase === "focus"
          ? "POMODORO SESSION COMPLETE! 🎯 Awesome discipline!"
          : "BREAK TIME OVER — Back to deep work! 📚"
      );
    }
    prevPomoSecondsRef.current = pomodoro.secondsLeft;
  }, [variant, pomodoro.secondsLeft, pomodoro.phase, activeActivity]);

  // 3. Click-outside to collapse expanded HUD
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (islandRef.current && !islandRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded, setIsExpanded]);

  // Format Helper
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Determine current active mode
  const currentMode: "gym_rest" | "pomodoro" | "ambient" =
    activeActivity === "gym_rest"
      ? "gym_rest"
      : activeActivity === "pomodoro"
      ? "pomodoro"
      : "ambient";

  // Hide ambient pill if dismissed by user
  if (currentMode === "ambient" && isAmbientDismissed) {
    return null;
  }

  const handlePillClick = () => {
    soundFX.playPop();
    soundFX.vibrate(15);
    toggleExpanded();
  };

  return (
    <div
      ref={islandRef}
      className={cn(
        "select-none transition-all duration-300 ease-out",
        variant === "header"
          ? "relative flex items-center justify-center"
          : "lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40"
      )}
      role="region"
      aria-label="Live Activity Dynamic Island"
    >
      {/* ================= COMPACT PILL MODE ================= */}
      {!isExpanded && (
        <div
          role="button"
          tabIndex={0}
          onClick={handlePillClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handlePillClick();
            }
          }}
          className={cn(
            "group h-8 px-3 py-1 rounded-full border flex items-center gap-2 cursor-pointer shadow-xs",
            "hover:border-[#161514]/20 dark:hover:border-white/20 transition-all duration-200 shrink-0",
            currentMode === "gym_rest"
              ? "bg-[#161514] text-white border-neutral-700"
              : currentMode === "pomodoro"
              ? "bg-[#161514] text-white border-neutral-700"
              : "bg-[#F1EFEA] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#383531]"
          )}
        >
          {/* Gym Rest Pill */}
          {currentMode === "gym_rest" && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
                <Dumbbell className="size-3.5 stroke-[1.75]" />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider">
                  Rest:
                </span>
                <span className="font-mono text-xs font-semibold tracking-tight text-white">
                  {formatTime(gymRest.secondsLeft)}
                </span>
              </div>

              {/* Mini progress bar inside pill */}
              <div className="w-8 h-1 bg-white/20 rounded-full overflow-hidden hidden xs:block">
                <div
                  className="h-full bg-[#03D26F] transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, (gymRest.secondsLeft / (gymRest.totalSeconds || 1)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </>
          )}

          {/* Pomodoro Pill */}
          {currentMode === "pomodoro" && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
                </span>
                <BookOpen className="size-3.5 stroke-[1.75]" />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider truncate max-w-[80px] sm:max-w-[120px]">
                  {pomodoro.subjectName}:
                </span>
                <span className="font-mono text-xs font-semibold tracking-tight text-white">
                  {formatTime(pomodoro.secondsLeft)}
                </span>
              </div>
            </>
          )}

          {/* Ambient Pill */}
          {currentMode === "ambient" && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#03D26F]" />
                <Wallet className="size-3.5 stroke-[1.75] text-[#161514] dark:text-[#FAF8F5]" />
              </div>

              <span className="text-xs font-medium tracking-tight flex items-center gap-1">
                <span className="font-semibold text-[#161514] dark:text-[#FAF8F5]">
                  {ambient.currencySymbol}
                  {Math.round(ambient.dailyCashLeft || 0).toLocaleString()}
                </span>
                <span className="text-[#8C8882] dark:text-[#A8A29E] text-[10px]">left</span>
              </span>

              {ambient.totalHabits > 0 && (
                <>
                  <span className="text-[#8C8882]/40 dark:text-[#A8A29E]/40 font-bold">•</span>
                  <div className="flex items-center gap-1 text-xs font-medium text-[#161514] dark:text-[#FAF8F5]">
                    <Flame className="size-3 stroke-[1.75] text-amber-500 fill-amber-400" />
                    <span>
                      {ambient.habitsCompleted}/{ambient.totalHabits}
                    </span>
                  </div>
                </>
              )}

              {/* 1-Tap Dismiss Ambient Pill */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundFX.playPop();
                  dismissAmbient();
                  toast.info("Ambient dock minimized until your next workout or study session.");
                }}
                className="size-4 rounded-full hover:bg-[#E8E5DF] dark:hover:bg-[#383531] flex items-center justify-center text-[#8C8882] hover:text-[#161514] dark:hover:text-[#FAF8F5] transition-colors ml-0.5 cursor-pointer"
                title="Dismiss ambient pill"
              >
                <X className="size-2.5 stroke-[2]" />
              </button>
            </>
          )}

          <ChevronUp className="size-3 stroke-[2] rotate-180 opacity-50 group-hover:opacity-100 transition-opacity ml-0.5" />
        </div>
      )}

      {/* ================= EXPANDED HUD MODE ================= */}
      {isExpanded && (
        <div
          className={cn(
            "bg-white dark:bg-[#1C1A18] rounded-2xl border border-[#E8E5DF] dark:border-[#383531] shadow-2xl p-4 sm:p-5 space-y-3.5 animate-in fade-in-0 zoom-in-95 duration-200 z-50",
            variant === "header"
              ? "absolute top-full mt-2 left-1/2 -translate-x-1/2 w-[390px] max-w-[92vw]"
              : "fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100vw-28px)] max-w-md"
          )}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-[#E8E5DF] dark:border-[#383531] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg border border-[#E8E5DF] dark:border-[#383531] bg-[#F1EFEA] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] shadow-xs">
                {currentMode === "gym_rest" ? (
                  <Dumbbell className="size-4 stroke-[1.75]" />
                ) : currentMode === "pomodoro" ? (
                  <BookOpen className="size-4 stroke-[1.75]" />
                ) : (
                  <Sparkles className="size-4 stroke-[1.75]" />
                )}
              </span>

              <div>
                <h4 className="text-xs font-semibold text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                  {currentMode === "gym_rest"
                    ? "Gladiator Rest HUD"
                    : currentMode === "pomodoro"
                    ? "Pomodoro Deep Work"
                    : "Invictus Telemetry Dock"}
                </h4>
                <p className="text-[10px] text-[#8C8882] dark:text-[#A8A29E]">
                  {currentMode === "gym_rest"
                    ? gymRest.exerciseName || "Active Set Recovery"
                    : currentMode === "pomodoro"
                    ? `${pomodoro.subjectName} • ${pomodoro.phase.toUpperCase()}`
                    : "Ambient Daily Cockpit"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                setIsExpanded(false);
              }}
              className="bg-[#F1EFEA] dark:bg-[#252321] hover:bg-[#E8E5DF] dark:hover:bg-[#383531] text-[#161514] dark:text-[#FAF8F5] p-1.5 rounded-lg border border-[#E8E5DF] dark:border-[#383531] shadow-xs transition-colors cursor-pointer"
              title="Collapse Dock"
            >
              <ChevronUp className="size-3.5 stroke-[2]" />
            </button>
          </div>

          {/* ================= GYM REST EXPANDED CONTENT ================= */}
          {currentMode === "gym_rest" && (
            <div className="space-y-3">
              <div className="bg-[#FAF8F5] dark:bg-[#121110] rounded-xl border border-[#E8E5DF] dark:border-[#383531] p-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span
                    className={cn(
                      "font-mono text-4xl sm:text-5xl font-bold tracking-tight",
                      gymRest.secondsLeft <= 5 ? "text-rose-600 animate-pulse" : "text-[#161514] dark:text-[#FAF8F5]"
                    )}
                  >
                    {formatTime(gymRest.secondsLeft)}
                  </span>
                </div>

                {/* Progress track */}
                <div className="w-full h-2 bg-[#E8E5DF] dark:bg-[#383531] rounded-full overflow-hidden mt-2.5">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      gymRest.secondsLeft <= 5 ? "bg-rose-500" : "bg-[#03D26F]"
                    )}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, (gymRest.secondsLeft / (gymRest.totalSeconds || 1)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Action Controls */}
              <div className="grid grid-cols-4 gap-2">
                {/* -15s */}
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    addGymRestSeconds(-15);
                  }}
                  className="bg-white dark:bg-[#252321] hover:bg-[#F1EFEA] dark:hover:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] py-2 rounded-lg border border-[#E8E5DF] dark:border-[#383531] font-medium text-xs cursor-pointer shadow-xs transition-colors"
                >
                  -15s
                </button>

                {/* +30s */}
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    addGymRestSeconds(30);
                  }}
                  className="bg-[#F1EFEA] dark:bg-[#252321] hover:bg-[#E8E5DF] dark:hover:bg-[#383531] text-[#161514] dark:text-[#FAF8F5] py-2 rounded-lg border border-[#E8E5DF] dark:border-[#383531] font-medium text-xs cursor-pointer shadow-xs transition-colors"
                >
                  +30s
                </button>

                {/* Pause/Resume */}
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    togglePauseGymRest();
                  }}
                  className="bg-white dark:bg-[#252321] hover:bg-[#F1EFEA] dark:hover:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] py-2 rounded-lg border border-[#E8E5DF] dark:border-[#383531] font-medium text-xs flex items-center justify-center cursor-pointer shadow-xs transition-colors"
                >
                  {gymRest.isPaused ? (
                    <Play className="size-3.5 fill-current" />
                  ) : (
                    <Pause className="size-3.5 fill-current" />
                  )}
                </button>

                {/* Skip / End */}
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    stopGymRest();
                  }}
                  className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 py-2 rounded-lg border border-rose-200 dark:border-rose-900 font-medium text-xs cursor-pointer transition-colors"
                >
                  Skip
                </button>
              </div>

              {/* Jump to Gym Tracker */}
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setIsExpanded(false);
                  router.push("/goals/gym");
                }}
                className="w-full bg-[#161514] dark:bg-[#CEF431] hover:bg-neutral-800 dark:hover:bg-[#b8dc2d] text-white dark:text-[#161514] font-medium text-xs py-2.5 rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors font-heading font-black"
              >
                <span>Jump to Workout Routine</span>
                <ArrowUpRight className="size-3.5 stroke-[1.75]" />
              </button>
            </div>
          )}

          {/* ================= POMODORO EXPANDED CONTENT ================= */}
          {currentMode === "pomodoro" && (
            <div className="space-y-3">
              <div className="bg-[#FAF8F5] dark:bg-[#121110] rounded-xl border border-[#E8E5DF] dark:border-[#383531] p-3 text-center">
                <span className="font-mono text-4xl sm:text-5xl font-bold tracking-tight text-[#161514] dark:text-[#FAF8F5]">
                  {formatTime(pomodoro.secondsLeft)}
                </span>

                <div className="w-full h-2 bg-[#E8E5DF] dark:bg-[#383531] rounded-full overflow-hidden mt-2.5">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      pomodoro.phase === "focus" ? "bg-purple-600 dark:bg-[#C084FC]" : "bg-[#03D26F]"
                    )}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, (pomodoro.secondsLeft / (pomodoro.totalSeconds || 1)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    togglePausePomodoro();
                  }}
                  className="bg-white dark:bg-[#252321] hover:bg-[#F1EFEA] dark:hover:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] py-2 rounded-lg border border-[#E8E5DF] dark:border-[#383531] font-medium text-xs flex items-center justify-center gap-1 cursor-pointer shadow-xs transition-colors"
                >
                  {pomodoro.isPaused ? (
                    <>
                      <Play className="size-3.5 fill-current" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="size-3.5 fill-current" />
                      <span>Pause</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    addPomodoroMinutes(5);
                  }}
                  className="bg-[#F1EFEA] dark:bg-[#252321] hover:bg-[#E8E5DF] dark:hover:bg-[#383531] text-[#161514] dark:text-[#FAF8F5] py-2 rounded-lg border border-[#E8E5DF] dark:border-[#383531] font-medium text-xs cursor-pointer shadow-xs transition-colors"
                >
                  +5 Mins
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    stopPomodoro();
                  }}
                  className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 py-2 rounded-lg border border-rose-200 dark:border-rose-900 font-medium text-xs cursor-pointer transition-colors"
                >
                  End
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setIsExpanded(false);
                  router.push("/study");
                }}
                className="w-full bg-[#161514] dark:bg-[#C084FC] hover:bg-neutral-800 dark:hover:bg-[#a855f7] text-white dark:text-[#161514] font-medium text-xs py-2.5 rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors font-heading font-black"
              >
                <span>Jump to Study Space</span>
                <ArrowUpRight className="size-3.5 stroke-[1.75]" />
              </button>
            </div>
          )}

          {/* ================= AMBIENT EXPANDED CONTENT ================= */}
          {currentMode === "ambient" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                {/* Daily Cash Left Card */}
                <div className="bg-[#FAF8F5] dark:bg-[#252321] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#383531]">
                  <span className="text-[10px] font-medium text-[#8C8882] dark:text-[#A8A29E] uppercase tracking-wider block">
                    Daily Cash Left
                  </span>
                  <span className="text-xl font-bold font-sans text-[#161514] dark:text-[#FAF8F5] block mt-0.5">
                    {ambient.currencySymbol}
                    {Math.round(ambient.dailyCashLeft || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#8C8882] dark:text-[#A8A29E]">Safe to spend</span>
                </div>

                {/* Habit Streak Card */}
                <div className="bg-[#FAF8F5] dark:bg-[#252321] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#383531]">
                  <span className="text-[10px] font-medium text-[#8C8882] dark:text-[#A8A29E] uppercase tracking-wider block">
                    Today&apos;s Habits
                  </span>
                  <span className="text-xl font-bold font-sans text-[#161514] dark:text-[#FAF8F5] block mt-0.5">
                    {ambient.habitsCompleted}/{ambient.totalHabits}
                  </span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Flame className="size-3 fill-amber-500 text-amber-600" />
                    <span>{ambient.activeStreak} day streak</span>
                  </span>
                </div>
              </div>

              {/* Quick Launch Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setIsExpanded(false);
                    startPomodoro(25, "Deep Focus", "focus");
                  }}
                  className="bg-white dark:bg-[#252321] hover:bg-[#F1EFEA] dark:hover:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] font-medium text-xs py-2 px-3 rounded-lg border border-[#E8E5DF] dark:border-[#383531] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Clock className="size-3.5 stroke-[1.75]" />
                  <span>25m Focus</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setIsExpanded(false);
                    router.push("/money");
                  }}
                  className="bg-[#161514] dark:bg-[#CEF431] hover:bg-neutral-800 dark:hover:bg-[#b8dc2d] text-white dark:text-[#161514] font-medium text-xs py-2 px-3 rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors font-heading font-black"
                >
                  <Wallet className="size-3.5 stroke-[1.75]" />
                  <span>Money Space</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
