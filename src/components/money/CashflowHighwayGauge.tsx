"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { type DailyBudgetStats } from "@/lib/utils/budget-rollover";
import { soundFX } from "@/components/shared/SoundFX";
import { Sparkles, AlertTriangle, ShieldCheck, Fuel, Sliders } from "lucide-react";

interface CashflowHighwayGaugeProps {
  dailyStats: DailyBudgetStats;
  currencySymbol: string;
  daysRemainingInMonth?: number;
  onOpenEditAllowances?: () => void;
}

export function CashflowHighwayGauge({
  dailyStats,
  currencySymbol,
  daysRemainingInMonth = 15,
  onOpenEditAllowances,
}: CashflowHighwayGaugeProps) {
  const [isHonking, setIsHonking] = useState(false);

  const percentage = dailyStats.todayUsedPercentage || 0;
  // Clamped position for the car along the highway track (0% to 95% max so car stays inside)
  const clampedPercent = Math.min(94, Math.max(3, percentage));
  const isOver = dailyStats.isOverDailyBudget;
  const isCaution = percentage >= 75 && !isOver;

  // Anti-guilt calculation: spread overspend across next 3-7 days
  const recoveryDays = Math.max(3, Math.min(7, daysRemainingInMonth || 5));
  const dailyRecoveryShave = isOver
    ? Math.ceil(dailyStats.overDailyAmount / recoveryDays)
    : 0;

  const handleCarTap = () => {
    soundFX.playCarHorn();
    soundFX.vibrate([20, 40, 20]);
    setIsHonking(true);
    setTimeout(() => setIsHonking(false), 350);
  };

  return (
    <div className="bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] p-4 space-y-3.5 relative overflow-hidden transition-all">
      {/* 🏁 Header Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#161514]/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black uppercase tracking-wider text-[#161514] flex items-center gap-1.5" style={{ fontFamily: "var(--font-heading)" }}>
            <span className="text-base">🏎️</span>
            <span>Cashflow Highway</span>
          </span>
          <span
            className={cn(
              "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-[#161514] shadow-[1px_1px_0px_0px_#161514] transition-all",
              isOver
                ? "bg-rose-400 text-[#161514] animate-pulse"
                : isCaution
                ? "bg-amber-300 text-[#161514]"
                : "bg-[#CEF431] text-[#161514]"
            )}
          >
            {isOver ? "🚨 Redline Overdrive" : isCaution ? "⚠️ Approaching Limit" : "🟢 Cruising Speed"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Fuel Remaining Badge */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]">
            <Fuel className={cn("size-3.5 stroke-[2.5]", isOver ? "text-rose-600" : "text-[#03D26F]")} />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#161514]">
              {isOver ? (
                <span className="text-rose-600">Tank Empty (-{currencySymbol}{dailyStats.overDailyAmount.toLocaleString()})</span>
              ) : (
                <span>{Math.max(0, 100 - percentage)}% Fuel Left ({currencySymbol}{dailyStats.todayRemaining.toLocaleString()})</span>
              )}
            </span>
          </div>

          {onOpenEditAllowances && (
            <button
              type="button"
              onClick={onOpenEditAllowances}
              className="p-1 rounded-lg bg-white hover:bg-[#CEF431] border border-[#161514] shadow-[1px_1px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              title="Configure Daily Allowance Cap"
            >
              <Sliders className="size-3.5 text-[#161514]" />
            </button>
          )}
        </div>
      </div>

      {/* 🛣️ THE HIGHWAY TRACK */}
      <div className="relative pt-6 pb-4">
        {/* Track Container */}
        <div className="relative h-16 w-full bg-[#201D1A] rounded-xl border-2 border-[#161514] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] overflow-hidden">
          {/* Top Road Curb / Shoulder */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(90deg,#CEF431,#CEF431_12px,#161514_12px,#161514_24px)] opacity-80" />
          
          {/* Center Dashed Lane Divider */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 border-b-2 border-dashed border-white/60 pointer-events-none" />

          {/* Bottom Road Curb / Shoulder */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(90deg,#CEF431,#CEF431_12px,#161514_12px,#161514_24px)] opacity-80" />

          {/* Milestone Checkpoints along the Highway */}
          <div className="absolute inset-0 flex justify-between px-3 pointer-events-none items-center">
            {/* 0% Start */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black uppercase text-emerald-400 bg-[#161514]/80 px-1 rounded">0%</span>
            </div>

            {/* 50% Halfway Fuel Stop */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black uppercase text-amber-300 bg-[#161514]/80 px-1 rounded">50% ⛽</span>
            </div>

            {/* 80% Caution Trap */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black uppercase text-orange-400 bg-[#161514]/80 px-1 rounded">80% 🚧</span>
            </div>

            {/* 100% Daily Cap */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black uppercase text-rose-400 bg-[#161514]/80 px-1 rounded">100% 🏁</span>
            </div>
          </div>

          {/* 🏎️ THE INVICTUS SPEEDSTER (THE CAR) */}
          <div
            onClick={handleCarTap}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 z-20 cursor-pointer select-none transition-all group",
              isHonking && "scale-125"
            )}
            style={{
              left: `${clampedPercent}%`,
              transform: `translate(-50%, -50%) ${isHonking ? "scale(1.2)" : "scale(1)"}`,
              transition: "left 700ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 150ms ease",
            }}
            title="Tap car to honk! 🚗💨"
          >
            {/* Exhaust Smoke Animation if Over Budget */}
            {isOver && (
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none animate-pulse">
                <span className="text-xs">💨</span>
                <span className="text-[9px]">🔥</span>
              </div>
            )}

            {/* Speech Bubble on Honk */}
            {isHonking && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#CEF431] text-[#161514] font-black text-[9px] px-1.5 py-0.5 rounded border border-[#161514] shadow-[1px_1px_0px_0px_#161514] whitespace-nowrap z-30 animate-bounce">
                BEEP BEEP! 🏁
              </div>
            )}

            {/* Retro Vector Sports Car SVG */}
            <div className="relative filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)] group-hover:scale-105 transition-transform">
              <svg width="44" height="24" viewBox="0 0 44 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Wheels */}
                <circle cx="9" cy="18" r="4.5" fill="#111111" stroke="#CEF431" strokeWidth="1.5" />
                <circle cx="34" cy="18" r="4.5" fill="#111111" stroke="#CEF431" strokeWidth="1.5" />
                <circle cx="9" cy="18" r="1.5" fill="#FFFFFF" />
                <circle cx="34" cy="18" r="1.5" fill="#FFFFFF" />

                {/* Car Body (Neubrutalist Sports Coupe) */}
                <path
                  d="M2 15L6 10H14L21 4H33L42 12V16H2V15Z"
                  fill={isOver ? "#FF4757" : isCaution ? "#FFA502" : "#CEF431"}
                  stroke="#161514"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />

                {/* Windshield & Cabin */}
                <path
                  d="M15 10L21 5H30L33 10H15Z"
                  fill="#1E272E"
                  stroke="#161514"
                  strokeWidth="1.2"
                />

                {/* Driver Goggles / Vix Silhouette */}
                <circle cx="23" cy="8" r="2" fill="#00D2D3" />

                {/* Headlight Beam */}
                <path d="M41 13L44 14V16L41 15V13Z" fill="#FFF200" />
                {isCaution && <path d="M44 14L48 12V18L44 16Z" fill="#FFF200" opacity="0.6" />}

                {/* Racing Stripe */}
                <line x1="10" y1="13" x2="38" y2="13" stroke="#161514" strokeWidth="1.5" strokeDasharray="3 2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Highway Progress Scale Labels Below Track */}
        <div className="flex justify-between items-center text-[9px] font-black uppercase text-[#161514]/70 px-1 pt-1.5">
          <span>Morning Tank (0%)</span>
          <span className="font-heading">
            {currencySymbol}{dailyStats.todayExpense.toLocaleString()} Spent / {currencySymbol}{dailyStats.dailyBudgetTarget.toLocaleString()} Cap
          </span>
          <span>Night Finish (100%)</span>
        </div>
      </div>

      {/* 🧠 ANTI-GUILT FINANCIAL COACHING TELEMETRY */}
      <div
        className={cn(
          "p-3 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-start gap-2.5 transition-all",
          isOver
            ? "bg-rose-50 border-rose-900/40"
            : isCaution
            ? "bg-amber-50 border-amber-900/40"
            : "bg-[#03D26F]/10 border-[#161514]/20"
        )}
      >
        <div className="shrink-0 mt-0.5">
          {isOver ? (
            <AlertTriangle className="size-4 text-rose-600" />
          ) : isCaution ? (
            <Sparkles className="size-4 text-amber-600" />
          ) : (
            <ShieldCheck className="size-4 text-emerald-700" />
          )}
        </div>

        <div className="space-y-0.5 text-xs">
          <span className="font-black text-[#161514] block">
            {isOver ? "Overdrive Recovery Advice" : isCaution ? "Approaching Daily Redline" : "Pacing Optimal"}
          </span>
          <p className="text-[#161514]/80 text-[11px] leading-relaxed">
            {isOver ? (
              <span>
                You are over by <strong className="text-rose-700">{currencySymbol}{dailyStats.overDailyAmount.toLocaleString()}</strong> today.
                {" "}No guilt! Trimming just <strong className="underline text-[#161514]">{currencySymbol}{dailyRecoveryShave.toLocaleString()}/day</strong> over the next {recoveryDays} days brings your monthly balance completely back on cruise control! 🛡️
              </span>
            ) : isCaution ? (
              <span>
                You have consumed <strong>{percentage}%</strong> of today&apos;s fuel.
                {" "}You have <strong>{currencySymbol}{dailyStats.todayRemaining.toLocaleString()}</strong> left for tonight&apos;s dinner or commute.
              </span>
            ) : (
              <span>
                Cruising comfortably! At this burn rate, you will bank an estimated{" "}
                <strong className="text-emerald-800 font-black">
                  +{currencySymbol}{(dailyStats.todayRemaining * 3).toLocaleString()}
                </strong>{" "}
                in surplus savings this week! 🎯
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 📊 Quick Trio Metrics: Spent, Remaining, Channel Split */}
      <div className="grid grid-cols-3 gap-2 pt-0.5">
        <div className="bg-white p-2.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]">
          <span className="text-[9px] font-black uppercase text-rose-700 block">Spent Today</span>
          <span className="text-sm sm:text-base font-black text-rose-600 font-heading block mt-0.5">
            -{currencySymbol}{dailyStats.todayExpense.toLocaleString()}
          </span>
        </div>

        <div className={cn(
          "p-2.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]",
          isOver ? "bg-rose-100 border-rose-900/40" : "bg-[#CEF431]/30"
        )}>
          <span className={cn(
            "text-[9px] font-black uppercase block",
            isOver ? "text-rose-800" : "text-[#161514]/80"
          )}>
            {isOver ? "Over Budget 🚨" : "Remaining"}
          </span>
          <span className={cn(
            "text-sm sm:text-base font-black font-heading block mt-0.5",
            isOver ? "text-rose-700" : "text-[#161514]"
          )}>
            {isOver
              ? `-${currencySymbol}${dailyStats.overDailyAmount.toLocaleString()}`
              : `${currencySymbol}${dailyStats.todayRemaining.toLocaleString()}`}
          </span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]">
          <span className="text-[9px] font-black uppercase text-[#161514]/60 block">Channel Split</span>
          <div className="text-[10px] font-black text-[#161514] mt-0.5 space-y-0.5">
            <span className="block truncate">📱 UPI: {currencySymbol}{dailyStats.todayUpiExpense.toLocaleString()}</span>
            <span className="block truncate">💵 Cash: {currencySymbol}{dailyStats.todayCashExpense.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
