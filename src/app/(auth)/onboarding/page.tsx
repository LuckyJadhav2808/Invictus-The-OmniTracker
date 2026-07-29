"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/shared/AuthProvider";
import { customUpdateUser } from "@/lib/custom-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1
          className="text-2xl font-extrabold tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {step === 0 && "Welcome to Invictus! 👋"}
          {step === 1 && "Set Your Preferences"}
          {step === 2 && "What do you want to track?"}
          {step === 3 && "Study Goal Setup"}
        </h1>
        <p className="text-navy-600 text-sm">
          Step {step + 1} of {totalSteps}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-input rounded-full h-2">
        <div
          className="bg-amber-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-[0_8px_24px_rgba(31,36,48,0.08)] space-y-5">
        {/* Step 0: Name */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="displayName"
                className="text-xs font-semibold uppercase tracking-wide text-navy-600"
              >
                What should we call you?
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
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
                className="text-xs font-semibold uppercase tracking-wide text-navy-600 flex items-center gap-1"
              >
                <Globe className="h-3 w-3" /> Timezone
              </label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-amber-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-navy-600 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Week starts on
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
                    className={`flex-1 rounded-[var(--radius-sm)] border py-2 text-sm font-semibold transition-all ${
                      weekStartsOn === opt.value
                        ? "bg-amber-500 text-navy-900 border-amber-500"
                        : "bg-cream-bg/50 border-input text-navy-600 hover:border-amber-500"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="currency"
                className="text-xs font-semibold uppercase tracking-wide text-navy-600"
              >
                Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-amber-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Module selection */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-navy-600">
              Pick the modules you want. You can change this later in Settings.
            </p>
            {[
              {
                key: "goals" as const,
                label: "Goals & Habits",
                desc: "Daily routines, streaks, wellness",
                Icon: Target,
                color: "bg-amber-500",
              },
              {
                key: "study" as const,
                label: "Study Tracker",
                desc: "Subjects, sessions, tests, analytics",
                Icon: BookOpen,
                color: "bg-orange-500",
              },
              {
                key: "money" as const,
                label: "Money Tracker",
                desc: "Income, expenses, budgets, savings",
                Icon: Wallet,
                color: "bg-mint-400",
              },
            ].map(({ key, label, desc, Icon, color }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleModule(key)}
                className={`w-full flex items-center gap-3 p-3 rounded-[var(--radius-md)] border transition-all ${
                  modulesEnabled[key]
                    ? "border-amber-500 bg-amber-500/5"
                    : "border-input bg-cream-bg/30 opacity-60"
                }`}
              >
                <div
                  className={`${color} rounded-[var(--radius-sm)] p-2 text-white`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-navy-600">{desc}</p>
                </div>
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    modulesEnabled[key]
                      ? "bg-amber-500 border-amber-500"
                      : "border-input"
                  }`}
                >
                  {modulesEnabled[key] && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Study target (if study enabled) */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-navy-600">
              Optional — tell us about your study goal so we can show a
              countdown and tailor the dashboard.
            </p>
            <div className="space-y-1.5">
              <label
                htmlFor="examName"
                className="text-xs font-semibold uppercase tracking-wide text-navy-600"
              >
                Exam / Study Goal Name
              </label>
              <input
                id="examName"
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. GATE 2027, SAT, Board Exams, Japanese N3…"
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="examDate"
                className="text-xs font-semibold uppercase tracking-wide text-navy-600"
              >
                Target Date (optional)
              </label>
              <input
                id="examDate"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-full border-input"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance() || loading}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-navy-900 font-bold rounded-full py-2.5 transition-all"
          >
            {step === totalSteps - 1 || (step === 2 && !modulesEnabled.study)
              ? loading
                ? "Setting up…"
                : "Let's Go! 🚀"
              : "Next"}
            {step < totalSteps - 1 &&
              !(step === 2 && !modulesEnabled.study) && (
                <ChevronRight className="h-4 w-4 ml-1" />
              )}
          </Button>
        </div>
      </div>
    </div>
  );
}
