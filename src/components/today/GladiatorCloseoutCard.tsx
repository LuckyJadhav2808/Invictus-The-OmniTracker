"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Wallet,
  ArrowRight,
  Award,
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
  className?: string;
}

export function GladiatorCloseoutCard({
  metrics,
  selectedDate,
  isToday,
  onSealComplete,
  tomorrowPendingTasksCount = 0,
  tomorrowSafeToSpend,
  currencySymbol = "₹",
  className,
}: GladiatorCloseoutCardProps) {
  const [sealStatus, setSealStatus] = useState<DaySealRecord>({ isSealed: false });

  // Sync seal status when selectedDate changes
  useEffect(() => {
    setSealStatus(getDaySealStatus(selectedDate));
  }, [selectedDate]);

  const handleSealDay = () => {
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
            {currencySymbol}{metrics.remainingSafeToSpend} Safe Left
          </p>
        </div>
      </div>

      {/* 3. 1-Tap Seal & Archival Ritual Button / Wax Stamp Badge */}
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
              Seal & Archive Today's Ledger
            </span>
            <Sparkles className="size-4 fill-[#161514]" />
          </button>
        )}
      </div>

      {/* 4. Tomorrow Battle Preview (Things 3 Benchmark) */}
      <div className="bg-white/80 border border-[#161514]/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-mono text-[#161514]/80">
          <span className="font-bold text-[#161514]">⚔️ Tomorrow's Horizon:</span>
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
