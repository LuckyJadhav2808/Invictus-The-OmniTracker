"use client";

import React, { useState } from "react";
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BookOpen,
  Coffee,
  CheckCircle2,
  ChevronRight,
  Flame,
} from "lucide-react";
import { useLiveActivityStore } from "@/store/live-activity-store";
import { soundFX } from "@/components/shared/SoundFX";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { type Subject } from "@/types";

interface PomodoroTimerWidgetProps {
  subjects?: Subject[];
  onSessionComplete?: (sessionData: {
    durationMinutes: number;
    subjectName?: string;
    notes?: string;
  }) => void;
}

const PRESETS = [
  { label: "25m Focus", minutes: 25, phase: "focus" as const, icon: BookOpen, color: "bg-[#CEF431]" },
  { label: "50m Deep", minutes: 50, phase: "focus" as const, icon: Flame, color: "bg-[#C084FC]" },
  { label: "5m Break", minutes: 5, phase: "break" as const, icon: Coffee, color: "bg-[#03D26F]" },
  { label: "15m Break", minutes: 15, phase: "break" as const, icon: Sparkles, color: "bg-[#FED7AA]" },
];

export function PomodoroTimerWidget({ subjects = [], onSessionComplete }: PomodoroTimerWidgetProps) {
  const {
    activeActivity,
    pomodoro,
    startPomodoro,
    togglePausePomodoro,
    addPomodoroMinutes,
    stopPomodoro,
  } = useLiveActivityStore();

  const isPomodoroActive = activeActivity === "pomodoro";
  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0]?.name || "Deep Study");

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStartPreset = (minutes: number, phase: "focus" | "break") => {
    soundFX.playPop();
    soundFX.vibrate(25);
    startPomodoro(minutes, selectedSubject, phase);
    toast.success(`Pomodoro Started: ${minutes}m ${phase === "focus" ? "Deep Focus" : "Rest Break"}! 🎯`, {
      description: "Now tracking in the Dynamic Island dock at the top of your screen.",
    });
  };

  return (
    <div className="bg-[#FAF8F5] rounded-3xl border-[2.5px] border-[#161514] p-5 md:p-6 shadow-[4px_4px_0px_0px_#161514] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-2xl bg-[#C084FC] border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
            <Clock className="size-5 stroke-[2.5] text-[#161514]" />
          </span>
          <div>
            <h3 className="font-heading font-black text-sm md:text-base text-[#161514] uppercase tracking-wider flex items-center gap-2">
              <span>Pomodoro Focus Station</span>
              <span className="bg-[#CEF431] text-[#161514] text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-[#161514]">
                Island Synced
              </span>
            </h3>
            <p className="text-xs text-[#161514]/60 font-bold">
              Stay in flow state. Tracks in background while you review notes.
            </p>
          </div>
        </div>

        {/* Subject selector */}
        {subjects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-[#161514]/60">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-white border-2 border-[#161514] rounded-xl px-2.5 py-1 text-xs font-black text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] outline-none cursor-pointer"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.name}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Hero Timer Display */}
      <div className="bg-white rounded-2xl border-2 border-[#161514] p-5 text-center shadow-[3px_3px_0px_0px_#161514] relative overflow-hidden">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span
            className={cn(
              "text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-[#161514]",
              isPomodoroActive
                ? pomodoro.phase === "focus"
                  ? "bg-[#CEF431] text-[#161514]"
                  : "bg-[#03D26F] text-[#161514]"
                : "bg-gray-100 text-[#161514]/60"
            )}
          >
            {isPomodoroActive
              ? `${pomodoro.phase === "focus" ? "🔥 FOCUS PHASE" : "☕ BREAK PHASE"} • ${pomodoro.subjectName}`
              : "IDLE • SELECT A PRESET TO BEGIN"}
          </span>
        </div>

        {/* Big Digits */}
        <div className="font-mono text-5xl md:text-6xl font-black text-[#161514] tracking-tight my-2">
          {formatTime(isPomodoroActive ? pomodoro.secondsLeft : 25 * 60)}
        </div>

        {/* Progress Bar */}
        {isPomodoroActive && (
          <div className="w-full max-w-md mx-auto h-2.5 bg-[#F1EFEA] border border-[#161514] rounded-full overflow-hidden mt-3">
            <div
              className={cn(
                "h-full transition-all duration-500",
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
        )}

        {/* Live Island Banner Note */}
        <div className="mt-3 inline-flex items-center gap-2 text-[11px] font-bold text-[#161514]/70 bg-[#FAF8F5] px-3 py-1 rounded-full border border-[#161514]/20">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Synced with Dynamic Island at top of screen</span>
        </div>
      </div>

      {/* Preset Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleStartPreset(preset.minutes, preset.phase)}
              className={cn(
                "p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]",
                "hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
                "transition-all duration-150 flex flex-col items-center justify-center gap-1.5 cursor-pointer font-black text-xs uppercase",
                preset.color
              )}
            >
              <Icon className="size-4 stroke-[2.5]" />
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Session Controls (if running) */}
      {isPomodoroActive && (
        <div className="pt-2 border-t-2 border-[#161514]/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                togglePausePomodoro();
              }}
              className="bg-white hover:bg-[#FFF9EA] text-[#161514] font-black text-xs uppercase tracking-wider py-2 px-4 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center gap-1.5 cursor-pointer active:translate-y-0.5"
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
              className="bg-[#CEF431] hover:bg-[#D8F74E] text-[#161514] font-black text-xs uppercase tracking-wider py-2 px-3 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] cursor-pointer active:translate-y-0.5"
            >
              +5 Min
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              stopPomodoro();
              toast.info("Pomodoro Session Dismissed");
            }}
            className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-black text-xs uppercase tracking-wider py-2 px-3 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center gap-1 cursor-pointer active:translate-y-0.5"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset Timer</span>
          </button>
        </div>
      )}
    </div>
  );
}
