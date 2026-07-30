"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { LogIn, Mail, Eye, EyeOff, Sparkles, Target, BookOpen, Wallet, Flame, Smile, CheckCircle2, Heart, Award, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/shared/AuthProvider";
import { InvictusLogo } from "@/components/shared/InvictusLogo";

export default function LoginPage() {
  const router = useRouter();
  const { enterGuestMode, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      toast.success("Welcome back champion! 🥳");
      if (!loggedUser.onboarded) {
        router.push("/onboarding");
      } else {
        router.push("/today");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Login failed. Please check your credentials.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Custom Google auth demo login
      const loggedUser = await login("google.user@invictus.app", "google_demo_pass").catch(() => 
        useAuth().signup("google.user@invictus.app", "google_demo_pass", "Google User")
      );
      toast.success("Yay! Welcome back! 🎉");
      if (!loggedUser.onboarded) {
        router.push("/onboarding");
      } else {
        router.push("/today");
      }
    } catch {
      toast.success("Signed in with Google mode! 🎉");
      enterGuestMode("Google User");
      router.push("/today");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    enterGuestMode("Guest Explorer");
    toast.success("Welcome to Offline Guest Mode! 🎈");
    const onboarded = localStorage.getItem("invictus_onboarded") === "true";
    if (onboarded) {
      router.push("/today");
    } else {
      router.push("/onboarding");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 items-center relative py-2 md:py-4">
      
      {/* Top Mobile Floating Stickers */}
      <div className="flex items-center justify-center gap-2 z-20 w-full mb-1 lg:hidden">
        <div className="bg-amber-400 text-navy-900 text-[11px] font-black px-3 py-1 rounded-full shadow-md border-2 border-white flex items-center gap-1 rotate-[-2deg]">
          <Flame className="h-3.5 w-3.5 text-orange-600 fill-orange-500" />
          <span>7 Day Streak!</span>
        </div>
        <div className="bg-mint-400 text-navy-900 text-[11px] font-black px-3 py-1 rounded-full shadow-md border-2 border-white flex items-center gap-1 rotate-[2deg]">
          <Award className="h-3.5 w-3.5 text-emerald-700" />
          <span>Goals on track ✨</span>
        </div>
      </div>

      {/* Desktop Floating Sticker Badges */}
      <div className="hidden lg:block absolute -top-2 left-6 z-20 animate-bounce duration-1000">
        <div className="bg-amber-400 text-navy-900 text-xs font-black px-3 py-1.5 rounded-full shadow-md border-2 border-white flex items-center gap-1.5 rotate-[-4deg]">
          <Flame className="h-4 w-4 text-orange-600 fill-orange-500" />
          <span>7 Day Streak!</span>
        </div>
      </div>

      <div className="hidden lg:block absolute -bottom-2 right-12 z-20">
        <div className="bg-mint-400 text-navy-900 text-xs font-black px-3 py-1.5 rounded-full shadow-md border-2 border-white flex items-center gap-1.5 rotate-[5deg]">
          <Award className="h-4 w-4 text-emerald-700" />
          <span>Goals on track ✨</span>
        </div>
      </div>

      {/* Mobile Top Brand Showcase Header */}
      <div className="lg:hidden flex flex-col items-center text-center space-y-2.5 px-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-900 text-[11px] font-black">
          <Smile className="h-3.5 w-3.5 text-amber-600" />
          <span>Daily Life Companion</span>
        </div>
        <h1
          className="text-3xl font-black text-navy-900 tracking-tight leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Welcome to{" "}
          <span className="text-amber-600 underline decoration-amber-400 decoration-wavy decoration-2">
            Invictus 🌟
          </span>
        </h1>
        {/* Mobile Horizontal Space Badges */}
        <div className="flex items-center justify-center gap-2 pt-1 w-full max-w-sm">
          <div className="flex-1 bg-white/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-amber-200 shadow-sm flex items-center gap-1.5 justify-center">
            <span className="text-sm">🌱</span>
            <span className="text-[10px] font-black text-navy-900">Life</span>
          </div>
          <div className="flex-1 bg-white/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-orange-200 shadow-sm flex items-center gap-1.5 justify-center">
            <span className="text-sm">📚</span>
            <span className="text-[10px] font-black text-navy-900">Study</span>
          </div>
          <div className="flex-1 bg-white/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-mint-200 shadow-sm flex items-center gap-1.5 justify-center">
            <span className="text-sm">💰</span>
            <span className="text-[10px] font-black text-navy-900">Money</span>
          </div>
        </div>
      </div>

      {/* Desktop Column: Cozy Hero Banner & Playful Stickers */}
      <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6 pr-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-900 text-xs font-black w-fit">
          <Smile className="h-4 w-4 text-amber-600" />
          <span>Your Daily Life Companion</span>
        </div>

        <div className="space-y-3">
          <h1
            className="text-4xl xl:text-5xl font-black text-navy-900 tracking-tight leading-[1.15]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Welcome to <br />
            <span className="relative inline-block text-amber-600 underline decoration-amber-400 decoration-wavy decoration-2">
              Invictus 🌟
            </span>
          </h1>
          <p className="text-navy-600 text-sm font-semibold leading-relaxed max-w-sm">
            Track daily habits, crush exam syllabus, monitor macros & build savings — all with playful pet-app energy!
          </p>
        </div>

        {/* Playful Pill Tiles */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-amber-200/60 shadow-sm hover:scale-[1.02] transition-transform">
            <div className="h-9 w-9 rounded-xl bg-amber-400/30 flex items-center justify-center text-amber-700 font-extrabold text-lg">
              🌱
            </div>
            <div>
              <h3 className="text-xs font-black text-navy-900">Life & Habits Space</h3>
              <p className="text-[11px] text-navy-600 font-medium">Daily streaks, Macros & Weight tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-orange-200/60 shadow-sm hover:scale-[1.02] transition-transform">
            <div className="h-9 w-9 rounded-xl bg-orange-400/30 flex items-center justify-center text-orange-700 font-extrabold text-lg">
              📚
            </div>
            <div>
              <h3 className="text-xs font-black text-navy-900">Study & Exam Space</h3>
              <p className="text-[11px] text-navy-600 font-medium">Syllabus topics, countdowns & test scores</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-mint-200/60 shadow-sm hover:scale-[1.02] transition-transform">
            <div className="h-9 w-9 rounded-xl bg-mint-400/30 flex items-center justify-center text-mint-800 font-extrabold text-lg">
              💰
            </div>
            <div>
              <h3 className="text-xs font-black text-navy-900">Money & Budget Space</h3>
              <p className="text-[11px] text-navy-600 font-medium">Income/expense ledger & savings targets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Card (Mobile & Desktop) */}
      <div className="w-full col-span-1 lg:col-span-6 max-w-md mx-auto">
        <div className="bg-white/95 backdrop-blur-md border-3 border-amber-300/80 rounded-[28px] md:rounded-[32px] p-6 sm:p-7 md:p-8 shadow-[0_16px_40px_rgba(245,185,66,0.18)] space-y-4 md:space-y-5 relative overflow-hidden">
          
          <div className="flex items-center justify-between border-b-2 border-navy-950/10 pb-3 mb-2">
            <InvictusLogo size="md" variant="full" href="/login" />
            <div className="bg-amber-300 text-navy-950 text-[10px] font-black px-2.5 py-1 rounded-xl border border-navy-950 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] uppercase">
              Sign In
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-navy-700 ml-1"
              >
                Your Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-600" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-2xl border-2 border-amber-200 bg-cream-bg/40 py-2.5 pl-10 pr-4 text-sm font-bold outline-none focus:border-amber-500 focus:bg-white transition-all text-navy-900 placeholder:text-navy-600/50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-navy-700 ml-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-2xl border-2 border-amber-200 bg-cream-bg/40 py-2.5 pl-4 pr-10 text-sm font-bold outline-none focus:border-amber-500 focus:bg-white transition-all text-navy-900 placeholder:text-navy-600/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-600 hover:text-navy-900 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-navy-900 font-black rounded-2xl py-3 text-sm transition-all duration-200 cursor-pointer shadow-[0_6px_16px_rgba(245,185,66,0.4)] active:scale-[0.98] flex items-center justify-center gap-2 border-2 border-amber-600/30 mt-1"
            >
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-navy-900 border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>Sign In & Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Or Divider */}
          <div className="relative my-2.5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-amber-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
              <span className="bg-white px-3 text-navy-600 rounded-full">or</span>
            </div>
          </div>

          {/* Social / Guest Action */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full rounded-2xl py-2.5 font-bold border-2 border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center gap-2 text-navy-900 text-xs shadow-sm"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full rounded-2xl py-2.5 font-black border-2 border-dashed border-amber-400 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs"
            >
              <span>🎈 Play as Offline Guest</span>
            </Button>
          </div>

          {/* Footer prompt */}
          <div className="text-center text-xs font-bold text-navy-600 pt-0.5">
            New here?{" "}
            <Link
              href="/signup"
              className="text-amber-700 underline underline-offset-2 hover:text-amber-800 font-black"
            >
              Create a free account! ✨
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



