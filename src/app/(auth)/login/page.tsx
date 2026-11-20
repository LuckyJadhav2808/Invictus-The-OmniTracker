"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Compass,
  Mail,
  Lock,
  User,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Flame,
  Wallet,
  Sparkles,
  ArrowRight,
  Dumbbell,
  Receipt,
  TrendingUp,
  Activity,
  Heart,
} from "lucide-react";
import { useAuth } from "@/components/shared/AuthProvider";
import { InvictusLogo } from "@/components/shared/InvictusLogo";
import { StrobiCompanion } from "@/components/mascot/StrobiCompanion";
import { APP_VERSION_CONFIG } from "@/config/version";
import { cn } from "@/lib/utils";
import { strobiToast, toast } from "@/lib/utils/toasts";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  const isFromOnboarding = searchParams.get("from") === "onboarding";

  const { enterGuestMode, login, signup } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultTab);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please provide both email and password.");
      return;
    }

    setLoading(true);
    try {
      if (activeTab === "login") {
        const loggedUser = await login(email.trim(), password);
        strobiToast.today(`Welcome back, ${loggedUser.displayName || "Gladiator"}!`, {
          quip: "Vault unlocked! Ready to conquer today.",
        });
        router.push("/today");
      } else {
        if (password.length < 4) {
          toast.error("Password must be at least 4 characters long.");
          setLoading(false);
          return;
        }
        const newUser = await signup(email.trim(), password, name.trim());
        strobiToast.today(`Welcome, ${newUser.displayName || "Gladiator"}!`, {
          quip: "Your personal OS is calibrated & ready.",
        });
        router.push("/today");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Authentication failed. Please verify credentials.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    enterGuestMode("Guest Explorer");
    strobiToast.today("Welcome, Explorer! 🌟", {
      quip: "Exploring in offline-first mode. Full features unlocked!",
    });
    router.push("/today");
  };

  const handleFillDemo = () => {
    setEmail("alex@invictus.app");
    setPassword("invictus2026");
    if (activeTab === "signup") {
      setName("Alex Morgan");
    }
    toast.info("Demo credentials populated. Click Enter Vault to continue.");
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col justify-center items-center py-2 sm:py-4 px-2 sm:px-4">
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-8 items-center">
        {/* ─── DESKTOP/TABLET LEFT SHOWCASE (VISIBLE ON MD+ SCREENS) ─── */}
        <div className="hidden md:flex md:col-span-6 lg:col-span-7 flex-col space-y-3.5 text-left">
          {/* Brand Monolith Header */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <InvictusLogo size="sm" variant="full" href="/" />
              <span className="inline-flex items-center gap-1.5 bg-[#CEF431] text-[#161514] text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full border border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
                <span className="size-1.5 rounded-full bg-[#161514] animate-pulse" />
                v{APP_VERSION_CONFIG.version} • Offline-First OS
              </span>
            </div>

            <h1 className="font-heading font-black text-2xl lg:text-3xl text-[#161514] dark:text-[#FAF8F5] tracking-tight leading-tight">
              Life, habits & money.
              <span className="block text-[#6B6B6B] dark:text-[#A8A29E] text-lg lg:text-xl font-bold">
                In one focused cockpit.
              </span>
            </h1>
          </div>

          {/* Strobi Companion Dialogue Stage */}
          <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#383531] shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_#000000] flex items-center gap-3">
            <div className="shrink-0">
              <StrobiCompanion size={44} gear="gladiator" state="idle" />
            </div>
            <div className="text-left space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
                  ✨ Strobi Companion
                </span>
                <span className="text-[9px] font-mono font-black px-1.5 py-0.2 bg-[#CEF431] text-[#161514] rounded">
                  ONLINE
                </span>
              </div>
              <p className="text-xs font-heading font-medium text-[#6B6B6B] dark:text-[#A8A29E] leading-snug">
                &ldquo;Ready to conquer today? 1-Tap Offline Guest lets you explore without creating an account.&rdquo;
              </p>
            </div>
          </div>

          {/* 2x2 Bento Engine Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Tile 1: Today Command */}
            <div className="bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#383531] rounded-xl p-2.5 shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-[#03D26F]" />
                  <span>Today Cockpit</span>
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 rounded">
                  7-Day Arc
                </span>
              </div>
              <p className="text-[10.5px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                3-second logging & live activity dock
              </p>
            </div>

            {/* Tile 2: Habits & Gym */}
            <div className="bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#383531] rounded-xl p-2.5 shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
                  <Flame className="size-3 text-[#F59E0B]" />
                  <span>Habits & Gym</span>
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 rounded">
                  Anatomy
                </span>
              </div>
              <p className="text-[10.5px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                Muscle telemetry & streak protection
              </p>
            </div>

            {/* Tile 3: Tasks Engine */}
            <div className="bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#383531] rounded-xl p-2.5 shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
                  <Zap className="size-3 text-[#5B7FE5]" />
                  <span>Tasks Engine</span>
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400 rounded">
                  P1 Priority
                </span>
              </div>
              <p className="text-[10.5px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                Zero-friction kanban & flow state
              </p>
            </div>

            {/* Tile 4: Cashflow Ledger */}
            <div className="bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#383531] rounded-xl p-2.5 shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
                  <Wallet className="size-3 text-[#10B981]" />
                  <span>Cashflow</span>
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 rounded">
                  Safe Spend
                </span>
              </div>
              <p className="text-[10.5px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                Belanje envelopes & receipt OCR
              </p>
            </div>
          </div>

          {/* Privacy Guarantee */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>100% On-Device & Encrypted • Zero cloud surveillance</span>
          </div>
        </div>

        {/* ─── AUTH COCKPIT CARD (BENCHMARK MOBILE + DESKTOP DESIGN) ─── */}
        <div className="col-span-1 md:col-span-6 lg:col-span-5 w-full max-w-sm sm:max-w-md mx-auto space-y-2">
          {/* Mobile Mascot & Header Hero (Fills the blank space with benchmark personality) */}
          <div className="flex md:hidden flex-col items-center text-center space-y-1 mb-1">
            <div className="flex items-center gap-2">
              <InvictusLogo size="sm" variant="icon-only" href="/" />
              <span className="font-heading font-black text-lg tracking-tight text-[#161514] dark:text-[#FAF8F5]">
                INVICTUS
              </span>
              <span className="inline-flex items-center gap-1 bg-[#CEF431] text-[#161514] text-[9px] font-mono font-black uppercase px-2 py-0.2 rounded-full border border-[#161514] shadow-xs">
                v{APP_VERSION_CONFIG.version}
              </span>
            </div>

            {/* Mascot Banner with Speech Bubble */}
            <div className="w-full flex items-center justify-center gap-2.5 px-2 py-1 bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000]">
              <div className="shrink-0">
                <StrobiCompanion size={32} gear="gladiator" state="idle" />
              </div>
              <span className="text-[11px] font-heading font-bold text-[#161514] dark:text-[#FAF8F5] text-left">
                &ldquo;Ready to conquer today, Gladiator?&rdquo;
              </span>
            </div>

            {/* Horizontal Mini Telemetry Ticker (Benchmark Apps feature bar) */}
            <div className="w-full flex items-center justify-between gap-1 pt-0.5 text-[9.5px] font-mono">
              <span className="flex items-center gap-1 bg-white dark:bg-[#201D1A] px-2 py-0.5 rounded border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5]">
                <Flame className="size-2.5 text-[#F59E0B]" />
                <span>Habits</span>
              </span>
              <span className="flex items-center gap-1 bg-white dark:bg-[#201D1A] px-2 py-0.5 rounded border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5]">
                <Zap className="size-2.5 text-[#5B7FE5]" />
                <span>Tasks</span>
              </span>
              <span className="flex items-center gap-1 bg-white dark:bg-[#201D1A] px-2 py-0.5 rounded border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5]">
                <Wallet className="size-2.5 text-[#10B981]" />
                <span>Money</span>
              </span>
              <span className="flex items-center gap-1 bg-white dark:bg-[#201D1A] px-2 py-0.5 rounded border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5]">
                <ShieldCheck className="size-2.5 text-emerald-600" />
                <span>Private</span>
              </span>
            </div>
          </div>

          {/* Main Auth Cockpit Container */}
          <div className="bg-white dark:bg-[#161514] rounded-2xl p-3.5 sm:p-5 border-2 border-[#161514] dark:border-[#383531] shadow-[3.5px_3.5px_0px_0px_#161514] dark:shadow-[3.5px_3.5px_0px_0px_#000000] space-y-3 transition-colors">
            {/* Onboarding Calibrated Badge */}
            {isFromOnboarding && (
              <div className="p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#161514] dark:border-[#383531] flex items-center gap-2.5 animate-in fade-in">
                <StrobiCompanion size={28} gear="none" showGear={false} />
                <div className="text-left text-xs leading-tight">
                  <span className="font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
                    Companion Ready!
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    Preferences saved. Enter below to begin.
                  </p>
                </div>
              </div>
            )}

            {/* 1-Tap Offline Guest On-Ramp (Hevy / Linear Benchmark) */}
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-[#CEF431] hover:bg-[#bfe628] text-[#161514] text-xs font-heading font-black uppercase tracking-wider border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Compass className="size-4 stroke-[2.5]" />
                <span>Explore Offline (No Account)</span>
              </div>
              <ArrowRight className="size-3.5 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Clean Calm Divider */}
            <div className="relative py-0.5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#E8E5DF] dark:border-[#2A2724]" />
              </div>
              <div className="relative flex justify-center text-[9px] uppercase font-mono font-bold">
                <span className="bg-white dark:bg-[#161514] px-2 text-[#6B6B6B] dark:text-[#A8A29E]">
                  or sign in to encrypted vault
                </span>
              </div>
            </div>

            {/* Segmented Dual Tabs Switcher */}
            <div className="grid grid-cols-2 p-1 bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#2A2724] rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className={cn(
                  "py-1.5 text-xs font-heading font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  activeTab === "login"
                    ? "bg-[#161514] text-white dark:bg-[#FAF8F5] dark:text-[#161514] shadow-xs"
                    : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5]"
                )}
              >
                <LogIn className="size-3 stroke-[2.5]" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("signup")}
                className={cn(
                  "py-1.5 text-xs font-heading font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  activeTab === "signup"
                    ? "bg-[#161514] text-white dark:bg-[#FAF8F5] dark:text-[#161514] shadow-xs"
                    : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5]"
                )}
              >
                <UserPlus className="size-3 stroke-[2.5]" />
                <span>Create Account</span>
              </button>
            </div>

            {/* Form Controls */}
            <form onSubmit={handleEmailSubmit} className="space-y-2.5">
              {activeTab === "signup" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1">
                    <User className="size-3 stroke-[2] text-[#6B6B6B] dark:text-[#A8A29E]" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    required
                    className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#161514] dark:border-[#2A2724] px-3 py-1.5 sm:py-2 text-xs font-mono font-medium text-[#161514] dark:text-[#FAF8F5] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#CEF431] dark:focus:border-[#CEF431] transition-all"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1">
                  <Mail className="size-3 stroke-[2] text-[#6B6B6B] dark:text-[#A8A29E]" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#161514] dark:border-[#2A2724] px-3 py-1.5 sm:py-2 text-xs font-mono font-medium text-[#161514] dark:text-[#FAF8F5] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#CEF431] dark:focus:border-[#CEF431] transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1">
                  <Lock className="size-3 stroke-[2] text-[#6B6B6B] dark:text-[#A8A29E]" />
                  <span>Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={activeTab === "signup" ? "Min 4 characters" : "Your password"}
                    required
                    className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#161514] dark:border-[#2A2724] px-3 py-1.5 sm:py-2 text-xs font-mono font-medium text-[#161514] dark:text-[#FAF8F5] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#CEF431] dark:focus:border-[#CEF431] transition-all pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5] cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#161514] hover:bg-[#2A2826] text-white dark:bg-[#FAF8F5] dark:text-[#161514] dark:hover:bg-[#E8E5DF] font-heading font-black text-xs uppercase tracking-wider border-2 border-[#161514] dark:border-[#FAF8F5] shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_#FAF8F5] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-3.5 rounded-full border-2 border-white dark:border-[#161514] border-t-transparent animate-spin" />
                    <span>Authenticating...</span>
                  </span>
                ) : activeTab === "login" ? (
                  <span className="flex items-center gap-1.5">
                    <LogIn className="size-3.5 stroke-[2.5]" />
                    <span>Enter Vault</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <UserPlus className="size-3.5 stroke-[2.5]" />
                    <span>Create Vault</span>
                  </span>
                )}
              </button>
            </form>

            {/* Quick Demo Fill Helper */}
            <div className="pt-1.5 flex items-center justify-between text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] border-t border-[#161514]/10 dark:border-[#2A2724]">
              <span className="font-medium">Testing locally?</span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[10px] font-mono font-bold text-[#161514] dark:text-[#FAF8F5] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="size-2.5 text-[#F59E0B]" />
                <span>Fill Demo Credentials</span>
              </button>
            </div>
          </div>

          {/* Security & Offline Footnote */}
          <div className="text-center pt-0.5">
            <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] inline-flex items-center justify-center gap-1 bg-[#FAF8F5] dark:bg-[#1C1A18] px-2.5 py-0.5 rounded-full border border-[#E8E5DF] dark:border-[#2A2724]">
              <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
              <span>100% On-Device & Encrypted • Zero trackers</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0D0C0B] flex items-center justify-center p-4">
          <div className="h-8 w-8 rounded-full border-2 border-[#161514] dark:border-white border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
