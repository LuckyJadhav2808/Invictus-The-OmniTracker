"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Zap,
  Smile,
  Meh,
  Frown,
  Moon,
  CheckCircle2,
  GraduationCap,
  Wallet,
  Calendar,
  Lock,
  Sparkles,
  X,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface EveningCloseoutDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}

const MOOD_OPTIONS = [
  { id: "awesome", label: "Great", Icon: Zap },
  { id: "good", label: "Good", Icon: Smile },
  { id: "okay", label: "Okay", Icon: Meh },
  { id: "low", label: "Low", Icon: Frown },
  { id: "tired", label: "Tired", Icon: Moon },
];

export function EveningCloseoutDrawer({
  open,
  onOpenChange,
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
}: EveningCloseoutDrawerProps) {
  const [sealStatus, setSealStatus] = useState<DaySealRecord>({ isSealed: false });

  // Sync seal status when selectedDate changes or drawer opens
  useEffect(() => {
    if (open) {
      setSealStatus(getDaySealStatus(selectedDate));
    }
  }, [selectedDate, open]);

  const handleSealDay = async () => {
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

    toast.success("Day Sealed! Score minted into history.");

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="bg-[#FAF8F5] border-t-2 sm:border-x-2 border-[#161514] rounded-t-3xl shadow-[0px_-6px_0px_0px_#161514] max-h-[92vh] overflow-y-auto sm:max-w-2xl sm:mx-auto p-4 sm:p-6 text-[#161514] space-y-4"
      >
        {/* Drawer Drag Handle / Accent */}
        <div className="w-12 h-1.5 bg-[#161514]/25 rounded-full mx-auto -mt-1 sm:-mt-2 mb-2" />

        {/* 1. Header Bar: Thermal Slip Metaphor with Clean Close Button */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-[#161514]/20 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-9 rounded-xl bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center shadow-[1.5px_1.5px_0px_#161514] shrink-0">
              <Award className="size-5 text-[#161514]" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="font-heading font-black text-sm sm:text-base text-[#161514] tracking-tight">
                Evening Reflection & Closeout
              </SheetTitle>
              <p className="text-[11px] font-mono text-[#161514]/70">
                {isToday ? "Archival Ledger" : `Ledger for ${selectedDate}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Overall Score Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border-2 border-[#161514] shadow-[1.5px_1.5px_0px_#161514] font-mono font-black text-xs text-[#161514]">
              <Zap className="size-3.5 fill-[#161514]" />
              <span className="tabular-nums">{metrics.overallScore}%</span>
            </div>

            {/* Custom Neobrutalist Close Button */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-white hover:bg-rose-100 text-[#161514] p-1.5 rounded-lg border-2 border-[#161514] shadow-[1.5px_1.5px_0px_#161514] active:scale-95 transition-all cursor-pointer"
              aria-label="Close evening review"
            >
              <X className="size-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* 2. Compact Tri-Pillar Review Summary */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Habits */}
          <div className="bg-white border-2 border-[#161514] rounded-xl p-2.5 sm:p-3 shadow-[1.5px_1.5px_0px_#161514] text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-mono font-bold text-[#161514]/70">
              <CheckCircle2 className="size-3 text-[#03D26F]" />
              <span>Habits</span>
            </div>
            <p className="text-xs sm:text-sm font-heading font-black text-[#161514]">
              <span className="font-mono tabular-nums">{metrics.completedHabitsCount}/{metrics.totalHabitsCount}</span>
            </p>
          </div>

          {/* Study */}
          <div className="bg-white border-2 border-[#161514] rounded-xl p-2.5 sm:p-3 shadow-[1.5px_1.5px_0px_#161514] text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-mono font-bold text-[#161514]/70">
              <GraduationCap className="size-3 text-[#C084FC]" />
              <span>Focus</span>
            </div>
            <p className="text-xs sm:text-sm font-heading font-black text-[#161514]">
              <span className="font-mono tabular-nums">{metrics.studyHoursFormatted}</span>
            </p>
          </div>

          {/* Spend */}
          <div className="bg-white border-2 border-[#161514] rounded-xl p-2.5 sm:p-3 shadow-[1.5px_1.5px_0px_#161514] text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-mono font-bold text-[#161514]/70">
              <Wallet className="size-3 text-[#FFB800]" />
              <span>Spent</span>
            </div>
            <p className="text-xs sm:text-sm font-heading font-black text-[#161514]">
              <span className="font-mono tabular-nums">{currencySymbol}{metrics.spentToday}</span>
            </p>
          </div>
        </div>

        {/* 3. Mindset & Mood Calibration */}
        <div className="bg-white border-2 border-[#161514] rounded-xl p-3.5 shadow-[2px_2px_0px_#161514] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-heading font-black text-xs uppercase tracking-wider text-[#161514]">
              Daily Energy & Mood
            </span>
            <span className="text-[10px] font-mono font-bold text-[#161514]/60">
              1-Tap Calibration
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {MOOD_OPTIONS.map(({ id, label, Icon }) => {
              const isSelected = currentMood === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleMoodSelect(id)}
                  className={cn(
                    "min-h-[44px] flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg border-2 border-[#161514] transition-all cursor-pointer active:scale-95",
                    isSelected
                      ? "bg-[#CEF431] shadow-[2px_2px_0px_#161514] -translate-y-0.5 font-black"
                      : "bg-[#FBF9F5] hover:bg-[#F3EFEA] text-[#161514]/70 font-semibold shadow-[1px_1px_0px_#161514]"
                  )}
                >
                  <Icon className={cn("size-4", isSelected ? "text-[#161514] stroke-[2.5]" : "text-[#161514]/70")} />
                  <span className="text-[10px] leading-none">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Reflection Log Notepad */}
        <div className="bg-white border-2 border-[#161514] rounded-xl p-3.5 shadow-[2px_2px_0px_#161514] space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="evening-reflection" className="font-heading font-black text-xs uppercase tracking-wider text-[#161514]">
              Unfiltered Evening Reflection
            </label>
            {isSavingMood && (
              <span className="text-[10px] font-mono text-[#03D26F] font-bold animate-pulse">
                Saving...
              </span>
            )}
          </div>
          <textarea
            id="evening-reflection"
            value={reflectionNote}
            onChange={(e) => onChangeNote && onChangeNote(e.target.value)}
            onBlur={() => onSaveMood && onSaveMood()}
            placeholder="What went well today? What will you do better tomorrow?"
            rows={3}
            className="w-full bg-[#FAF8F5] border-2 border-[#161514]/30 focus:border-[#161514] rounded-lg p-2.5 text-xs text-[#161514] placeholder-[#161514]/40 font-medium resize-none focus:outline-none transition-colors"
          />
        </div>

        {/* 5. Tomorrow Battle Prep Telemetry */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[#FAF8F5] border-2 border-[#161514] rounded-xl p-2.5 flex items-center justify-between shadow-[1px_1px_0px_#161514]">
            <div className="flex items-center gap-1.5 text-[#161514]">
              <Calendar className="size-3.5 text-[#161514]" />
              <span className="font-semibold text-[11px]">Tomorrow Tasks</span>
            </div>
            <span className="font-mono font-black tabular-nums bg-white border border-[#161514] px-1.5 py-0.5 rounded text-[10px]">
              {tomorrowPendingTasksCount} queued
            </span>
          </div>

          <div className="bg-[#FAF8F5] border-2 border-[#161514] rounded-xl p-2.5 flex items-center justify-between shadow-[1px_1px_0px_#161514]">
            <div className="flex items-center gap-1.5 text-[#161514]">
              <Wallet className="size-3.5 text-[#03D26F]" />
              <span className="font-semibold text-[11px]">Tomorrow Safe</span>
            </div>
            <span className="font-mono font-black tabular-nums bg-white border border-[#161514] px-1.5 py-0.5 rounded text-[10px]">
              {currencySymbol}{tomorrowSafeToSpend ?? metrics.dailySafeToSpend}
            </span>
          </div>
        </div>

        {/* 6. Primary Action: Seal Day Ledger */}
        <div className="pt-1">
          {sealStatus.isSealed ? (
            <div className="p-3 bg-[#03D26F]/15 border-2 border-[#161514] rounded-xl flex items-center justify-between shadow-[2px_2px_0px_#161514]">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-[#03D26F] border-2 border-[#161514] flex items-center justify-center">
                  <Lock className="size-3.5 text-[#161514] stroke-[2.5]" />
                </div>
                <div>
                  <p className="font-heading font-black text-xs text-[#161514]">
                    Ledger Sealed at {sealStatus.score}%
                  </p>
                  <p className="text-[10px] font-mono text-[#161514]/70">
                    Minted {sealStatus.sealedAt ? new Date(sealStatus.sealedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Today"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSealDay}
                className="text-[11px] font-mono font-black text-[#161514] underline hover:no-underline cursor-pointer"
              >
                Re-Seal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSealDay}
              className="w-full min-h-[46px] bg-[#CEF431] hover:bg-[#D8F74E] active:translate-x-0.5 active:translate-y-0.5 border-2 border-[#161514] rounded-xl font-heading font-black text-xs sm:text-sm text-[#161514] shadow-[3px_3px_0px_0px_#161514] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="size-4 text-[#161514]" />
              <span>Seal Day & Mint Score ({metrics.overallScore}%)</span>
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
