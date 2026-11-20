"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OnboardingValueTour } from "@/components/onboarding/OnboardingValueTour";
import {
  OnboardingInteractiveSetup,
  type OnboardingSetupData,
} from "@/components/onboarding/OnboardingInteractiveSetup";
import { StrobiCompanion } from "@/components/mascot/StrobiCompanion";
import { useMascotStore } from "@/store/mascot-store";
import { InvictusLogo } from "@/components/shared/InvictusLogo";
import { DoodleArrow } from "@/components/auth/AuthDoodles";

export default function OnboardingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"tour" | "setup">("tour");
  const storeColor = useMascotStore((s) => s.colorTheme);
  const storeExpr = useMascotStore((s) => s.expression);

  const handleStartSetup = () => {
    setPhase("setup");
  };

  const handleBackToTour = () => {
    setPhase("tour");
  };

  const handleSkipToLogin = () => {
    try {
      localStorage.setItem("invictus_onboarded", "true");
    } catch {}
    router.push("/login");
  };

  const handleCompleteSetup = (data: OnboardingSetupData) => {
    try {
      localStorage.setItem("invictus_onboarded", "true");
      localStorage.setItem("invictus_starter_habits", JSON.stringify(data.selectedHabitIds));
      localStorage.setItem("invictus_starter_daily_limit", String(data.dailyBudgetLimit));
      localStorage.setItem("invictus_starter_cash", String(data.initialCashBalance));
    } catch {}

    toast.success("Companion calibrated! Let's lock in your vault.");
    router.push("/login?tab=signup&from=onboarding");
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto py-2 sm:py-6 px-3 sm:px-4 flex flex-col items-center justify-center min-h-[90vh]">
      {/* ─── DESKTOP AMBIENT STAGE (ON LAPTOPS: SPLIT COMPANION SHOWCASE) ─── */}
      <div className="w-full flex flex-col md:grid md:grid-cols-12 gap-8 lg:gap-12 items-center justify-center">
        {/* Left Column: Mascot Narrative Showcase (Visible on MD+ screens) */}
        <div className="hidden md:flex md:col-span-5 flex-col items-start space-y-6">
          <div className="flex items-center gap-2">
            <InvictusLogo size="md" />
            <span className="font-heading font-black text-xl tracking-tight text-[#161514] dark:text-[#FAF8F5]">
              INVICTUS
            </span>
          </div>

          <div className="relative p-6 rounded-3xl bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] shadow-[4px_4px_0px_0px_#161514] dark:shadow-[4px_4px_0px_0px_#000000] w-full space-y-4">
            <div className="size-28 mx-auto flex items-center justify-center">
              <StrobiCompanion size={96} gear="none" showGear={false} colorTheme={storeColor} expression={storeExpr} />
            </div>

            <div className="space-y-1.5 text-center">
              <h3 className="font-heading font-black text-base text-[#161514] dark:text-[#FAF8F5]">
                {phase === "tour" ? "Meet Your Companion" : "Configuring Your Companion"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {phase === "tour"
                  ? "Strobi guides your first habit and first ledger entry, then steps back so you can focus on pure execution."
                  : "Pick your favorite color palette and expressions. Your companion adapts to your personality."}
              </p>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] font-mono font-bold text-muted-foreground">
              <span>⚡ 100% Offline-First</span>
              <span>🔒 Zero Telemetry</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
            <DoodleArrow className="size-6 text-[#161514] dark:text-[#CEF431] rotate-12" />
            <span>Setup takes under 60 seconds</span>
          </div>
        </div>

        {/* Right Column: Interactive Card Container (Mobile & Desktop) */}
        <div className="w-full md:col-span-7 flex justify-center">
          {phase === "tour" ? (
            <OnboardingValueTour
              onStartSetup={handleStartSetup}
              onSkipToLogin={handleSkipToLogin}
            />
          ) : (
            <OnboardingInteractiveSetup
              onComplete={handleCompleteSetup}
              onBackToTour={handleBackToTour}
              onSkipToLogin={handleSkipToLogin}
            />
          )}
        </div>
      </div>
    </div>
  );
}
