"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/shared/AuthProvider";
import { customUpdateUser } from "@/lib/custom-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import {
  CheckSquare,
  GraduationCap,
  Kanban,
  Wallet,
  ChevronRight,
  ChevronLeft,
  Check,
  Globe,
  Calendar,
  DollarSign,
  User,
  ArrowRight,
} from "lucide-react";
import { InvictusLogo } from "@/components/shared/InvictusLogo";

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
  const [displayName, setDisplayName] = useState(user?.displayName || "");

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

      toast.success("Welcome aboard! Your workspace is ready.");
      window.location.href = "/today";
    } catch {
      localStorage.setItem("invictus_onboarded", "true");
      toast.success("Workspace initialized.");
      window.location.href = "/today";
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 0 && !displayName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
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
    <div className="space-y-6 w-full max-w-lg mx-auto py-6 px-4">
      {/* Brand & Stepper Header */}
      <div className="text-center space-y-3">
        <div className="inline-block">
          <InvictusLogo size="sm" variant="icon-only" href="/" />
        </div>

        <div>
          <h1 className="text-2xl font-heading font-black tracking-tight text-[#161514]">
            {step === 0 && "Welcome to Invictus"}
            {step === 1 && "Regional Preferences"}
            {step === 2 && "Choose Active Modules"}
            {step === 3 && "Study Target Setup"}
          </h1>
          <p className="text-xs font-mono font-bold text-[#161514]/60 mt-0.5">
            Step {step + 1} of {totalSteps}
          </p>
        </div>
      </div>

      {/* Neobrutalist Stepper Bar */}
      <div className="w-full bg-white rounded-full h-3 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] overflow-hidden p-0.5">
        <div
          className="bg-[#CEF431] h-full rounded-full transition-all duration-300"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Main Card */}
      <div className="neo-card p-6 sm:p-8 bg-white border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-6">
        {/* Step 0: Name */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="displayName"
                className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#161514] flex items-center gap-1.5"
              >
                <User className="size-3.5" />
                <span>What should we call you?</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                required
                className="w-full neo-input"
              />
              <p className="text-[11px] text-[#161514]/60 font-medium">
                This will be displayed in your daily briefings and account profile.
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Preferences */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="timezone"
                className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#161514] flex items-center gap-1.5"
              >
                <Globe className="size-3.5 stroke-[2.5]" />
                <span>Timezone</span>
              </label>
              <NeobrutalistSelect
                value={timezone}
                onChange={setTimezone}
                options={TIMEZONES.map((tz) => ({
                  value: tz,
                  label: tz,
                }))}
                placeholder="Select Timezone"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#161514] flex items-center gap-1.5">
                <Calendar className="size-3.5 stroke-[2.5]" />
                <span>Week Starts On</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Monday", value: 1 as const },
                  { label: "Sunday", value: 0 as const },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setWeekStartsOn(opt.value)}
                    className={`rounded-xl border-2 border-[#161514] py-2 text-xs font-heading font-extrabold transition-all cursor-pointer min-h-[42px] ${
                      weekStartsOn === opt.value
                        ? "bg-[#CEF431] text-[#161514] shadow-[2px_2px_0px_0px_#161514]"
                        : "bg-white text-[#161514]/70 shadow-[1px_1px_0px_0px_#161514] hover:bg-[#F1EFEA]"
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
                className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#161514] flex items-center gap-1.5"
              >
                <DollarSign className="size-3.5 stroke-[2.5]" />
                <span>Default Currency</span>
              </label>
              <NeobrutalistSelect
                value={currency}
                onChange={setCurrency}
                options={CURRENCIES.map((c) => ({
                  value: c,
                  label: c,
                }))}
                placeholder="Select Currency"
              />
            </div>
          </div>
        )}

        {/* Step 2: Module selection */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-[#161514]/70 font-medium">
              Choose the primary spaces you want enabled. You can always toggle them later in Settings.
            </p>
            {[
              {
                key: "goals" as const,
                label: "Goals & Habits",
                desc: "Routines, streaks, wellness & logs",
                Icon: CheckSquare,
                accentBg: "bg-[#03D26F]",
              },
              {
                key: "study" as const,
                label: "Study & Exams",
                desc: "Subjects, syllabus checklist & test logs",
                Icon: GraduationCap,
                accentBg: "bg-[#C084FC]",
              },
              {
                key: "money" as const,
                label: "Money & Ledger",
                desc: "Cash flow, category budgets & vault",
                Icon: Wallet,
                accentBg: "bg-[#03D26F]",
              },
            ].map(({ key, label, desc, Icon, accentBg }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleModule(key)}
                className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl border-2 border-[#161514] transition-all cursor-pointer text-left ${
                  modulesEnabled[key]
                    ? "bg-white shadow-[3px_3px_0px_0px_#161514]"
                    : "bg-[#F1EFEA] opacity-60 shadow-none"
                }`}
              >
                <div
                  className={`size-10 rounded-lg ${accentBg} text-[#161514] border-2 border-[#161514] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_#161514]`}
                >
                  <Icon className="size-5 stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-extrabold text-sm text-[#161514]">{label}</p>
                  <p className="text-xs text-[#161514]/65 font-medium">{desc}</p>
                </div>
                <div
                  className={`size-5 rounded-md border-2 border-[#161514] flex items-center justify-center ${
                    modulesEnabled[key] ? "bg-[#CEF431]" : "bg-white"
                  }`}
                >
                  {modulesEnabled[key] && <Check className="size-3.5 stroke-[3] text-[#161514]" />}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Study Target (Conditional) */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-[#161514]/70 font-medium">
              Optionally configure an exam target to display automatic countdowns and syllabus tracking.
            </p>
            <div className="space-y-1.5">
              <label
                htmlFor="examName"
                className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#161514]"
              >
                Target Exam / Goal Name
              </label>
              <input
                id="examName"
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. GATE 2027, USMLE, Semester Finals"
                className="w-full neo-input"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="examDate"
                className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#161514]"
              >
                Target Date
              </label>
              <input
                id="examDate"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full neo-input"
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              className="flex-1"
            >
              <ChevronLeft className="size-4" />
              <span>Back</span>
            </Button>
          ) : (
            <div className="flex-1" />
          )}

          <Button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="flex-1 bg-[#CEF431] hover:bg-[#D8F74E]"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="size-3.5 rounded-full border-2 border-[#161514] border-t-transparent animate-spin" />
                <span>Saving...</span>
              </span>
            ) : step === totalSteps - 1 || (step === 2 && !modulesEnabled.study) ? (
              <span className="flex items-center gap-1.5">
                <span>Finish Setup</span>
                <Check className="size-4 stroke-[2.5]" />
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span>Continue</span>
                <ArrowRight className="size-4" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
