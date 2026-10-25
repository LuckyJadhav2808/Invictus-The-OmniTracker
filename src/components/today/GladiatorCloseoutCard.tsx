"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Wallet,
  Award,
  Zap,
  Smile,
  Meh,
  Frown,
  Moon,
  Send,
} from "lucide-react";
import {
  type DailyConquestMetrics,
  getDaySealStatus,
  sealDayLedger,
  type DaySealRecord,
} from "@/components/today/useTodayCockpitViewModel";
import { soundFX } from "@/components/shared/SoundFX";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GladiatorCloseoutCardProps {
  metrics: DailyConquestMetrics;
  selectedDate: string;
  isToday: boolean;
  onSealComplete?: () => void;
  tomorrowPendingTasksCount?: number;
  tomorrowSafeToSpend?: number;
  currencySymbol?: string;
  currentMood?: string;
  reflectionNote?: string;
  onChangeNote?: (note: string) => void;
  onSaveMood?: (newMood?: string) => Promise<void>;
  isSavingMood?: boolean;
  className?: string;
}

const MOOD_OPTIONS = [
  { id: "awesome", label: "Great", Icon: Zap, bg: "bg-emerald-300" },
  { id: "good", label: "Good", Icon: Smile, bg: "bg-[#CEF431]" },
  { id: "okay", label: "Okay", Icon: Meh, bg: "bg-cyan-200" },
  { id: "low", label: "Low", Icon: Frown, bg: "bg-amber-200" },
  { id: "tired", label: "Tired", Icon: Moon, bg: "bg-rose-200" },
];

export function GladiatorCloseoutCard({
  metrics,
  selectedDate,
  isToday,
  onSealComplete,
  tomorrowPendingTasksCount = 0,
  tomorrowSafeToSpend,
  currencySymbol = "₹",
  currentMood = "good",
  reflectionNote = "",
  onChangeNote,
  onSaveMood,
  isSavingMood = false,
  className,
}: GladiatorCloseoutCardProps) {
  const [sealStatus, setSealStatus] = useState<DaySealRecord>({ isSealed: false });

  // Sync seal status when selectedDate changes
  useEffect(() => {
    setSealStatus(getDaySealStatus(selectedDate));
  }, [selectedDate]);

  const handleSealDay = async () => {
    // If user typed a reflection note that hasn't been saved yet, save it now
    if (onSaveMood && reflectionNote.trim()) {
      try {
        await onSaveMood();
      } catch {}
    }

    const updated = sealDayLedger(selectedDate, metrics.overallScore);
    setSealStatus(updated);

    try {
      soundFX.playCompleteChime();
      soundFX.playBotChirp("salute");
      soundFX.vibrate(30);
    } catch {}

    toast.success("🔥 Day Sealed! Today's conquest score minted into history.");

    if (onSealComplete) {
      onSealComplete();
    }
  };

  const handleMoodSelect = (moodId: string) => {
    soundFX.playPop();
    soundFX.vibrate(15);
    if (onSaveMood) {
      onSaveMood(moodId);
    }
  };

  return (
    <div
      className={cn(
        "bg-[#FAF8F5] border-2 border-[#161514] rounded-2xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_#161514] space-y-4 select-none",
        className
      )}
      role="region"
      aria-label="Gladiator Night Closeout Ritual"
    >
      {/* 1. Header Bar: Thermal Receipt Slip Identity */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-[#161514]/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center shadow-[1px_1px_0px_#161514]">
            <Award className="size-4 text-[#161514]" />
          </div>
          <div>
            <h3 className="font-heading font-black text-xs sm:text-sm text-[#161514] uppercase tracking-wider">
              Gladiator Night Closeout Ritual
            </h3>
            <p className="text-[11px] font-mono text-[#161514]/70">
              {isToday ? "Today's Ledger Archival" : `Ledger for ${selectedDate}`}
            </p>
          </div>
        </div>

        {/* Telemetry Conquest Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border-2 border-[#161514] shadow-[1.5px_1.5px_0px_#161514] font-mono font-black text-xs text-[#161514]">
          <span>⚡</span>
          <span>{metrics.overallScore}% CONQUERED</span>
        </div>
      </div>

      {/* 2. Tri-Pillar Telemetry Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Habits */}
        <div className="bg-white border-2 border-[#161514] rounded-xl p-3 shadow-[1.5px_1.5px_0px_#161514] space-y-1">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-[#161514]">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-[#03D26F]" />
              <span>Habits</span>
            </span>
            <span className="text-[#03D26F] font-black">{metrics.habitPercent}%</span>
          </div>
          <p className="text-xs font-heading font-black text-[#161514]">
            {metrics.completedHabitsCount}/{metrics.totalHabitsCount} Conquered
          </p>
        </div>

        {/* Study Sprint */}
        <div className="bg-white border-2 border-[#161514] rounded-xl p-3 shadow-[1.5px_1.5px_0px_#161514] space-y-1">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-[#161514]">
            <span className="flex items-center gap-1">
              <GraduationCap className="size-3.5 text-[#C084FC]" />
              <span>Study Focus</span>
            </span>
            <span className="text-[#C084FC] font-black">{metrics.studyPercent}%</span>
          </div>
          <p className="text-xs font-heading font-black text-[#161514]">
            {metrics.studyHoursFormatted} / {metrics.studyTargetHoursFormatted} Logged
          </p>
        </div>

        {/* Budget Defense */}
        <div className="bg-white border-2 border-[#161514] rounded-xl p-3 shadow-[1.5px_1.5px_0px_#161514] space-y-1">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-[#161514]">
            <span className="flex items-center gap-1">
              <Wallet className="size-3.5 text-amber-600" />
              <span>Safe Reserve</span>
            </span>
            <span className="text-emerald-600 font-black">{metrics.budgetPercent}%</span>
          </div>
          <p className="text-xs font-heading font-black text-[#161514]">
            {currencySymbol}{metrics.remainingSafeToSpend.toLocaleString()} Safe Left
          </p>
        </div>
      </div>

      {/* 3. Integrated Daily Mindset & Evening Pulse (Things 3 Benchmark) */}
      <div className="bg-white border-2 border-[#161514] rounded-xl p-3.5 shadow-[2px_2px_0px_#161514] space-y-3">
        <div className="flex items-center justify-between border-b border-[#161514]/10 pb-2">
          <div className="flex items-center gap-1.5 font-heading font-black text-xs text-[#161514] uppercase tracking-wide">
            <span>💭</span>
            <span>Daily Mindset & Evening Pulse</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#161514]/60">1-Tap Reflection</span>
        </div>

        {/* 5-scale sentiment buttons */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {MOOD_OPTIONS.map((m) => {
            const Icon = m.Icon;
            const isSelected = currentMood === m.id;

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleMoodSelect(m.id)}
                className={cn(
                  "p-2 rounded-lg border-2 border-[#161514] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95",
                  isSelected
                    ? `${m.bg} shadow-[2px_2px_0px_#161514] scale-[1.02]`
                    : "bg-[#FAF8F5] opacity-65 hover:opacity-100"
                )}
                title={`Mark mood: ${m.label}`}
              >
                <Icon className="size-4 text-[#161514]" />
                <span className="text-[10px] font-heading font-black text-[#161514]">
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Optional 1-line note */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={reflectionNote}
            onChange={(e) => onChangeNote?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isSavingMood && onSaveMood) {
                onSaveMood();
              }
            }}
            placeholder="One-line victory note or closing reflection..."
            className="flex-1 bg-[#FAF8F5] border border-[#161514]/30 rounded-lg px-2.5 py-1.5 text-xs text-[#161514] font-medium placeholder:text-[#161514]/40 focus:outline-none focus:border-[#161514]"
          />
          <button
            type="button"
            onClick={() => onSaveMood?.()}
            disabled={isSavingMood}
            className="px-3 py-1.5 bg-[#161514] text-white rounded-lg text-xs font-heading font-black hover:bg-[#2a2826] active:scale-95 transition-all disabled:opacity-50 cursor-pointer shrink-0 flex items-center gap-1"
          >
            <Send className="size-3" />
            <span>{isSavingMood ? "Saving..." : "Save"}</span>
          </button>
        </div>
      </div>

      {/* 4. 1-Tap Seal & Archival Ritual Button / Wax Stamp Badge */}
      <div className="pt-1">
        {sealStatus.isSealed ? (
          <div className="bg-[#161514] text-white border-2 border-[#161514] rounded-xl p-3.5 shadow-[3px_3px_0px_#161514] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-[#03D26F] text-[#161514] flex items-center justify-center font-black text-sm shrink-0 border border-white">
                <ShieldCheck className="size-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-xs uppercase tracking-wider text-[#CEF431]">
                    Day Sealed & Archived
                  </span>
                  <span className="bg-white/20 text-white font-mono text-[10px] px-1.5 py-0.5 rounded">
                    {sealStatus.sealedAt ? `SEALED AT ${sealStatus.sealedAt}` : "LOCKED"}
                  </span>
                </div>
                <p className="text-[11px] text-white/80 font-mono mt-0.5">
                  Conquest Score: ⚡ {sealStatus.score ?? metrics.overallScore}% permanent record.
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-[#CEF431] hidden sm:inline">
              ✓ VAULT SECURED
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSealDay}
            className="w-full bg-[#CEF431] hover:bg-[#D8F74E] text-[#161514] border-2 border-[#161514] rounded-xl p-3 sm:p-3.5 shadow-[3px_3px_0px_#161514] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <Lock className="size-4 stroke-[2.5] group-hover:scale-110 transition-transform" />
            <span className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider">
              Seal & Archive Today&apos;s Ledger
            </span>
            <Sparkles className="size-4 fill-[#161514]" />
          </button>
        )}
      </div>

      {/* 5. Tomorrow Battle Preview (Things 3 Benchmark) */}
      <div className="bg-white/80 border border-[#161514]/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-mono text-[#161514]/80">
          <span className="font-bold text-[#161514]">⚔️ Tomorrow&apos;s Horizon:</span>
          <span>{tomorrowPendingTasksCount} tasks queued</span>
          <span>•</span>
          <span>
            {currencySymbol}{tomorrowSafeToSpend ?? metrics.dailySafeToSpend} safe limit
          </span>
        </div>

        <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          Rest & Recover, Gladiator
        </span>
      </div>
    </div>
  );
}
