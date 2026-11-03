"use client";

import { useState, useEffect, useMemo } from "react";
import { Wallet, CheckSquare, GraduationCap, X, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { triggerHaptic } from "@/lib/native/haptics";
import Link from "next/link";

interface FirstRunQuickStartDeckProps {
  totalHabitsCount: number;
  completedHabitsCount: number;
  hasBudgetOrExpenses: boolean;
  hasStudySessions: boolean;
  onOpenDailyLimitModal: () => void;
  onStartStudySprint: () => void;
}

const FIRST_RUN_DISMISSED_KEY = "invictus_first_run_dismissed";

export function FirstRunQuickStartDeck({
  totalHabitsCount,
  completedHabitsCount,
  hasBudgetOrExpenses,
  hasStudySessions,
  onOpenDailyLimitModal,
  onStartStudySprint,
}: FirstRunQuickStartDeckProps) {
  const [isDismissed, setIsDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const dismissed = localStorage.getItem(FIRST_RUN_DISMISSED_KEY) === "true";
    setIsDismissed(dismissed);
  }, []);

  const steps = useMemo(() => {
    return [
      {
        id: "money",
        title: "Set Daily Spending Limit",
        subtitle: "Calibrate safe daily budget to protect cash flow",
        completed: hasBudgetOrExpenses,
        actionLabel: "Set Limit",
        icon: Wallet,
        accent: "bg-[#CEF431] text-[#161514]",
        onClick: () => {
          soundFX.playPop();
          triggerHaptic("light");
          onOpenDailyLimitModal();
        },
      },
      {
        id: "habits",
        title: "Pick 3 Daily Habits",
        subtitle: "Choose high-leverage habits from prebuilt templates",
        completed: totalHabitsCount > 0,
        actionLabel: "Pick Habits",
        icon: CheckSquare,
        accent: "bg-[#03D26F] text-[#161514]",
        href: "/goals?action=quick-habit",
      },
      {
        id: "study",
        title: "Start First Focus Sprint",
        subtitle: "Launch a 25-minute Pomodoro timer or log study",
        completed: hasStudySessions,
        actionLabel: "Start Timer",
        icon: GraduationCap,
        accent: "bg-[#C084FC] text-[#161514]",
        onClick: () => {
          soundFX.playPop();
          triggerHaptic("light");
          onStartStudySprint();
        },
      },
    ];
  }, [hasBudgetOrExpenses, totalHabitsCount, hasStudySessions, onOpenDailyLimitModal, onStartStudySprint]);

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const allCompleted = completedCount === steps.length;

  const handleDismiss = () => {
    soundFX.playPop();
    triggerHaptic("light");
    setIsDismissed(true);
    try {
      localStorage.setItem(FIRST_RUN_DISMISSED_KEY, "true");
    } catch {}
  };

  // Don't render if unmounted, dismissed, or already fully conquered by seasoned user
  if (!mounted || isDismissed || (allCompleted && totalHabitsCount >= 3)) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] shadow-neo-sm overflow-hidden p-4 sm:p-5 select-none transition-all duration-200">
      {/* Header Bar */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E8E5DF] dark:border-[#2A2724]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="type-mono-badge px-2 py-0.5 rounded-md bg-[#CEF431] text-[#161514] border border-[#161514] font-bold">
              QUICK START HUD
            </span>
            <span className="type-caption font-bold text-[#73716D] dark:text-[#A8A29E]">
              ~60 Seconds Setup
            </span>
          </div>
          <h2 className="type-h2 text-base sm:text-lg text-[#161514] dark:text-[#FAF8F5]">
            Welcome to Invictus. Let's set up your cockpit.
          </h2>
          <p className="type-caption text-[#73716D] dark:text-[#A8A29E]">
            Complete these 3 foundational actions to unlock live daily pacing &amp; habit streaks.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss onboarding guide"
          title="Dismiss guide"
          className="size-7 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#E8E5DF] dark:hover:bg-[#383531] text-[#73716D] dark:text-[#A8A29E] flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <X className="size-4 stroke-[2]" />
        </button>
      </div>

      {/* Live Progress Bar */}
      <div className="pt-3 pb-2 flex items-center justify-between text-xs font-mono font-bold">
        <span className="text-[#161514] dark:text-[#FAF8F5]">
          {completedCount} OF {steps.length} STEPS COMPLETE
        </span>
        <span className="text-[#03D26F]">{progressPercent}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-[#F1EFEA] dark:bg-[#252321] overflow-hidden mb-4 border border-[#E8E5DF] dark:border-[#2A2724]">
        <div
          className="h-full bg-[#03D26F] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3 Step Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={cn(
                "p-3 rounded-xl border transition-all flex flex-col justify-between gap-3",
                step.completed
                  ? "bg-[#F8FDF9] dark:bg-[#18231C] border-[#03D26F]/40"
                  : "bg-[#FAF8F5] dark:bg-[#201F1D] border-[#E8E5DF] dark:border-[#2A2724] hover:border-[#161514] dark:hover:border-[#FAF8F5]/40"
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={cn("size-8 rounded-lg flex items-center justify-center border border-[#161514]/20", step.accent)}>
                    <Icon className="size-4 stroke-[2]" />
                  </div>
                  {step.completed ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#03D26F] bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-[#03D26F]/30">
                      <Check className="size-3 stroke-[2.5]" /> DONE
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-[#8C8882] dark:text-[#A8A29E]">
                      STEP {idx + 1}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="type-h3 text-xs sm:text-[13px] text-[#161514] dark:text-[#FAF8F5] leading-snug">
                    {step.title}
                  </h3>
                  <p className="type-caption text-[11px] text-[#73716D] dark:text-[#A8A29E] mt-0.5 line-clamp-2">
                    {step.subtitle}
                  </p>
                </div>
              </div>

              {step.completed ? (
                <div className="w-full py-1.5 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-[#03D26F] text-xs font-mono font-bold text-center">
                  Active &amp; Calibrated
                </div>
              ) : step.href ? (
                <Link
                  href={step.href}
                  className="w-full inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] text-xs font-heading font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  <span>{step.actionLabel}</span>
                  <ArrowRight className="size-3 stroke-[2]" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={step.onClick}
                  className="w-full inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] text-xs font-heading font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  <span>{step.actionLabel}</span>
                  <ArrowRight className="size-3 stroke-[2]" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
