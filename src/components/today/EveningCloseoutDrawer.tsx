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
        className="bg-white border-t border-[#E8E5DF] rounded-t-2xl shadow-xl max-h-[92vh] overflow-y-auto sm:max-w-2xl sm:mx-auto p-4 sm:p-6 text-[#161514] space-y-4"
      >
        {/* Drawer Drag Handle */}
        <div className="w-10 h-1 bg-[#E8E5DF] rounded-full mx-auto -mt-1 sm:-mt-2 mb-2" />

        {/* 1. Header Bar: Clean Header & Close Button */}
        <div className="flex items-center justify-between gap-3 border-b border-[#E8E5DF] pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-lg bg-[#F1EFEA] flex items-center justify-center text-[#161514] shrink-0">
              <Award className="size-4 stroke-[1.5]" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="font-sans font-semibold text-base text-[#161514] tracking-tight">
                Evening Review
              </SheetTitle>
              <p className="text-xs text-[#6B6B6B]">
                {isToday ? "Daily closeout & reflection" : `Review for ${selectedDate}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Overall Score Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#DCFAE5] font-mono font-medium text-xs text-[#04250e] border border-[#03D26F]/30">
              <Zap className="size-3 text-[#03D26F]" />
              <span className="tabular-nums font-semibold">{metrics.overallScore}%</span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-white hover:bg-[#F5F3EF] text-[#161514] p-1.5 rounded-lg border border-[#E8E5DF] active:translate-y-px transition-colors cursor-pointer"
              aria-label="Close evening review"
            >
              <X className="size-4 stroke-[1.5]" />
            </button>
          </div>
        </div>

        {/* 2. Compact Review Summary */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Habits */}
          <div className="bg-[#FBF9F5] border border-[#E8E5DF] rounded-lg p-2.5 sm:p-3 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-xs text-[#6B6B6B]">
              <CheckCircle2 className="size-3 text-[#03D26F]" />
              <span>Habits</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#161514]">
              <span className="font-mono tabular-nums">{metrics.completedHabitsCount}/{metrics.totalHabitsCount}</span>
            </p>
          </div>

          {/* Study */}
          <div className="bg-[#FBF9F5] border border-[#E8E5DF] rounded-lg p-2.5 sm:p-3 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-xs text-[#6B6B6B]">
              <GraduationCap className="size-3 text-[#161514]" />
              <span>Focus</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#161514]">
              <span className="font-mono tabular-nums">{metrics.studyHoursFormatted}</span>
            </p>
          </div>

          {/* Spend */}
          <div className="bg-[#FBF9F5] border border-[#E8E5DF] rounded-lg p-2.5 sm:p-3 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-xs text-[#6B6B6B]">
              <Wallet className="size-3 text-[#D97706]" />
              <span>Spent</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#161514]">
              <span className="font-mono tabular-nums">{currencySymbol}{metrics.spentToday}</span>
            </p>
          </div>
        </div>

        {/* 3. Daily Energy & Mood */}
        <div className="bg-white border border-[#E8E5DF] rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#161514]">
              Daily Energy & Mood
            </span>
            <span className="text-xs text-[#6B6B6B]">
              How was your day?
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
                      ? "bg-[#161514] text-white border-[#161514] font-medium"
                      : "bg-[#FBF9F5] hover:bg-[#F5F3EF] text-[#6B6B6B] border-[#E8E5DF]"
                  )}
                >
                  <Icon className={cn("size-3.5 stroke-[1.5]", isSelected ? "text-white" : "text-[#6B6B6B]")} />
                  <span className="text-xs leading-none">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Reflection Log */}
        <div className="bg-white border border-[#E8E5DF] rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="evening-reflection" className="text-xs font-medium text-[#161514]">
              Evening Reflection
            </label>
            {isSavingMood && (
              <span className="text-xs font-mono text-[#047857]">
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
            className="w-full bg-[#FBF9F5] border border-[#E8E5DF] focus:border-[#161514] rounded-lg p-2.5 text-xs text-[#161514] placeholder-[#6B6B6B]/60 font-normal resize-none focus:outline-none transition-colors"
          />
        </div>

        {/* 5. Tomorrow Preview */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[#FBF9F5] border border-[#E8E5DF] rounded-lg p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#161514]">
              <Calendar className="size-3.5 text-[#6B6B6B] stroke-[1.5]" />
              <span className="font-medium text-xs">Tomorrow tasks</span>
            </div>
            <span className="font-mono text-xs bg-white border border-[#E8E5DF] px-2 py-0.5 rounded tabular-nums">
              {tomorrowPendingTasksCount} queued
            </span>
          </div>

          <div className="bg-[#FBF9F5] border border-[#E8E5DF] rounded-lg p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#161514]">
              <Wallet className="size-3.5 text-[#6B6B6B] stroke-[1.5]" />
              <span className="font-medium text-xs">Tomorrow safe</span>
            </div>
            <span className="font-mono text-xs bg-white border border-[#E8E5DF] px-2 py-0.5 rounded tabular-nums">
              {currencySymbol}{tomorrowSafeToSpend ?? metrics.dailySafeToSpend}
            </span>
          </div>
        </div>

        {/* 6. Primary Action: Seal Day */}
        <div className="pt-1">
          {sealStatus.isSealed ? (
            <div className="p-3 bg-[#DCFAE5]/40 border border-[#03D26F]/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-[#03D26F] text-white flex items-center justify-center">
                  <Lock className="size-3.5 stroke-[1.5]" />
                </div>
                <div>
                  <p className="font-medium text-xs text-[#161514]">
                    Day review saved at {sealStatus.score}%
                  </p>
                  <p className="text-xs font-mono text-[#6B6B6B]">
                    Recorded {sealStatus.sealedAt ? new Date(sealStatus.sealedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "today"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSealDay}
                className="text-xs font-medium text-[#161514] underline hover:no-underline cursor-pointer"
              >
                Re-save
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSealDay}
              className="w-full min-h-[44px] bg-[#161514] hover:bg-[#252321] active:translate-y-px rounded-xl font-medium text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Check className="size-4 stroke-[2]" />
              <span>Save Day Review ({metrics.overallScore}%)</span>
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
