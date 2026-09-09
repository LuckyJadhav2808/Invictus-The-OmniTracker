"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/shared/AuthProvider";
import { customUpdateUser } from "@/lib/custom-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import {
  Target,
  BookOpen,
  Wallet,
  ChevronRight,
  ChevronLeft,
  Check,
  Globe,
  Calendar,
} from "lucide-react";

const TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD"];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Name
  const [displayName, setDisplayName] = useState(
    user?.displayName || ""
  );

  // Step 2: Preferences
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(1);
  const [currency, setCurrency] = useState("INR");

  // Step 3: Modules
  const [modulesEnabled, setModulesEnabled] = useState({
    goals: true,
    study: true,
    money: true,
  });

  // Step 4: Study target (conditional)
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");

  const totalSteps = modulesEnabled.study ? 4 : 3;

  const toggleModule = (mod: "goals" | "study" | "money") => {
    setModulesEnabled((prev) => ({ ...prev, [mod]: !prev[mod] }));
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const isGuestMode = localStorage.getItem("invictus_guest_mode") === "true";

      const profileData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName || "User",
        timezone,
        weekStartsOn,
        currency,
        onboarded: true,
        modulesEnabled,
        ...(modulesEnabled.study && examName
          ? {
              studyTarget: {
                examName,
                examDate: examDate || null,
              },
            }
          : {}),
      };

      localStorage.setItem("invictus_onboarded", "true");
      localStorage.setItem("invictus_user_profile", JSON.stringify(profileData));
      
      if (!isGuestMode) {
        customUpdateUser(user.uid, profileData);
      } else {
        localStorage.setItem("invictus_guest_name", displayName || user.displayName || "User");
      }

      toast.success("You're all set! Let's go 🎉");
      window.location.href = "/today";
    } catch {
      localStorage.setItem("invictus_onboarded", "true");
      toast.success("You're all set! Let's go 🎉");
      window.location.href = "/today";
    } finally {
      setLoading(false);
    }
  };

  const canAdvance = () => {
    if (step === 0) return displayName.trim().length > 0;
    if (step === 1) return true;
    if (step === 2) return true;
    if (step === 3) return true;
    return true;
  };

  const handleNext = () => {
    if (step === 2 && !modulesEnabled.study) {
      handleFinish();
      return;
    }
    if (step === totalSteps - 1) {
      handleFinish();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="space-y-6 w-full max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <h1
          className="text-2xl font-black tracking-tight text-[#161514]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {step === 0 && "Welcome to Invictus! 👋"}
          {step === 1 && "Set Your Preferences"}
          {step === 2 && "What do you want to track?"}
          {step === 3 && "Study Goal Setup"}
        </h1>
        <p className="text-[#161514]/60 text-sm font-bold">
          Step {step + 1} of {totalSteps}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white rounded-full h-3 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] overflow-hidden">
        <div
          className="bg-[#CEF431] h-full rounded-full transition-all duration-300"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border-[2.5px] border-[#161514] shadow-[6px_6px_0px_0px_#161514] space-y-5">
        {/* Step 0: Name */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="displayName"
                className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]"
              >
                What should we call you?
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full neo-input text-base md:text-sm font-bold min-h-[44px]"
              />
            </div>
          </div>
        )}

        {/* Step 1: Preferences */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="timezone"
                className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514] flex items-center gap-1"
              >
                <Globe className="h-3 w-3 stroke-[2.5]" /> Timezone
              </label>
              <NeobrutalistSelect
                value={timezone}
                onChange={setTimezone}
                options={TIMEZONES.map((tz) => ({
                  value: tz,
                  label: tz,
                  icon: "🌐",
                }))}
                placeholder="Select Timezone"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514] flex items-center gap-1">
                <Calendar className="h-3 w-3 stroke-[2.5]" /> Week starts on
              </label>
              <div className="flex gap-2">
                {[
                  { label: "Monday", value: 1 as const },
                  { label: "Sunday", value: 0 as const },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setWeekStartsOn(opt.value)}
                    className={`flex-1 rounded-xl border-2 border-[#161514] py-2.5 text-sm font-black transition-all cursor-pointer min-h-[44px] ${
                      weekStartsOn === opt.value
                        ? "bg-[#CEF431] text-[#161514] shadow-[2px_2px_0px_0px_#161514]"
                        : "bg-white text-[#161514]/60 shadow-[1.5px_1.5px_0px_0px_#161514] hover:bg-[#FAF8F5]"
                    } active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="currency"
                className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]"
              >
                Currency
              </label>
              <NeobrutalistSelect
                value={currency}
                onChange={setCurrency}
                options={CURRENCIES.map((c) => ({
                  value: c,
                  label: c,
                  icon: "💰",
                }))}
                placeholder="Select Currency"
              />
            </div>
          </div>
        )}

        {/* Step 2: Module selection */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-[#161514]/60 font-bold">
              Pick the modules you want. You can change this later in Settings.
            </p>
            {[
              {
                key: "goals" as const,
                label: "Goals & Habits",
                desc: "Daily routines, streaks, wellness",
                Icon: Target,
                color: "bg-amber-400",
                emoji: "🌱",
              },
              {
                key: "study" as const,
                label: "Study Tracker",
                desc: "Subjects, sessions, tests, analytics",
                Icon: BookOpen,
                color: "bg-orange-400",
                emoji: "📚",
              },
              {
                key: "money" as const,
                label: "Money Tracker",
                desc: "Income, expenses, budgets, savings",
                Icon: Wallet,
                color: "bg-[#03D26F]",
                emoji: "💰",
              },
            ].map(({ key, label, desc, Icon, color, emoji }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleModule(key)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-[#161514] transition-all cursor-pointer min-h-[60px] ${
                  modulesEnabled[key]
                    ? "bg-[#CEF431]/20 shadow-[3px_3px_0px_0px_#161514]"
                    : "bg-white shadow-[2px_2px_0px_0px_#161514] opacity-60"
                } hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`}
              >
                <div
                  className={`${color} rounded-xl p-2.5 text-white border border-[#161514] flex items-center justify-center text-lg`}
                >
                  {emoji}
                </div>
                <div className="text-left flex-1">
                  <p className="font-black text-sm text-[#161514]">{label}</p>
                  <p className="text-xs text-[#161514]/60 font-bold">{desc}</p>
                </div>
                <div
                  className={`h-6 w-6 rounded-lg border-2 border-[#161514] flex items-center justify-center transition-all ${
                    modulesEnabled[key]
                      ? "bg-[#03D26F] shadow-[1px_1px_0px_0px_#161514]"
                      : "bg-white"
                  }`}
                >
                  {modulesEnabled[key] && (
                    <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Study target (if study enabled) */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-[#161514]/60 font-bold">
              Optional — tell us about your study goal so we can show a
              countdown and tailor the dashboard.
            </p>
            <div className="space-y-1.5">
              <label
                htmlFor="examName"
                className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]"
              >
                Exam / Study Goal Name
              </label>
              <input
                id="examName"
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. GATE 2027, SAT, Board Exams, Japanese N3…"
                className="w-full neo-input text-base md:text-sm font-bold min-h-[44px]"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="examDate"
                className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]"
              >
                Target Date (optional)
              </label>
              <input
                id="examDate"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full neo-input text-base md:text-sm font-bold min-h-[44px]"
              />
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2.5 rounded-xl border-2 border-[#161514] bg-white text-[#161514] font-black text-sm shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center gap-1 min-h-[48px]"
            >
              <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance() || loading}
            className="flex-1 bg-[#CEF431] hover:bg-[#bce028] text-[#161514] font-black rounded-xl py-2.5 text-sm uppercase tracking-wider transition-all cursor-pointer border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 flex items-center justify-center gap-1 min-h-[48px]"
          >
            {step === totalSteps - 1 || (step === 2 && !modulesEnabled.study)
              ? loading
                ? "Setting up…"
                : "Let's Go! 🚀"
              : "Next"}
            {step < totalSteps - 1 &&
              !(step === 2 && !modulesEnabled.study) && (
                <ChevronRight className="h-4 w-4 stroke-[2.5]" />
              )}
          </button>
        </div>
      </div>
    </div>
  );
}
