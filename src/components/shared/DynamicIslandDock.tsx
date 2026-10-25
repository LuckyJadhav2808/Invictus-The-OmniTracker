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
            "group h-9 px-3 py-1 rounded-full border-2 border-[#161514] flex items-center gap-2 cursor-pointer",
            "shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#161514]",
            "hover:-translate-y-0.5 transition-all duration-200 shrink-0",
            currentMode === "gym_rest"
              ? "bg-[#CEF431] text-[#161514]"
              : currentMode === "pomodoro"
              ? "bg-[#C084FC] text-[#161514]"
              : "bg-[#FAF8F5] text-[#161514]"
          )}
        >
          {/* Gym Rest Pill */}
          {currentMode === "gym_rest" && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                </span>
                <Dumbbell className="size-3.5 stroke-[2.5]" />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Rest:
                </span>
                <span className="font-mono text-xs font-black tracking-tight">
                  {formatTime(gymRest.secondsLeft)}
                </span>
              </div>

              {/* Mini progress bar inside pill */}
              <div className="w-8 h-1.5 bg-[#161514]/20 rounded-full overflow-hidden hidden xs:block">
                <div
                  className="h-full bg-[#161514] transition-all duration-500"
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
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                </span>
                <BookOpen className="size-3.5 stroke-[2.5]" />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider truncate max-w-[80px] sm:max-w-[120px]">
                  {pomodoro.subjectName}:
                </span>
                <span className="font-mono text-xs font-black tracking-tight">
                  {formatTime(pomodoro.secondsLeft)}
                </span>
              </div>
            </>
          )}

          {/* Ambient Pill */}
          {currentMode === "ambient" && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#03D26F] animate-pulse" />
                <Wallet className="size-3 stroke-[2.5] text-[#161514]" />
              </div>

              <span className="text-[11px] font-black tracking-tight flex items-center gap-1">
                <span>
                  {ambient.currencySymbol}
                  {Math.round(ambient.dailyCashLeft || 0).toLocaleString()}
                </span>
                <span className="text-[#161514]/60 font-semibold text-[9px]">left today</span>
              </span>

              {ambient.totalHabits > 0 && (
                <>
                  <span className="text-[#161514]/30 font-bold">•</span>
                  <div className="flex items-center gap-1 text-[11px] font-black">
                    <Flame className="size-3 stroke-[2.5] text-amber-500 fill-amber-400" />
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
                className="size-4 rounded-full hover:bg-[#161514]/15 flex items-center justify-center text-[#161514]/40 hover:text-[#161514] transition-colors ml-0.5 cursor-pointer"
                title="Dismiss ambient pill"
              >
                <X className="size-2.5 stroke-[3]" />
              </button>
            </>
          )}

          <ChevronUp className="size-3 stroke-[3] rotate-180 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
        </div>
      )}

      {/* ================= EXPANDED HUD MODE ================= */}
      {isExpanded && (
        <div
          className={cn(
            "bg-[#FAF8F5] rounded-3xl border-[2.5px] border-[#161514] shadow-[5px_5px_0px_0px_#161514] p-4 sm:p-5 space-y-3.5 animate-in fade-in-0 zoom-in-95 duration-200 z-50",
            variant === "header"
              ? "absolute top-full mt-2 left-1/2 -translate-x-1/2 w-[390px] max-w-[92vw]"
              : "fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100vw-28px)] max-w-md"
          )}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b-2 border-[#161514]/15 pb-2.5">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "p-1.5 rounded-xl border border-[#161514] shadow-[1px_1px_0px_0px_#161514]",
                  currentMode === "gym_rest"
                    ? "bg-[#CEF431]"
                    : currentMode === "pomodoro"
                    ? "bg-[#C084FC]"
                    : "bg-[#03D26F]"
                )}
              >
                {currentMode === "gym_rest" ? (
                  <Dumbbell className="size-4 stroke-[2.5]" />
                ) : currentMode === "pomodoro" ? (
                  <BookOpen className="size-4 stroke-[2.5]" />
                ) : (
                  <Sparkles className="size-4 stroke-[2.5]" />
                )}
              </span>

              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[#161514] font-heading">
                  {currentMode === "gym_rest"
                    ? "Gladiator Rest HUD"
                    : currentMode === "pomodoro"
                    ? "Pomodoro Deep Work"
                    : "Invictus Telemetry Dock"}
                </h4>
                <p className="text-[10px] font-bold text-[#161514]/60">
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
              className="bg-white hover:bg-rose-100 text-[#161514] p-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              title="Collapse Dock"
            >
              <ChevronUp className="size-3.5 stroke-[3]" />
            </button>
          </div>

          {/* ================= GYM REST EXPANDED CONTENT ================= */}
          {currentMode === "gym_rest" && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl border-2 border-[#161514] p-3 text-center shadow-[2px_2px_0px_0px_#161514]">
                <div className="flex items-center justify-center gap-2">
                  <span
                    className={cn(
                      "font-mono text-4xl sm:text-5xl font-black tracking-tight",
                      gymRest.secondsLeft <= 5 ? "text-rose-600 animate-pulse" : "text-[#161514]"
                    )}
                  >
                    {formatTime(gymRest.secondsLeft)}
                  </span>
                </div>

                {/* Progress track */}
                <div className="w-full h-2.5 bg-[#F1EFEA] border border-[#161514] rounded-full overflow-hidden mt-2.5">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      gymRest.secondsLeft <= 5 ? "bg-rose-500" : "bg-[#CEF431]"
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
                  className="bg-white hover:bg-[#FFF9EA] text-[#161514] py-2 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] font-black text-xs cursor-pointer active:translate-y-0.5"
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
                  className="bg-[#CEF431] hover:bg-[#D8F74E] text-[#161514] py-2 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] font-black text-xs cursor-pointer active:translate-y-0.5"
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
                  className="bg-white hover:bg-[#FFF9EA] text-[#161514] py-2 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] font-black text-xs flex items-center justify-center cursor-pointer active:translate-y-0.5"
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
                  className="bg-rose-100 hover:bg-rose-200 text-rose-700 py-2 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] font-black text-xs cursor-pointer active:translate-y-0.5"
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
                  router.push("/goals?tab=gym");
                }}
                className="w-full bg-[#161514] hover:bg-black text-white font-black text-[11px] uppercase tracking-wider py-2.5 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Jump to Workout Routine</span>
                <ArrowUpRight className="size-3.5" />
              </button>
            </div>
          )}

          {/* ================= POMODORO EXPANDED CONTENT ================= */}
          {currentMode === "pomodoro" && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl border-2 border-[#161514] p-3 text-center shadow-[2px_2px_0px_0px_#161514]">
                <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-[#161514]">
                  {formatTime(pomodoro.secondsLeft)}
                </span>

                <div className="w-full h-2.5 bg-[#F1EFEA] border border-[#161514] rounded-full overflow-hidden mt-2.5">
                  <div
                    className={cn(
                      "h-full bg-[#C084FC] transition-all duration-500",
                      pomodoro.phase === "focus" ? "bg-[#C084FC]" : "bg-[#03D26F]"
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
                  className="bg-white hover:bg-[#FFF9EA] text-[#161514] py-2 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] font-black text-xs flex items-center justify-center gap-1 cursor-pointer"
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
                  className="bg-[#C084FC] hover:bg-[#A855F7] text-[#161514] py-2 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] font-black text-xs cursor-pointer"
                >
                  +5 Mins
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    stopPomodoro();
                  }}
                  className="bg-rose-100 hover:bg-rose-200 text-rose-700 py-2 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] font-black text-xs cursor-pointer"
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
                className="w-full bg-[#161514] hover:bg-black text-white font-black text-[11px] uppercase tracking-wider py-2.5 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Jump to Study Space</span>
                <ArrowUpRight className="size-3.5" />
              </button>
            </div>
          )}

          {/* ================= AMBIENT EXPANDED CONTENT ================= */}
          {currentMode === "ambient" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                {/* Daily Cash Left Card */}
                <div className="bg-[#E8F5E9] p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
                  <span className="text-[10px] font-black uppercase text-[#1B5E20] block">
                    Daily Cash Left
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-heading text-[#161514] block mt-0.5">
                    {ambient.currencySymbol}
                    {Math.round(ambient.dailyCashLeft || 0).toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold text-[#1B5E20]/80">Safe to spend</span>
                </div>

                {/* Habit Streak Card */}
                <div className="bg-[#FEF3C7] p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
                  <span className="text-[10px] font-black uppercase text-amber-800 block">
                    Today&apos;s Habits
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-heading text-[#161514] block mt-0.5">
                    {ambient.habitsCompleted}/{ambient.totalHabits}
                  </span>
                  <span className="text-[9px] font-bold text-amber-800/80 flex items-center gap-1">
                    <Flame className="size-2.5 fill-amber-500 text-amber-600" />
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
                  className="bg-[#C084FC] hover:bg-[#A855F7] text-[#161514] font-black text-[11px] uppercase tracking-wider py-2.5 px-3 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-0.5"
                >
                  <Clock className="size-3.5 stroke-[2.5]" />
                  <span>25m Focus</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setIsExpanded(false);
                    router.push("/money");
                  }}
                  className="bg-[#CEF431] hover:bg-[#bde422] text-[#161514] font-black text-[11px] uppercase tracking-wider py-2.5 px-3 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-0.5"
                >
                  <Wallet className="size-3.5 stroke-[2.5]" />
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
