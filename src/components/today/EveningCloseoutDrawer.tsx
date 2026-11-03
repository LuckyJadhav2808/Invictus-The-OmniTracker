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
  Check,
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
        className="bg-white dark:bg-[#161514] border-t border-[#E8E5DF] dark:border-[#2A2724] rounded-t-2xl shadow-xl max-h-[92vh] overflow-y-auto sm:max-w-2xl sm:mx-auto p-4 sm:p-6 text-[#161514] dark:text-[#FAF8F5] space-y-4"
      >
        {/* Drawer Drag Handle */}
        <div className="w-10 h-1 bg-[#E8E5DF] dark:bg-[#2A2724] rounded-full mx-auto -mt-1 sm:-mt-2 mb-2" />

        {/* 1. Header Bar: Clean Header & Close Button */}
        <div className="flex items-center justify-between gap-3 border-b border-[#E8E5DF] dark:border-[#2A2724] pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-lg bg-[#F1EFEA] dark:bg-[#252220] flex items-center justify-center text-[#161514] dark:text-[#FAF8F5] shrink-0">
              <Award className="size-4 stroke-[1.5]" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="font-heading font-black text-base text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                Evening Review & Closeout
              </SheetTitle>
              <p className="text-xs text-[#6B6B6B] dark:text-[#FAF8F5]/60">
                {isToday ? "Daily closeout & reflection" : `Review for ${selectedDate}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Overall Score Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#DCFAE5] dark:bg-emerald-950/50 font-mono font-medium text-xs text-[#04250e] dark:text-emerald-300 border border-[#03D26F]/30">
              <Zap className="size-3 text-[#03D26F]" />
              <span className="tabular-nums font-semibold">{metrics.overallScore}%</span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-white dark:bg-[#252220] hover:bg-[#FAF8F5] dark:hover:bg-[#2e2a28] text-[#161514] dark:text-[#FAF8F5] p-1.5 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] active:translate-y-px transition-colors cursor-pointer"
              aria-label="Close evening review"
            >
              <X className="size-4 stroke-[1.5]" />
            </button>
          </div>
        </div>

        {/* First-Time User Context Banner */}
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl p-3 border border-[#E8E5DF] dark:border-[#2A2724] flex items-start gap-2.5 text-xs text-[#161514]/80 dark:text-[#FAF8F5]/80">
          <Moon className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Day Closeout:</strong> Seals today&apos;s habits, study focus, and spending into your permanent streak history so you wake up tomorrow with zero cognitive clutter.
          </p>
        </div>

        {/* 2. Compact Review Summary */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Habits */}
          <div className="bg-[#FBF9F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl p-2.5 sm:p-3 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-xs text-[#6B6B6B] dark:text-[#FAF8F5]/60">
              <CheckCircle2 className="size-3 text-[#03D26F]" />
              <span>Habits</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#161514] dark:text-[#FAF8F5]">
              <span className="font-mono tabular-nums">{metrics.completedHabitsCount}/{metrics.totalHabitsCount}</span>
            </p>
          </div>

          {/* Study */}
          <div className="bg-[#FBF9F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl p-2.5 sm:p-3 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-xs text-[#6B6B6B] dark:text-[#FAF8F5]/60">
              <GraduationCap className="size-3 text-[#161514] dark:text-[#FAF8F5]" />
              <span>Focus</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#161514] dark:text-[#FAF8F5]">
              <span className="font-mono tabular-nums">{metrics.studyHoursFormatted}</span>
            </p>
          </div>

          {/* Spend */}
          <div className="bg-[#FBF9F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl p-2.5 sm:p-3 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-xs text-[#6B6B6B] dark:text-[#FAF8F5]/60">
              <Wallet className="size-3 text-[#D97706]" />
              <span>Spent</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#161514] dark:text-[#FAF8F5]">
              <span className="font-mono tabular-nums">{currencySymbol}{metrics.spentToday}</span>
            </p>
          </div>
        </div>

        {/* 3. Daily Energy & Mood */}
        <div className="bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wider">
              Daily Energy & Mindset
            </span>
            <span className="text-xs text-[#6B6B6B] dark:text-[#FAF8F5]/60">
              How did you feel today?
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
                    "min-h-[44px] flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg border transition-colors cursor-pointer active:translate-y-px",
                    isSelected
                      ? "bg-[#161514] dark:bg-white text-white dark:text-[#161514] border-[#161514] dark:border-white font-bold"
                      : "bg-[#FBF9F5] dark:bg-[#252220] hover:bg-[#F5F3EF] dark:hover:bg-[#2e2a28] text-[#6B6B6B] dark:text-[#FAF8F5]/70 border-[#E8E5DF] dark:border-[#2A2724]"
                  )}
                >
                  <Icon className={cn("size-3.5 stroke-[1.5]", isSelected ? "text-white dark:text-[#161514]" : "text-[#6B6B6B] dark:text-[#FAF8F5]/70")} />
                  <span className="text-xs leading-none">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Reflection Log */}
        <div className="bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="evening-reflection" className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wider">
              Evening Reflection
            </label>
            {isSavingMood && (
              <span className="text-xs font-mono text-[#047857] dark:text-[#03D26F]">
                Saved
              </span>
            )}
          </div>
          <textarea
            id="evening-reflection"
            value={reflectionNote}
            onChange={(e) => onChangeNote && onChangeNote(e.target.value)}
            onBlur={() => onSaveMood && onSaveMood()}
            placeholder="What went well today? What can improve tomorrow?"
            rows={3}
            className="w-full bg-[#FBF9F5] dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#2A2724] focus:border-[#161514] dark:focus:border-white rounded-lg p-2.5 text-xs text-[#161514] dark:text-[#FAF8F5] placeholder-[#6B6B6B]/60 dark:placeholder-[#FAF8F5]/40 font-normal resize-none focus:outline-none transition-colors"
          />
        </div>

        {/* 5. Tomorrow Preview */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[#FBF9F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] rounded-lg p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#161514] dark:text-[#FAF8F5]">
              <Calendar className="size-3.5 text-[#6B6B6B] dark:text-[#FAF8F5]/60 stroke-[1.5]" />
              <span className="font-medium text-xs">Tomorrow tasks</span>
            </div>
            <span className="font-mono text-xs bg-white dark:bg-[#252220] border border-[#E8E5DF] dark:border-[#2A2724] px-2 py-0.5 rounded tabular-nums text-[#161514] dark:text-[#FAF8F5]">
              {tomorrowPendingTasksCount} queued
            </span>
          </div>

          <div className="bg-[#FBF9F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] rounded-lg p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#161514] dark:text-[#FAF8F5]">
              <Wallet className="size-3.5 text-[#D97706] stroke-[1.5]" />
              <span className="font-medium text-xs">Tomorrow safe</span>
            </div>
            <span className="font-mono text-xs bg-white dark:bg-[#252220] border border-[#E8E5DF] dark:border-[#2A2724] px-2 py-0.5 rounded tabular-nums text-[#161514] dark:text-[#FAF8F5]">
              {currencySymbol}{tomorrowSafeToSpend ?? metrics.dailySafeToSpend}
            </span>
          </div>
        </div>

        {/* 6. Primary Action: Seal Day */}
        <div className="pt-1">
          {sealStatus.isSealed ? (
            <div className="p-3 bg-[#DCFAE5]/40 dark:bg-emerald-950/30 border border-[#03D26F]/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-[#03D26F] text-[#161514] flex items-center justify-center font-bold">
                  <Lock className="size-3.5 stroke-[1.5]" />
                </div>
                <div>
                  <p className="font-bold text-xs text-[#161514] dark:text-[#FAF8F5]">
                    Day review saved at {sealStatus.score}%
                  </p>
                  <p className="text-xs font-mono text-[#6B6B6B] dark:text-[#FAF8F5]/60">
                    Recorded {sealStatus.sealedAt ? new Date(sealStatus.sealedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "today"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSealDay}
                className="text-xs font-bold text-[#161514] dark:text-[#FAF8F5] underline hover:no-underline cursor-pointer"
              >
                Re-save
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSealDay}
              className="w-full min-h-[44px] bg-[#161514] dark:bg-white hover:bg-[#252321] dark:hover:bg-neutral-100 active:translate-y-px rounded-xl font-bold text-xs sm:text-sm text-white dark:text-[#161514] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Check className="size-4 stroke-[2]" />
              <span>Seal & Save Day Review ({metrics.overallScore}%)</span>
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
