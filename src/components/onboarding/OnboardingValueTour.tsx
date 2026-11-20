"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Flame,
  Lock,
  WifiOff,
  Zap,
} from "lucide-react";
import { StrobiCompanion } from "@/components/mascot/StrobiCompanion";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

interface OnboardingValueTourProps {
  onStartSetup: () => void;
  onSkipToLogin: () => void;
}

export function OnboardingValueTour({
  onStartSetup,
  onSkipToLogin,
}: OnboardingValueTourProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const totalSlides = 4;

  const handleNext = () => {
    soundFX.playPop();
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onStartSetup();
    }
  };

  const handleBack = () => {
    soundFX.playPop();
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col justify-between min-h-[580px] sm:min-h-[620px] p-5 sm:p-6 bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#383531] rounded-3xl shadow-[4px_4px_0px_0px_#161514] dark:shadow-[4px_4px_0px_0px_#000000] select-none transition-all">
      {/* ─── TOP BAR: STEP COUNTER & SKIP ─── */}
      <div className="flex items-center justify-between w-full pb-2">
        <div className="flex items-center gap-1.5">
          {currentSlide > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="p-1.5 rounded-lg border border-[#161514] dark:border-[#383531] bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] hover:bg-[#FAF8F5] cursor-pointer transition-transform active:scale-90"
              aria-label="Previous slide"
            >
              <ArrowLeft className="size-3.5 stroke-[2.5]" />
            </button>
          )}
          <span className="text-[11px] font-mono font-black text-muted-foreground tracking-wider uppercase">
            0{currentSlide + 1} / 0{totalSlides}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            onSkipToLogin();
          }}
          className="text-xs font-mono font-bold text-muted-foreground hover:text-[#161514] dark:hover:text-[#FAF8F5] underline underline-offset-4 cursor-pointer transition-colors"
        >
          Skip to Login
        </button>
      </div>

      {/* ─── SLIDE CONTENT ─── */}
      <div className="flex-1 flex flex-col justify-center py-4">
        {currentSlide === 0 && (
          <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Mascot Centerpiece with Orbiting Badges */}
            <div className="relative size-36 mx-auto flex items-center justify-center">
              <StrobiCompanion size={110} gear="none" showGear={false} />
              
              {/* Floating Orbiting Pills */}
              <div className="absolute -top-1 -right-4 px-2 py-0.5 rounded-full bg-[#CEF431] text-[#161514] border-2 border-[#161514] text-[9px] font-mono font-black shadow-[1.5px_1.5px_0px_#161514] animate-bounce">
                Safe ₹450/d
              </div>
              <div className="absolute -bottom-1 -left-4 px-2 py-0.5 rounded-full bg-[#03D26F] text-[#161514] border-2 border-[#161514] text-[9px] font-mono font-black shadow-[1.5px_1.5px_0px_#161514]">
                🔥 7D Streak
              </div>
            </div>

            <div className="space-y-2 max-w-xs mx-auto">
              <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-md bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] shadow-xs">
                Invictus OS
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight leading-tight">
                Your Life, Engineered.
              </h2>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                A calmer, high-velocity way to track atomic habits, manage your daily safe-to-spend cashflow, and conquer your goals.
              </p>
            </div>
          </div>
        )}

        {currentSlide === 1 && (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1.5 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-heading font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                Master Atomic Habits
              </h2>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                Discipline beats motivation every day. Build streaks, earn XP, and protect your momentum with Freeze Shields.
              </p>
            </div>

            {/* Interactive Preview Card */}
            <div className="relative p-4 rounded-2xl bg-white dark:bg-[#201E1B] border-2 border-[#161514] dark:border-[#383531] shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_#000000] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Flame className="size-3 text-amber-500" />
                  <span>Daily Streak Target</span>
                </span>
                <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400">
                  12-Day Streak 🔥
                </span>
              </div>

              {/* Sample Habit Row 1 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#2A2724] border border-[#E8E5DF] dark:border-[#383531]">
                <div className="flex items-center gap-2">
                  <div className="size-5 rounded-md bg-[#03D26F] text-[#161514] flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
                      Drink 2.5L Water
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      2,000 / 2,500 ml logged
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-muted-foreground">+25 XP</span>
              </div>

              {/* Sample Habit Row 2 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#2A2724] border border-[#E8E5DF] dark:border-[#383531]">
                <div className="flex items-center gap-2">
                  <div className="size-5 rounded-md border border-[#161514] dark:border-[#FAF8F5]/40 flex items-center justify-center text-xs">
                    ○
                  </div>
                  <div>
                    <div className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
                      45m Deep Work Focus
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      Pomodoro Sprint
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-muted-foreground">+50 XP</span>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 pt-0.5">
                <ShieldCheck className="size-3 stroke-[2.5]" />
                <span>2 Streak Freeze Shields Active</span>
              </div>
            </div>
          </div>
        )}

        {currentSlide === 2 && (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1.5 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-heading font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                Understand Your Money
              </h2>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                Never wonder where your month went. Invictus computes your real-time safe daily pace so you don't overshoot before month-end.
              </p>
            </div>

            {/* Financial Ledger Preview Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#201E1B] border-2 border-[#161514] dark:border-[#383531] shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_#000000] space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-border/50">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                    Safe Daily Pace
                  </div>
                  <div className="text-xl font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
                    ₹480 <span className="text-xs font-mono font-normal text-muted-foreground">/ day</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-[#CEF431] text-[#161514] font-mono font-black text-[10px] border border-[#161514]">
                  SAFE TILL EOM
                </span>
              </div>

              {/* Sample micro spend rows */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8F5] dark:bg-[#2A2724]">
                  <span className="font-heading font-bold text-[#161514] dark:text-[#FAF8F5]">☕ Morning Chai & Snack</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">-₹40</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8F5] dark:bg-[#2A2724]">
                  <span className="font-heading font-bold text-[#161514] dark:text-[#FAF8F5]">🚇 Metro Smart Card</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">-₹30</span>
                </div>
              </div>

              <div className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 text-center pt-1">
                ₹410 left safe to spend today
              </div>
            </div>
          </div>
        )}

        {currentSlide === 3 && (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1.5 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-heading font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                Your Data Stays With You
              </h2>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                Everything lives securely on this device inside your local encrypted vault. No bank credentials, no third-party tracking, works offline.
              </p>
            </div>

            {/* Privacy Badges Bento Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#201E1B] border-2 border-[#161514] dark:border-[#383531] shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_#000000] space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-[#CEF431] text-[#161514] border-2 border-[#161514] flex items-center justify-center font-black shadow-xs">
                  <Lock className="size-5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
                    Hardware-Accelerated Vault
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    AES-GCM encryption with local IndexedDB storage.
                  </p>
                </div>
              </div>

              {/* Triple Pills */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2A2724] border border-[#E8E5DF] dark:border-[#383531] space-y-1">
                  <WifiOff className="size-4 mx-auto text-[#161514] dark:text-[#FAF8F5]" />
                  <div className="text-[9px] font-mono font-black uppercase">Works Offline</div>
                </div>
                <div className="p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2A2724] border border-[#E8E5DF] dark:border-[#383531] space-y-1">
                  <ShieldCheck className="size-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                  <div className="text-[9px] font-mono font-black uppercase">Zero Ads</div>
                </div>
                <div className="p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2A2724] border border-[#E8E5DF] dark:border-[#383531] space-y-1">
                  <Zap className="size-4 mx-auto text-amber-500" />
                  <div className="text-[9px] font-mono font-black uppercase">Instant Load</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── BOTTOM CONTROLS & PAGINATION ─── */}
      <div className="pt-4 border-t border-border/60 space-y-4">
        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                currentSlide === idx
                  ? "w-6 bg-[#161514] dark:bg-[#CEF431]"
                  : "w-1.5 bg-[#E8E5DF] dark:bg-[#383531]"
              )}
            />
          ))}
        </div>

        {/* Action Buttons */}
        {currentSlide < totalSlides - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#161514] text-white dark:bg-[#CEF431] dark:text-[#161514] font-heading font-black text-sm tracking-wide border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Next</span>
            <ArrowRight className="size-4 stroke-[2.5]" />
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                onSkipToLogin();
              }}
              className="w-full sm:w-1/3 py-3 px-4 rounded-2xl bg-white dark:bg-[#201E1B] text-[#161514] dark:text-[#FAF8F5] font-heading font-black text-xs border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] hover:bg-[#FAF8F5] cursor-pointer transition-all text-center"
            >
              Skip setup
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                onStartSetup();
              }}
              className="w-full sm:w-2/3 py-3.5 px-5 rounded-2xl bg-[#CEF431] text-[#161514] font-heading font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Set up Invictus</span>
              <ArrowRight className="size-4 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
