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
  Dumbbell,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/components/shared/AuthProvider";
import { InvictusLogo } from "@/components/shared/InvictusLogo";
import { StrobiCompanion } from "@/components/mascot/StrobiCompanion";
import { DoodleInvictusTitle } from "@/components/auth/DoodleInvictusTitle";
import { DoodleArrow } from "@/components/auth/AuthDoodles";
import { APP_VERSION_CONFIG } from "@/config/version";
import { cn } from "@/lib/utils";

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
        toast.success(`Welcome back, ${loggedUser.displayName || "Friend"}!`);
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
    toast.success("Welcome! Exploring Invictus in offline mode.");
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
    <div className="relative w-full max-w-6xl mx-auto py-3 sm:py-6 lg:py-8 px-3 sm:px-4 flex flex-col md:grid md:grid-cols-12 gap-6 lg:gap-10 items-start justify-center">
      {/* ─── DESKTOP/TABLET BENTO DECK (ON MOBILE: PLACED SECOND TO PRESERVE 0-SCROLL LOGIN) ─── */}
      <div className="w-full md:col-span-6 lg:col-span-7 space-y-4 sm:space-y-5 order-2 md:order-1 flex flex-col items-center md:items-start text-center md:text-left">
        {/* Brand Monolith Header */}
        <div className="space-y-2 w-full max-w-lg">
          <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
            <InvictusLogo size="md" variant="full" href="/" />
            <span className="inline-flex items-center gap-1.5 bg-[#CEF431] text-[#161514] text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full border border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
              <span className="size-1.5 rounded-full bg-[#161514] animate-pulse" />
              v{APP_VERSION_CONFIG.version} • Offline-First OS
            </span>
          </div>

          <DoodleInvictusTitle size="lg" showSubtitle={false} className="my-1" />

          <div className="space-y-1">
            <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl text-[#161514] dark:text-[#FAF8F5] tracking-tight leading-tight">
              Life, habits & money.
              <span className="block text-[#6B6B6B] dark:text-[#A8A29E] text-lg sm:text-2xl font-bold">
                In one focused cockpit.
              </span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#6B6B6B] dark:text-[#A8A29E] leading-relaxed max-w-md mx-auto md:mx-0">
              Personal operating system for disciplined tasks, atomic habits, workout telemetry, and calm money tracking.
            </p>
          </div>
        </div>

        {/* ─── NEOBRUTALIST TACTICAL BENTO GRID ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
          {/* Bento Card 1: Today Command Cockpit (Hero Tile) */}
          <div className="sm:col-span-2 bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#2A2724] rounded-2xl p-3.5 shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#2A2724] text-left transition-all hover:-translate-y-0.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-[#CEF431] text-[#161514] flex items-center justify-center border border-[#161514] shadow-[1px_1px_0px_0px_#161514] shrink-0">
                  <CheckCircle2 className="size-4 stroke-[2.5]" />
                </div>
                <div>
                  <span className="font-heading font-black text-xs uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
                    Today Cockpit
                  </span>
                  <span className="font-mono text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">
                    Agenda & Live Dock
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white dark:bg-[#22201D] text-[#161514] dark:text-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#161514]/20 dark:border-[#2A2724]">
                7-Day Horizon
              </span>
            </div>

            {/* Micro-Telemetry: Mini Week Scrubber & Daily Progress */}
            <div className="bg-white dark:bg-[#1C1A18] rounded-xl p-2.5 border border-[#161514]/15 dark:border-[#2A2724] space-y-2">
              <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => {
                  const isActive = idx === 3; // Wednesday
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex-1 flex flex-col items-center py-1 rounded-md transition-colors",
                        isActive
                          ? "bg-[#161514] text-[#CEF431] font-black border border-[#161514] dark:bg-[#CEF431] dark:text-[#161514]"
                          : "text-[#6B6B6B] dark:text-[#A8A29E] bg-[#FAF8F5] dark:bg-[#22201D]"
                      )}
                    >
                      <span className="text-[8px] uppercase">{day}</span>
                      <span className="text-[10px]">{15 + idx}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#E8E5DF] dark:border-[#2A2724] text-[11px] font-mono">
                <span className="text-[#6B6B6B] dark:text-[#A8A29E] flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#03D26F]" />
                  <span>Daily Action: 3/5 Done</span>
                </span>
                <span className="font-black text-[#161514] dark:text-[#FAF8F5]">60% Conquered</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Habits & Gym Anatomy */}
          <div className="bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#2A2724] rounded-2xl p-3.5 shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#2A2724] text-left transition-all hover:-translate-y-0.5 space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-[#03D26F] text-white flex items-center justify-center border border-[#161514] shadow-[1px_1px_0px_0px_#161514] shrink-0">
                  <Flame className="size-4 stroke-[2.5]" />
                </div>
                <div>
                  <span className="font-heading font-black text-xs uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
                    Habits & Gym
                  </span>
                  <span className="font-mono text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">
                    Anatomy Telemetry
                  </span>
                </div>
              </div>
            </div>

            {/* Micro-Telemetry Preview */}
            <div className="bg-white dark:bg-[#1C1A18] rounded-xl p-2.5 border border-[#161514]/15 dark:border-[#2A2724] space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center gap-1 text-[#F59E0B] font-bold">
                  <Flame className="size-3.5 fill-[#F59E0B]" />
                  <span>6d Streak</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 font-bold">
                  Push Day
                </span>
              </div>
              <div className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] flex items-center gap-1">
                <Dumbbell className="size-3 text-[#161514] dark:text-[#FAF8F5]" />
                <span>Chest & Delts • 92% Ready</span>
              </div>
            </div>
          </div>

          {/* Bento Card 3: Tasks & Execution Engine */}
          <div className="bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#2A2724] rounded-2xl p-3.5 shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#2A2724] text-left transition-all hover:-translate-y-0.5 space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-[#F59E0B] text-[#161514] flex items-center justify-center border border-[#161514] shadow-[1px_1px_0px_0px_#161514] shrink-0">
                  <Zap className="size-4 stroke-[2.5]" />
                </div>
                <div>
                  <span className="font-heading font-black text-xs uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
                    Tasks Engine
                  </span>
                  <span className="font-mono text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">
                    Kanban & Priorities
                  </span>
                </div>
              </div>
            </div>

            {/* Micro-Telemetry Preview */}
            <div className="bg-white dark:bg-[#1C1A18] rounded-xl p-2.5 border border-[#161514]/15 dark:border-[#2A2724] space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center gap-1 text-[#161514] dark:text-[#FAF8F5] font-bold">
                  <CheckCircle2 className="size-3 text-[#F59E0B]" />
                  <span>3 High Priority</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 font-bold">
                  Active
                </span>
              </div>
              <div className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] truncate">
                Queue: Ship production release
              </div>
            </div>
          </div>

          {/* Bento Card 4: Cashflow Ledger (Full Width on 2-col) */}
          <div className="sm:col-span-2 bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#2A2724] rounded-2xl p-3.5 shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#2A2724] text-left transition-all hover:-translate-y-0.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-[#F59E0B] text-white flex items-center justify-center border border-[#161514] shadow-[1px_1px_0px_0px_#161514] shrink-0">
                  <Wallet className="size-4 stroke-[2.5]" />
                </div>
                <div>
                  <span className="font-heading font-black text-xs uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
                    Cashflow Ledger
                  </span>
                  <span className="font-mono text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">
                    Safe Spend & Envelopes
                  </span>
                </div>
              </div>
              <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <TrendingUp className="size-3" />
                <span>On Track</span>
              </span>
            </div>

            {/* Micro-Telemetry: Thermal Receipt Preview */}
            <div className="bg-white dark:bg-[#1C1A18] rounded-xl p-2.5 border border-[#161514]/15 dark:border-[#2A2724] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <Receipt className="size-3.5 text-[#F59E0B]" />
                <span className="font-semibold text-[#161514] dark:text-[#FAF8F5]">
                  Safe Daily Spend: <span className="font-black text-[#03D26F]">₹450/day</span>
                </span>
              </div>
              <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] bg-[#FAF8F5] dark:bg-[#22201D] px-2 py-0.5 rounded border border-[#161514]/10 dark:border-[#2A2724]">
                UPI Instant Sync
              </span>
            </div>
          </div>
        </div>

        {/* Air-gap Privacy Assurance Box */}
        <div className="max-w-lg w-full p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#2A2724] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#2A2724] flex items-start gap-2.5 text-left">
          <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 stroke-[2] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] block uppercase tracking-wider">
              100% Private & Air-Gapped
            </span>
            <p className="text-[11px] font-medium text-[#6B6B6B] dark:text-[#A8A29E] leading-relaxed">
              Your daily logs, syllabus progress, and financial transactions remain encrypted on this device. Zero ads, zero trackers, and zero cloud surveillance.
            </p>
          </div>
        </div>
      </div>

      {/* ─── RIGHT COLUMN: UNIFIED FRICTIONLESS AUTH COCKPIT (ORDER-1 ON MOBILE FOR 0-SCROLL LOGIN) ─── */}
      <div className="w-full md:col-span-6 lg:col-span-5 max-w-md mx-auto z-10 relative order-1 md:order-2">
        <div className="bg-white dark:bg-[#161514] rounded-2xl p-4 sm:p-6 border-2 border-[#161514] dark:border-[#2A2724] shadow-[4px_4px_0px_0px_#161514] dark:shadow-[4px_4px_0px_0px_#2A2724] space-y-4 transition-colors">
          {/* ONBOARDING BRIDGE BANNER */}
          {isFromOnboarding && (
            <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] flex items-center gap-3 animate-in fade-in zoom-in-95">
              <div className="size-11 shrink-0 flex items-center justify-center">
                <StrobiCompanion size={44} gear="none" showGear={false} />
              </div>
              <div className="text-left space-y-0.5">
                <div className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
                  <span>Companion Calibrated!</span>
                  <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-[#03D26F] text-[#161514]">
                    READY
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Your habits and daily pace are staged. Lock them in with an account, or test offline below.
                </p>
              </div>
            </div>
          )}

          {/* ZERO-CONFUSION 1-TAP GUEST ON-RAMP (PRIORITY #1 ON MOBILE) */}
          <div className="relative">
            <div className="hidden sm:flex justify-end mb-1 pr-2">
              <DoodleArrow
                direction="curved-down-right"
                label="1-tap offline evaluation"
                className="rotate-[-4deg]"
                color="#03D26F"
              />
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#2A2724] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#2A2724] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5 uppercase tracking-wider">
                  <Compass className="size-3.5 stroke-[2.5] text-emerald-600 dark:text-emerald-400" />
                  <span>Instant Evaluation Mode</span>
                </span>
                <span className="bg-[#CEF431] text-[#161514] text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded border border-[#161514]">
                  1-Tap Ready
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#6B6B6B] dark:text-[#A8A29E] leading-relaxed">
                Test all workspaces, gym routines, and ledger envelopes immediately without creating an account.
              </p>
              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#CEF431] hover:bg-[#bfe628] text-[#161514] text-xs font-heading font-black uppercase tracking-wider border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
              >
                <Compass className="size-3.5 stroke-[2.5]" />
                <span>Explore as Offline Guest (No Account)</span>
                <ArrowRight className="size-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Calm Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-2 border-[#161514]/15 dark:border-[#2A2724]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono font-bold">
              <span className="bg-white dark:bg-[#161514] px-2.5 text-[#6B6B6B] dark:text-[#A8A29E]">
                or sign in to synced vault
              </span>
            </div>
          </div>

          {/* Segmented Dual Tabs Switcher */}
          <div className="grid grid-cols-2 p-1 bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#2A2724] rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={cn(
                "py-2 text-xs font-heading font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
                activeTab === "login"
                  ? "bg-[#161514] text-white dark:bg-[#FAF8F5] dark:text-[#161514] shadow-xs"
                  : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5]"
              )}
            >
              <LogIn className="size-3.5 stroke-[2]" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("signup")}
              className={cn(
                "py-2 text-xs font-heading font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
                activeTab === "signup"
                  ? "bg-[#161514] text-white dark:bg-[#FAF8F5] dark:text-[#161514] shadow-xs"
                  : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5]"
              )}
            >
              <UserPlus className="size-3.5 stroke-[2]" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Form Controls */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {activeTab === "signup" && (
              <div className="space-y-1">
                <label className="text-[11px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
                  <User className="size-3.5 stroke-[2] text-[#6B6B6B] dark:text-[#A8A29E]" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required
                  className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border-2 border-[#161514] dark:border-[#2A2724] px-3.5 py-2 text-xs font-mono font-medium text-[#161514] dark:text-[#FAF8F5] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#CEF431] dark:focus:border-[#CEF431] transition-all"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
                <Mail className="size-3.5 stroke-[2] text-[#6B6B6B] dark:text-[#A8A29E]" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border-2 border-[#161514] dark:border-[#2A2724] px-3.5 py-2 text-xs font-mono font-medium text-[#161514] dark:text-[#FAF8F5] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#CEF431] dark:focus:border-[#CEF431] transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
                <Lock className="size-3.5 stroke-[2] text-[#6B6B6B] dark:text-[#A8A29E]" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={activeTab === "signup" ? "At least 4 characters" : "Your password"}
                  required
                  className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border-2 border-[#161514] dark:border-[#2A2724] px-3.5 py-2 text-xs font-mono font-medium text-[#161514] dark:text-[#FAF8F5] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#CEF431] dark:focus:border-[#CEF431] transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5] cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-3.5 stroke-[2]" /> : <Eye className="size-3.5 stroke-[2]" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#161514] hover:bg-[#2A2826] text-white dark:bg-[#FAF8F5] dark:text-[#161514] dark:hover:bg-[#E8E5DF] font-heading font-black text-xs uppercase tracking-wider border-2 border-[#161514] dark:border-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#FAF8F5] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-3.5 rounded-full border-2 border-white dark:border-[#161514] border-t-transparent animate-spin" />
                  <span>Authenticating...</span>
                </span>
              ) : activeTab === "login" ? (
                <span className="flex items-center gap-2">
                  <LogIn className="size-3.5 stroke-[2.5]" />
                  <span>Enter Vault</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="size-3.5 stroke-[2.5]" />
                  <span>Create My Vault</span>
                </span>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Helper */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-[#6B6B6B] dark:text-[#A8A29E] border-t border-[#161514]/10 dark:border-[#2A2724]">
            <span className="font-medium">Testing locally?</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-mono font-bold text-[#161514] dark:text-[#FAF8F5] hover:underline cursor-pointer flex items-center gap-1"
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
