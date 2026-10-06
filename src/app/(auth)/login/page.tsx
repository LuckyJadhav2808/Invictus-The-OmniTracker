"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  Shield,
  Zap,
  Flame,
  Wallet,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/components/shared/AuthProvider";
import { InvictusLogo } from "@/components/shared/InvictusLogo";
import { DoodleInvictusTitle } from "@/components/auth/DoodleInvictusTitle";
import {
  DoodleArrow,
  DoodleStickyNote,
  DoodleStamp,
  AuthBackgroundDoodles,
} from "@/components/auth/AuthDoodles";

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
        if (!loggedUser.onboarded) {
          router.push("/onboarding");
        } else {
          router.push("/today");
        }
      } else {
        if (password.length < 4) {
          toast.error("Password must be at least 4 characters long.");
          setLoading(false);
          return;
        }
        const newUser = await signup(email.trim(), password, name.trim());
        toast.success(`Account created successfully! Welcome, ${newUser.displayName}!`);
        router.push("/onboarding");
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
    toast.success("Entered offline sandbox mode.");
    const onboarded = localStorage.getItem("invictus_onboarded") === "true";
    if (onboarded) {
      router.push("/today");
    } else {
      router.push("/onboarding");
    }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto py-4 sm:py-8 md:py-10 px-4 flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 items-center justify-center">
      {/* Background Hand-Drawn Sketch Annotations */}
      <AuthBackgroundDoodles />

      {/* Brand Header & Value Proposition (Desktop: Left Column, Mobile: Top + Bottom) */}
      <div className="lg:col-span-6 space-y-5 text-center lg:text-left z-10 w-full flex flex-col items-center lg:items-start">
        {/* Brand Mascot + Letter-by-Letter Handwritten Doodle Title */}
        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-4">
          <div className="relative flex items-center gap-2">
            <InvictusLogo size="lg" variant="icon-only" href="/" className="shrink-0" />
            <div className="inline-flex sm:hidden font-doodle text-[11px] font-bold text-[#161514] bg-[#CEF431] border-1.5 border-[#161514] rounded-md px-2 py-0.5 shadow-[1px_1px_0px_0px_#161514] -rotate-2">
              <span>Ready to crush it? ⚡</span>
            </div>
          </div>
          <div className="flex flex-col items-center lg:items-start">
            <DoodleInvictusTitle size="lg" showReplay={true} showSubtitle={true} />
          </div>
        </div>

        {/* Catchy Editorial Heading & Subtext */}
        <div className="space-y-1.5 max-w-md mx-auto lg:mx-0">
          <h1 className="font-heading font-black text-xl sm:text-2xl md:text-3xl text-[#161514] tracking-tight leading-snug">
            Personal life, study & money.
          </h1>
          <div className="inline-block px-2.5 py-0.5 bg-[#FEF08A] border-1.5 border-[#161514] rounded shadow-[1.5px_1.5px_0px_0px_#161514] -rotate-1">
            <span className="font-doodle text-xs sm:text-sm font-bold text-[#161514]">
              ~ All together in one focused cockpit 🎯
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-[#161514]/75 leading-relaxed pt-1 hidden sm:block">
            A tactile Neobrutalist OmniTracker designed for relentless daily execution,
            zero cognitive clutter, and complete local privacy.
          </p>
        </div>

        {/* Feature Highlights Grid with Doodle Accents (Shown on desktop, or below on mobile) */}
        <div className="hidden lg:grid grid-cols-2 gap-2.5 max-w-md w-full pt-1">
          <div className="p-2.5 bg-white border-2 border-[#161514] rounded-xl shadow-[2px_2px_0px_0px_#161514] flex items-center gap-2.5 transition-transform hover:-translate-y-0.5">
            <div className="size-7 rounded-lg bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-4 text-[#161514] stroke-[2.5]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-heading font-extrabold text-xs text-[#161514]">Habits & Streaks</span>
              <span className="font-doodle text-[10px] text-[#161514]/65">chain unbreakable ⚡</span>
            </div>
          </div>

          <div className="p-2.5 bg-white border-2 border-[#161514] rounded-xl shadow-[2px_2px_0px_0px_#161514] flex items-center gap-2.5 transition-transform hover:-translate-y-0.5">
            <div className="size-7 rounded-lg bg-[#C084FC] border-2 border-[#161514] flex items-center justify-center shrink-0">
              <Zap className="size-4 text-[#161514] stroke-[2.5]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-heading font-extrabold text-xs text-[#161514]">Exams & Syllabus</span>
              <span className="font-doodle text-[10px] text-[#161514]/65">100% syllabus prep 📚</span>
            </div>
          </div>

          <div className="p-2.5 bg-white border-2 border-[#161514] rounded-xl shadow-[2px_2px_0px_0px_#161514] flex items-center gap-2.5 transition-transform hover:-translate-y-0.5">
            <div className="size-7 rounded-lg bg-[#F59E0B] border-2 border-[#161514] flex items-center justify-center shrink-0">
              <Flame className="size-4 text-[#161514] stroke-[2.5]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-heading font-extrabold text-xs text-[#161514]">Daily Priority</span>
              <span className="font-doodle text-[10px] text-[#161514]/65">crush daily targets 🔥</span>
            </div>
          </div>

          <div className="p-2.5 bg-white border-2 border-[#161514] rounded-xl shadow-[2px_2px_0px_0px_#161514] flex items-center gap-2.5 transition-transform hover:-translate-y-0.5">
            <div className="size-7 rounded-lg bg-[#03D26F] border-2 border-[#161514] flex items-center justify-center shrink-0">
              <Wallet className="size-4 text-[#161514] stroke-[2.5]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-heading font-extrabold text-xs text-[#161514]">Cash & Budgets</span>
              <span className="font-doodle text-[10px] text-[#161514]/65">zero financial leaks 💰</span>
            </div>
          </div>
        </div>

        {/* Real Tactile Sticky Note with Hand-Drawn Washi Tape (Desktop) */}
        <div className="hidden lg:block max-w-md w-full pt-1">
          <DoodleStickyNote
            title="AGENT INTEL NOTE"
            content="Invictus is built offline-first. Your private journal, syllabus tracking, and expense logs stay encrypted on this device."
            footer="— Zero ads • Zero spyware • Pure flow state 🚀"
            color="yellow"
            rot="-1deg"
          />
        </div>

        {/* Directional Doodle Arrow pointing towards login form on desktop */}
        <div className="hidden lg:flex items-center justify-end max-w-md w-full pt-1 pr-4">
          <DoodleArrow
            direction="curved-up-right"
            label="Claim your cockpit ➔"
            color="#FF4F17"
          />
        </div>
      </div>

      {/* Right Column: Unified Neobrutalist Auth Card with Doodle Accents */}
      <div className="lg:col-span-6 w-full max-w-md mx-auto z-10 relative">
        {/* Playful Floating Stamp Badge */}
        <div className="absolute -top-3.5 right-4 sm:right-6 z-20 pointer-events-none">
          <DoodleStamp
            text="AGENT ENTRY"
            subtext="VAULT ACCESS"
            variant="lime"
            rot="2.5deg"
          />
        </div>

        <div className="neo-card p-5 sm:p-8 bg-white border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-5 sm:space-y-6 relative overflow-visible">
          {/* Dual Tabs Switcher */}
          <div className="grid grid-cols-2 p-1 bg-[#F1EFEA] border-2 border-[#161514] rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={`py-2 text-xs font-heading font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "login"
                  ? "bg-[#CEF431] text-[#161514] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]"
                  : "text-[#161514]/70 hover:text-[#161514]"
              }`}
            >
              <LogIn className="size-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("signup")}
              className={`py-2 text-xs font-heading font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "signup"
                  ? "bg-[#03D26F] text-[#161514] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]"
                  : "text-[#161514]/70 hover:text-[#161514]"
              }`}
            >
              <UserPlus className="size-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {activeTab === "signup" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-heading font-extrabold text-[#161514] flex items-center gap-1.5">
                    <User className="size-3.5" />
                    <span>Full Name</span>
                  </label>
                  <span className="font-doodle text-[11px] text-[#161514]/60 font-semibold">
                    codename or name 🏷️
                  </span>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required
                  className="w-full neo-input"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-heading font-extrabold text-[#161514] flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  <span>Email Address</span>
                </label>
                <span className="font-doodle text-[11px] text-[#FF4F17] font-bold">
                  write here ✍️
                </span>
              </div>
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full neo-input"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-heading font-extrabold text-[#161514] flex items-center gap-1.5">
                  <Lock className="size-3.5" />
                  <span>Password</span>
                </label>
                <span className="font-doodle text-[11px] text-[#03D26F] font-bold">
                  secret key 🔑
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={activeTab === "signup" ? "At least 4 characters" : "Your password"}
                  required
                  className="w-full neo-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#161514]/60 hover:text-[#161514] cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 font-black text-sm uppercase tracking-wider ${
                activeTab === "signup" ? "bg-[#03D26F] hover:bg-[#10E57E]" : "bg-[#CEF431] hover:bg-[#D8F74E]"
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 rounded-full border-2 border-[#161514] border-t-transparent animate-spin" />
                  <span>Processing...</span>
                </span>
              ) : activeTab === "login" ? (
                <span className="flex items-center gap-2">
                  <LogIn className="size-4" />
                  <span>Enter Vault</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="size-4" />
                  <span>Create My Vault</span>
                </span>
              )}
            </Button>
          </form>

          {/* Divider with Doodle Label */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-2 border-dashed border-[#161514]/20" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono font-bold">
              <span className="bg-white px-2.5 text-[#161514]/60">or instant guest access</span>
            </div>
          </div>

          {/* Sandbox & Guest Access with Sketched Doodle Pointer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-center -mb-0.5">
              <DoodleArrow
                direction="curved-down-right"
                label="Just testing? Jump right in! ↷"
                color="#161514"
              />
            </div>
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-[#161514] bg-[#F1EFEA] hover:bg-[#E5E2D8] text-xs font-heading font-black text-[#161514] transition-all cursor-pointer shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-h-[44px]"
            >
              <Compass className="size-4 stroke-[2.2] text-[#FF4F17]" />
              <span>Explore as Offline Guest (No Account)</span>
            </button>
          </div>

          {/* Reassurance Badge */}
          <div className="pt-1 flex items-center justify-center gap-2 text-[11px] font-doodle font-bold text-[#161514]/70">
            <Shield className="size-3.5 text-emerald-600 stroke-[2.5]" />
            <span>100% offline-first • zero telemetry lock-in</span>
          </div>
        </div>
      </div>

      {/* Mobile-Only Feature Highlights and Sticky Note below Auth Card */}
      <div className="lg:hidden w-full max-w-md mx-auto space-y-4 pt-2 z-10">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-white border-2 border-[#161514] rounded-xl shadow-[2px_2px_0px_0px_#161514] flex items-center gap-2">
            <div className="size-6 rounded-lg bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-3.5 text-[#161514] stroke-[2.5]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-heading font-extrabold text-[11px] text-[#161514]">Habits & Streaks</span>
              <span className="font-doodle text-[9px] text-[#161514]/65">unbreakable ⚡</span>
            </div>
          </div>

          <div className="p-2.5 bg-white border-2 border-[#161514] rounded-xl shadow-[2px_2px_0px_0px_#161514] flex items-center gap-2">
            <div className="size-6 rounded-lg bg-[#C084FC] border-2 border-[#161514] flex items-center justify-center shrink-0">
              <Zap className="size-3.5 text-[#161514] stroke-[2.5]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-heading font-extrabold text-[11px] text-[#161514]">Exams & Syllabus</span>
              <span className="font-doodle text-[9px] text-[#161514]/65">100% prep 📚</span>
            </div>
          </div>
        </div>

        <DoodleStickyNote
          title="AGENT INTEL NOTE"
          content="Invictus runs offline-first. Your private habits, syllabus & money logs stay on this phone."
          footer="— Pure flow state 🚀"
          color="yellow"
          rot="-1deg"
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center p-4">
          <div className="h-8 w-8 rounded-full border-2 border-[#161514] border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
