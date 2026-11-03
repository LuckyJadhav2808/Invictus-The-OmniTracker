"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
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
  Shield,
  Layers,
} from "lucide-react";
import { useAuth } from "@/components/shared/AuthProvider";
import { InvictusLogo } from "@/components/shared/InvictusLogo";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "login";

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
        toast.success(`Welcome back, ${loggedUser.displayName || "Champion"}!`);
        router.push("/today");
      } else {
        if (password.length < 4) {
          toast.error("Password must be at least 4 characters long.");
          setLoading(false);
          return;
        }
        const newUser = await signup(email.trim(), password, name.trim());
        toast.success(`Account created successfully! Welcome, ${newUser.displayName}!`);
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
    toast.success("Welcome, Explorer! Exploring Invictus in offline mode 🚀");
    router.push("/today");
  };

  const handleFillDemo = () => {
    setEmail("alex@invictus.app");
    setPassword("invictus2026");
    if (activeTab === "signup") {
      setName("Alex Morgan");
    }
    toast.info("Demo credentials populated! Click Submit to enter. ⚡");
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto py-4 sm:py-6 lg:py-10 px-4 flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-8 lg:gap-12 items-center justify-center">
      {/* ─── LEFT COLUMN: BRAND STORY & 4-PILLAR OS TELEMETRY ─── */}
      <div className="md:col-span-6 lg:col-span-7 space-y-5 text-center md:text-left z-10 w-full flex flex-col items-center md:items-start order-2 md:order-1">
        {/* Brand Header */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <InvictusLogo size="md" variant="full" href="/" />
            <span className="bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs">
              v1.7.8 • Offline-First OS
            </span>
          </div>

          <div className="space-y-1.5 max-w-md mx-auto md:mx-0">
            <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl text-[#161514] dark:text-[#FAF8F5] tracking-tight leading-tight">
              Life, study & money.
              <span className="block text-[#6B6B6B] dark:text-[#A8A29E] text-xl sm:text-2xl font-semibold">
                In one focused cockpit.
              </span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#6B6B6B] dark:text-[#A8A29E] leading-relaxed pt-0.5">
              A high-precision operating system designed for relentless daily execution,
              unbreakable habits, exam mastery, and zero financial leaks.
            </p>
          </div>
        </div>

        {/* 4 Pillars Interactive Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md w-full pt-0.5">
          {/* Pillar 1: Today */}
          <div className="p-3 bg-white dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl shadow-xs flex items-center gap-2.5 transition-all hover:border-[#161514] dark:hover:border-white">
            <div className="size-8 rounded-lg bg-[#CEF431] dark:bg-[#22201D] text-[#161514] dark:text-[#CEF431] flex items-center justify-center shrink-0 border border-[#161514]/10 dark:border-[#2A2724]">
              <CheckCircle2 className="size-4 stroke-[2]" />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="font-sans font-semibold text-xs text-[#161514] dark:text-[#FAF8F5] truncate">Daily Execution</span>
              <span className="font-mono text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">Timeblocks & Live Dock</span>
            </div>
          </div>

          {/* Pillar 2: Habits */}
          <div className="p-3 bg-white dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl shadow-xs flex items-center gap-2.5 transition-all hover:border-[#161514] dark:hover:border-white">
            <div className="size-8 rounded-lg bg-[#03D26F] dark:bg-[#153424] text-[#161514] dark:text-[#03D26F] flex items-center justify-center shrink-0 border border-[#161514]/10 dark:border-[#2A2724]">
              <Flame className="size-4 stroke-[2]" />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="font-sans font-semibold text-xs text-[#161514] dark:text-[#FAF8F5] truncate">Habits & Gym</span>
              <span className="font-mono text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">Anatomy & Macros</span>
            </div>
          </div>

          {/* Pillar 3: Study */}
          <div className="p-3 bg-white dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl shadow-xs flex items-center gap-2.5 transition-all hover:border-[#161514] dark:hover:border-white">
            <div className="size-8 rounded-lg bg-[#C084FC] dark:bg-[#2D1B42] text-[#161514] dark:text-[#C084FC] flex items-center justify-center shrink-0 border border-[#161514]/10 dark:border-[#2A2724]">
              <Zap className="size-4 stroke-[2]" />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="font-sans font-semibold text-xs text-[#161514] dark:text-[#FAF8F5] truncate">Exams & Syllabus</span>
              <span className="font-mono text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">Spaced Repetition</span>
            </div>
          </div>

          {/* Pillar 4: Money */}
          <div className="p-3 bg-white dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl shadow-xs flex items-center gap-2.5 transition-all hover:border-[#161514] dark:hover:border-white">
            <div className="size-8 rounded-lg bg-[#F59E0B] dark:bg-[#38260D] text-[#161514] dark:text-[#F59E0B] flex items-center justify-center shrink-0 border border-[#161514]/10 dark:border-[#2A2724]">
              <Wallet className="size-4 stroke-[2]" />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="font-sans font-semibold text-xs text-[#161514] dark:text-[#FAF8F5] truncate">Cashflow Ledger</span>
              <span className="font-mono text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">UPI & Cash Till</span>
            </div>
          </div>
        </div>

        {/* Air-gap Privacy Assurance Box */}
        <div className="max-w-md w-full p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] flex items-start gap-2.5 text-left">
          <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 stroke-[1.8] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-[#161514] dark:text-[#FAF8F5] block">
              100% Private & Air-Gapped
            </span>
            <p className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E] leading-relaxed">
              Your journals, syllabus masteries, and financial receipts remain encrypted on this device. Zero ads, zero trackers, and zero cloud surveillance.
            </p>
          </div>
        </div>
      </div>

      {/* ─── RIGHT COLUMN: UNIFIED FRICTIONLESS AUTH COCKPIT ─── */}
      <div className="md:col-span-6 lg:col-span-5 w-full max-w-md mx-auto z-10 relative order-1 md:order-2">
        <div className="bg-white dark:bg-[#161514] rounded-2xl p-5 sm:p-7 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-5 transition-colors">
          {/* ZERO-CONFUSION 1-TAP GUEST ON-RAMP */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
                <Compass className="size-4 stroke-[1.8] text-emerald-600 dark:text-emerald-400" />
                <span>Instant Evaluation Mode</span>
              </span>
              <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                1-Tap Ready
              </span>
            </div>
            <p className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E] leading-relaxed">
              Test all workspaces, gym routines, and ledger envelopes immediately without creating an account.
            </p>
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#161514] hover:bg-[#2A2826] text-white dark:bg-[#FAF8F5] dark:text-[#161514] dark:hover:bg-[#E8E5DF] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Compass className="size-3.5 stroke-[2]" />
              <span>Explore as Offline Guest (No Account)</span>
              <ArrowRight className="size-3.5 stroke-[2]" />
            </button>
          </div>

          {/* Calm Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#E8E5DF] dark:border-[#2A2724]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono font-medium">
              <span className="bg-white dark:bg-[#161514] px-2.5 text-[#6B6B6B] dark:text-[#A8A29E]">
                or sign in to synced vault
              </span>
            </div>
          </div>

          {/* Segmented Dual Tabs Switcher */}
          <div className="grid grid-cols-2 p-1 bg-[#F1EFEA] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={cn(
                "py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
                activeTab === "login"
                  ? "bg-white dark:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] shadow-xs"
                  : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5]"
              )}
            >
              <LogIn className="size-3.5 stroke-[1.8]" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("signup")}
              className={cn(
                "py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
                activeTab === "signup"
                  ? "bg-white dark:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] shadow-xs"
                  : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5]"
              )}
            >
              <UserPlus className="size-3.5 stroke-[1.8]" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Form Controls */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {activeTab === "signup" && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
                  <User className="size-3.5 stroke-[1.8] text-[#6B6B6B] dark:text-[#A8A29E]" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required
                  className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2 text-xs font-medium text-[#161514] dark:text-[#FAF8F5] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#161514] dark:focus:border-white transition-all"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
                <Mail className="size-3.5 stroke-[1.8] text-[#6B6B6B] dark:text-[#A8A29E]" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2 text-xs font-medium text-[#161514] dark:text-[#FAF8F5] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#161514] dark:focus:border-white transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
                <Lock className="size-3.5 stroke-[1.8] text-[#6B6B6B] dark:text-[#A8A29E]" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={activeTab === "signup" ? "At least 4 characters" : "Your password"}
                  required
                  className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2 text-xs font-medium text-[#161514] dark:text-[#FAF8F5] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#161514] dark:focus:border-white transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5] cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-3.5 stroke-[1.8]" /> : <Eye className="size-3.5 stroke-[1.8]" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#161514] hover:bg-[#2A2826] text-white dark:bg-[#FAF8F5] dark:text-[#161514] dark:hover:bg-[#E8E5DF] font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs mt-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-3.5 rounded-full border-2 border-white dark:border-[#161514] border-t-transparent animate-spin" />
                  <span>Authenticating...</span>
                </span>
              ) : activeTab === "login" ? (
                <span className="flex items-center gap-2">
                  <LogIn className="size-3.5 stroke-[2]" />
                  <span>Enter Vault</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="size-3.5 stroke-[2]" />
                  <span>Create My Vault</span>
                </span>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Helper */}
          <div className="pt-1 flex items-center justify-between text-[11px] text-[#6B6B6B] dark:text-[#A8A29E] border-t border-[#E8E5DF] dark:border-[#2A2724]">
            <span>Testing the app?</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-mono font-medium text-[#161514] dark:text-[#FAF8F5] hover:underline cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="size-3 text-[#F59E0B]" />
              <span>Fill Demo Credentials</span>
            </button>
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
