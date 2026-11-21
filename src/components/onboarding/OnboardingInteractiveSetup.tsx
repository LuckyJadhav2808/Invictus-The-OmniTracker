"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Wallet,
  Coins,
  Sparkles,
  Edit2,
  Smartphone,
  ShieldCheck,
  Zap,
  Lock,
} from "lucide-react";
import {
  useMascotStore,
  MASCOT_COLOR_THEMES,
  MASCOT_EXPRESSIONS,
  type MascotColorTheme,
  type MascotExpression,
} from "@/store/mascot-store";
import { StrobiCompanion } from "@/components/mascot/StrobiCompanion";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { isSmsSyncAvailable, SmsBridge } from "@/lib/sms/sms-sync-service";
import { toast } from "sonner";

export interface OnboardingSetupData {
  colorTheme: MascotColorTheme;
  expression: MascotExpression;
  selectedHabitIds: string[];
  dailyBudgetLimit: number;
  initialCashBalance: number;
  smsAutoFetchEnabled?: boolean;
}

interface OnboardingInteractiveSetupProps {
  onComplete: (data: OnboardingSetupData) => void;
  onBackToTour: () => void;
  onSkipToLogin: () => void;
}

const STARTER_HABITS = [
  {
    id: "habit_water",
    title: "Drink 2.5L Water",
    category: "health",
    icon: "💧",
    xp: 25,
  },
  {
    id: "habit_gym",
    title: "Daily Workout / Gym",
    category: "fitness",
    icon: "🏋️",
    xp: 50,
  },
  {
    id: "habit_study",
    title: "45m Deep Work Focus",
    category: "study",
    icon: "🧠",
    xp: 50,
  },
  {
    id: "habit_reading",
    title: "Read 15 Pages",
    category: "growth",
    icon: "📖",
    xp: 30,
  },
  {
    id: "habit_early_rise",
    title: "7:00 AM Rise & Shine",
    category: "discipline",
    icon: "🌅",
    xp: 35,
  },
  {
    id: "habit_nutrition",
    title: "Track Healthy Nutrition",
    category: "wellness",
    icon: "🥗",
    xp: 30,
  },
];

const BUDGET_PRESETS = [250, 500, 750, 1200];

export function OnboardingInteractiveSetup({
  onComplete,
  onBackToTour,
  onSkipToLogin,
}: OnboardingInteractiveSetupProps) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  // Mascot selections
  const storeColor = useMascotStore((s) => s.colorTheme);
  const storeExpression = useMascotStore((s) => s.expression);
  const setColorTheme = useMascotStore((s) => s.setColorTheme);
  const setExpression = useMascotStore((s) => s.setExpression);

  const [selectedColor, setSelectedColor] = useState<MascotColorTheme>(storeColor || "classic-blue");
  const [selectedExpression, setSelectedExpression] = useState<MascotExpression>(storeExpression || "joy");

  // Habits selections (default 2 picked)
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([
    "habit_water",
    "habit_study",
  ]);

  // Budget & Accounts selections
  const [dailyBudget, setDailyBudget] = useState<number>(500);
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [isEditingCash, setIsEditingCash] = useState(false);

  // Bank SMS Telemetry Setup
  const [smsAutoFetchEnabled, setSmsAutoFetchEnabled] = useState(true);
  const [isNative, setIsNative] = useState(false);
  const [hasSmsPermission, setHasSmsPermission] = useState<boolean | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => {
    isSmsSyncAvailable().then(async (avail) => {
      setIsNative(avail);
      if (avail) {
        try {
          const perm = await SmsBridge.checkPermissions();
          setHasSmsPermission(perm.smsGranted);
        } catch {
          setHasSmsPermission(false);
        }
      }
    });
  }, []);

  const handleRequestSmsPermission = async () => {
    soundFX.playPop();
    setIsRequestingPermission(true);
    try {
      const res = await SmsBridge.requestPermissions();
      if (res.smsGranted) {
        soundFX.playCompleteChime();
        setHasSmsPermission(true);
        setSmsAutoFetchEnabled(true);
        toast.success("SMS Permission Granted!", {
          description: "Invictus can now detect incoming bank payments locally.",
        });
      } else {
        soundFX.playPop();
        setHasSmsPermission(false);
        toast.info("SMS permission denied. You can enable it later in Settings.");
      }
    } catch (err: any) {
      toast.error(err.message || "Could not request SMS permission.");
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const totalSteps = 4;

  const handleToggleHabit = (id: string) => {
    soundFX.playPop();
    setSelectedHabitIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNextStep = () => {
    soundFX.playPop();
    if (step < 3) {
      setStep((prev) => (prev + 1) as 0 | 1 | 2 | 3);
    } else {
      // Save mascot config in store
      setColorTheme(selectedColor);
      setExpression(selectedExpression);

      onComplete({
        colorTheme: selectedColor,
        expression: selectedExpression,
        selectedHabitIds,
        dailyBudgetLimit: dailyBudget,
        initialCashBalance: cashBalance,
        smsAutoFetchEnabled,
      });
    }
  };

  const handlePrevStep = () => {
    soundFX.playPop();
    if (step > 0) {
      setStep((prev) => (prev - 1) as 0 | 1 | 2 | 3);
    } else {
      onBackToTour();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col justify-between min-h-[580px] sm:min-h-[620px] p-5 sm:p-6 bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#383531] rounded-3xl shadow-[4px_4px_0px_0px_#161514] dark:shadow-[4px_4px_0px_0px_#000000] select-none transition-all">
      {/* ─── TOP BAR: BACK, PROGRESS INDICATOR & SKIP ─── */}
      <div className="space-y-2.5 pb-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevStep}
            className="p-1.5 rounded-lg border border-[#161514] dark:border-[#383531] bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] hover:bg-[#FAF8F5] cursor-pointer transition-transform active:scale-90"
            aria-label="Previous step"
          >
            <ArrowLeft className="size-3.5 stroke-[2.5]" />
          </button>

          <span className="text-[11px] font-mono font-black text-muted-foreground uppercase tracking-wider">
            Step 0{step + 1} of 0{totalSteps}
          </span>

          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              onSkipToLogin();
            }}
            className="text-xs font-mono font-bold text-muted-foreground hover:text-[#161514] dark:hover:text-[#FAF8F5] underline underline-offset-4 cursor-pointer transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Segmented Step Progress Bar */}
        <div className="grid grid-cols-4 gap-1.5 w-full">
          {[0, 1, 2, 3].map((sIndex) => (
            <div
              key={sIndex}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                step >= sIndex
                  ? "bg-[#161514] dark:bg-[#CEF431]"
                  : "bg-[#E8E5DF] dark:bg-[#383531]"
              )}
            />
          ))}
        </div>
      </div>

      {/* ─── STEP BODY ─── */}
      <div className="flex-1 flex flex-col justify-center py-3">
        {/* STEP 1: PICK YOUR STROBI (COLOR & EXPRESSION) */}
        {step === 0 && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1 text-center">
              <h2 className="text-xl sm:text-2xl font-heading font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                Pick Your Strobi
              </h2>
              <p className="text-xs font-medium text-muted-foreground">
                Your customizable companion across Invictus: on Home, in Habits, and guiding your empty states.
              </p>
            </div>

            {/* Live Interactive Preview */}
            <div className="size-28 sm:size-32 mx-auto flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-[#201E1B] border-2 border-[#161514] dark:border-[#383531] shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_#000000]">
              <StrobiCompanion
                size={88}
                gear="none"
                showGear={false}
                colorTheme={selectedColor}
                expression={selectedExpression}
              />
            </div>

            {/* Color Palette Matrix */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Sparkles className="size-3 text-[#CEF431]" />
                <span>Color Theme</span>
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.keys(MASCOT_COLOR_THEMES) as MascotColorTheme[]).map((themeKey) => {
                  const cfg = MASCOT_COLOR_THEMES[themeKey];
                  const isSelected = selectedColor === themeKey;
                  return (
                    <button
                      key={themeKey}
                      type="button"
                      onClick={() => {
                        soundFX.playPop();
                        setSelectedColor(themeKey);
                      }}
                      className={cn(
                        "p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer",
                        isSelected
                          ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] border-[#161514] dark:border-white shadow-xs scale-102"
                          : "bg-white dark:bg-[#201E1B] border-border text-foreground hover:bg-[#FAF8F5]"
                      )}
                    >
                      <div
                        className="size-4 rounded-full border border-black/30"
                        style={{ backgroundColor: cfg.previewColor }}
                      />
                      <span className="text-[9px] font-mono font-bold truncate max-w-full">
                        {cfg.label.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expression Matrix */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Companion Mood & Expression
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {MASCOT_EXPRESSIONS.map((expr) => {
                  const isSelected = selectedExpression === expr.id;
                  return (
                    <button
                      key={expr.id}
                      type="button"
                      onClick={() => {
                        soundFX.playPop();
                        setSelectedExpression(expr.id);
                      }}
                      className={cn(
                        "p-1.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs font-heading font-black",
                        isSelected
                          ? "bg-[#CEF431] text-[#161514] border-[#161514] shadow-xs"
                          : "bg-white dark:bg-[#201E1B] border-border text-foreground hover:bg-[#FAF8F5]"
                      )}
                    >
                      <span>{expr.emoji}</span>
                      <span className="text-[10px] font-mono font-bold">{expr.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CHOOSE STARTER HABITS */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1 text-center">
              <h2 className="text-xl sm:text-2xl font-heading font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                Choose Starter Habits
              </h2>
              <p className="text-xs font-medium text-muted-foreground">
                Pick 1 to 3 core habits to build your foundation. You can tweak or add more any time.
              </p>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar pr-0.5">
              {STARTER_HABITS.map((habit) => {
                const isSelected = selectedHabitIds.includes(habit.id);
                return (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => handleToggleHabit(habit.id)}
                    className={cn(
                      "w-full p-3 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all cursor-pointer text-left",
                      isSelected
                        ? "bg-[#FAF8F5] dark:bg-[#252321] border-[#161514] dark:border-[#CEF431] shadow-[2.5px_2.5px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_#000000]"
                        : "bg-white dark:bg-[#201E1B] border-border hover:border-[#161514]/40 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{habit.icon}</span>
                      <div className="truncate">
                        <div className="text-xs sm:text-sm font-heading font-black text-[#161514] dark:text-[#FAF8F5] truncate">
                          {habit.title}
                        </div>
                        <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                          +{habit.xp} XP • {habit.category}
                        </div>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "size-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors",
                        isSelected
                          ? "bg-[#03D26F] text-[#161514] border-[#161514]"
                          : "border-border bg-white dark:bg-[#2A2724]"
                      )}
                    >
                      {isSelected && <Check className="size-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-center">
              <span className="text-[11px] font-mono font-bold text-muted-foreground">
                {selectedHabitIds.length} habits selected
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: FINANCIAL PACE & ACCOUNTS */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1 text-center">
              <h2 className="text-xl sm:text-2xl font-heading font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                Set Safe Daily Pace
              </h2>
              <p className="text-xs font-medium text-muted-foreground">
                Optional. Calibrate your daily spend velocity so your month stays stress-free.
              </p>
            </div>

            {/* Daily Pace Selector Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#201E1B] border-2 border-[#161514] dark:border-[#383531] shadow-[2.5px_2.5px_0px_#161514] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <Wallet className="size-3 text-emerald-500" />
                  <span>Target Daily Spend Limit</span>
                </span>
                <span className="text-base font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
                  ₹{dailyBudget} <span className="text-xs font-mono font-normal text-muted-foreground">/ day</span>
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {BUDGET_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setDailyBudget(preset);
                    }}
                    className={cn(
                      "py-2 px-1 rounded-xl border text-xs font-mono font-black transition-all cursor-pointer text-center",
                      dailyBudget === preset
                        ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] border-[#161514] shadow-xs"
                        : "bg-[#FAF8F5] dark:bg-[#2A2724] border-border text-foreground hover:bg-muted"
                    )}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Starting Cash Card (Patang Pattern: "Cash is already here") */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#201E1B] border-2 border-[#161514] dark:border-[#383531] shadow-[2.5px_2.5px_0px_#161514] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-amber-400 text-[#161514] border border-[#161514] flex items-center justify-center font-black">
                    <Coins className="size-4" />
                  </div>
                  <div>
                    <div className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
                      Cash in Wallet
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      Physical Cash Till
                    </div>
                  </div>
                </div>

                {isEditingCash ? (
                  <input
                    type="number"
                    value={cashBalance}
                    onChange={(e) => setCashBalance(Number(e.target.value) || 0)}
                    onBlur={() => setIsEditingCash(false)}
                    autoFocus
                    className="w-20 px-2 py-1 text-right text-xs font-mono font-black bg-[#FAF8F5] dark:bg-[#2A2724] border border-[#161514] rounded-lg"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingCash(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-[#2A2724] border border-border text-xs font-mono font-black hover:border-[#161514] cursor-pointer"
                  >
                    <span>₹{cashBalance}</span>
                    <Edit2 className="size-3 text-muted-foreground" />
                  </button>
                )}
              </div>
              <p className="text-[10px] font-mono text-muted-foreground">
                Cash starts at ₹0. You can track UPI bank accounts and credit cards anytime inside the Money tab.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: BANK SMS AUTO-TRACKER (ZERO-KNOWLEDGE TELEMETRY) */}
        {step === 3 && (
          <div className="space-y-3 sm:space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1 text-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#CEF431] text-[#161514] border border-[#161514] text-[10px] font-mono font-black uppercase tracking-wider mb-1">
                <Zap className="size-3 fill-[#161514]" />
                <span>Zero-Knowledge Telemetry</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                Bank SMS Auto-Track
              </h2>
              <p className="text-xs font-medium text-muted-foreground max-w-xs mx-auto">
                Invictus parses incoming bank SMS on-device into instant 1-tap ledger entries with NLP categorization.
              </p>
            </div>

            {/* Live Interactive Telemetry Simulation Card */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#201E1B] border-2 border-[#161514] dark:border-[#383531] shadow-[2.5px_2.5px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_#000000] space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E5DF] dark:border-[#2A2724]">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-lg bg-[#CEF431] text-[#161514] border border-[#161514] flex items-center justify-center font-black text-xs">
                    ₹
                  </div>
                  <span className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
                    Sample Payment SMS
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  On-Device NLP
                </span>
              </div>

              {/* Sample Bank SMS Box */}
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#2A2724] border border-[#E8E5DF] dark:border-[#383531] font-mono text-[11px] text-[#161514] dark:text-[#FAF8F5] leading-relaxed">
                <span className="text-muted-foreground">HDFC Bank:</span> Paid <span className="font-bold text-rose-600 dark:text-rose-400">₹320.00</span> to <span className="font-bold">Blue Tokai Coffee</span> thru UPI on 21-Nov.
              </div>

              {/* Parsed Actionable Notification Simulation */}
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Smartphone className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="truncate">
                    <div className="text-[11px] font-heading font-black text-[#161514] dark:text-[#FAF8F5] truncate">
                      ⚡ Spent ₹320: Blue Tokai
                    </div>
                    <div className="text-[9px] font-mono text-muted-foreground">
                      Predicted Category: Food & Dining
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="px-2 py-0.5 rounded bg-[#161514] text-[#CEF431] text-[10px] font-mono font-black border border-[#161514]">
                    ⚡ Import
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#201E1B] text-[#161514] dark:text-[#FAF8F5] text-[10px] font-mono font-bold border border-border">
                    ✎ Edit
                  </span>
                </div>
              </div>
            </div>

            {/* Privacy Badges List */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 rounded-xl bg-white dark:bg-[#201E1B] border border-[#E8E5DF] dark:border-[#383531] flex items-center gap-1.5 text-muted-foreground">
                <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">Strict OTP Dropper</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-[#201E1B] border border-[#E8E5DF] dark:border-[#383531] flex items-center gap-1.5 text-muted-foreground">
                <Lock className="size-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Zero Cloud Telemetry</span>
              </div>
            </div>

            {/* Native Android Permission Action or Auto-Fetch Toggle */}
            <div className="pt-1 space-y-2">
              {isNative && hasSmsPermission !== true ? (
                <button
                  type="button"
                  onClick={handleRequestSmsPermission}
                  disabled={isRequestingPermission}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] font-heading font-black text-xs uppercase tracking-wider border border-[#161514] flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <Smartphone className="size-3.5" />
                  <span>{isRequestingPermission ? "Requesting..." : "Grant SMS Permission"}</span>
                </button>
              ) : (
                <div
                  onClick={() => {
                    soundFX.playPop();
                    setSmsAutoFetchEnabled((prev) => !prev);
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#201E1B] border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_#161514] cursor-pointer hover:bg-[#FAF8F5] transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
                      Auto-Detect Bank SMS
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {smsAutoFetchEnabled ? "Active: Background telemetry enabled" : "Paused: Manual entry only"}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "w-11 h-6 rounded-full border-2 border-[#161514] p-0.5 transition-colors duration-200 ease-in-out flex items-center",
                      smsAutoFetchEnabled ? "bg-[#03D26F] justify-end" : "bg-[#E8E5DF] dark:bg-[#2A2724] justify-start"
                    )}
                  >
                    <div className="size-4 rounded-full bg-[#161514] dark:bg-white shadow-xs" />
                  </div>
                </div>
              )}

              <p className="text-[10px] font-mono text-muted-foreground text-center">
                Can be toggled or re-configured anytime in Settings &gt; Bank SMS.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── BOTTOM CTA BUTTON ─── */}
      <div className="pt-3 border-t border-border/60">
        <button
          type="button"
          onClick={handleNextStep}
          className="w-full py-3.5 px-6 rounded-2xl bg-[#CEF431] text-[#161514] font-heading font-black text-sm uppercase tracking-wider border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{step < 3 ? "Continue" : "Finish Setup & Enter Vault"}</span>
          <ArrowRight className="size-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
