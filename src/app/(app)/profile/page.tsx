"use client";

import { useAuth } from "@/components/shared/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User, Sparkles, ShieldCheck, Database, Bell, Sliders, ArrowRight, Trophy } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-cream-bg p-4 md:p-8 space-y-6">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Profile Header */}
        <div className="flex items-center justify-between">
          <h1
            className="text-2xl md:text-3xl font-black text-navy-950 tracking-tight uppercase"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            USER PROFILE & ENGINE
          </h1>
          <span className="bg-amber-400 text-navy-950 text-[10px] font-black uppercase px-3 py-1 rounded-xl border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]">
            INVICTUS PRO
          </span>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-3xl p-6 border-2.5 border-navy-950 shadow-[6px_6px_0px_0px_rgba(31,36,48,1)] space-y-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-amber-400 border-2 border-navy-950 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] shrink-0">
              <User className="h-8 w-8 text-navy-950 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-black text-lg text-navy-950 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                {user?.displayName || "Invictus Explorer"}
              </p>
              <p className="text-navy-700 text-xs font-bold">{user?.email}</p>
              <span className="inline-block mt-1 bg-emerald-100 text-emerald-900 border border-emerald-950 text-[9px] font-black px-2 py-0.5 rounded-md">
                Active Session
              </span>
            </div>
          </div>
        </div>

        {/* Issue 3 Fix: Prominent Settings Discovery Hero Card */}
        <div className="bg-gradient-to-br from-[#CEF431] via-[#03D26F] to-[#EAF4F4] rounded-3xl p-6 border-2.5 border-navy-950 shadow-[6px_6px_0px_0px_rgba(31,36,48,1)] space-y-4">
          <div className="flex items-center justify-between">
            <span className="bg-white text-navy-950 px-3 py-1 rounded-xl text-xs font-black border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> 11 Settings Categories Available
            </span>
            <span className="text-xs font-black text-navy-950 bg-white/80 px-2.5 py-1 rounded-lg border border-navy-950">
              FULL CONTROL
            </span>
          </div>

          <div>
            <h2 className="text-xl font-black text-navy-950 tracking-tight uppercase" style={{ fontFamily: "var(--font-heading)" }}>
              LIFE ENGINE SETTINGS CONTROL CENTER
            </h2>
            <p className="text-xs font-bold text-navy-900 mt-1 leading-relaxed">
              Customize your entire workspace with global wake-up timers, space modules, currency, security, data backups, and OS status bar alerts.
            </p>
          </div>

          {/* Quick Features Badges */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { label: "⏰ Global Wake-Up", icon: "⏰" },
              { label: "🏆 Badges & XP", icon: "🏆" },
              { label: "📂 Habit Groups", icon: "📂" },
              { label: "📊 CSV Exporter", icon: "📊" },
              { label: "🔒 Security & Auth", icon: "🔒" },
              { label: "🔔 OS Status Alerts", icon: "🔔" },
              { label: "📦 Data Backup", icon: "📦" },
            ].map((badge, idx) => (
              <span
                key={idx}
                className="bg-white text-navy-950 text-[10px] font-black px-2.5 py-1 rounded-xl border border-navy-950 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] flex items-center gap-1"
              >
                <span>{badge.icon}</span>
                <span>{badge.label}</span>
              </span>
            ))}
          </div>

          {/* Primary CTA Button to Settings */}
          <div className="pt-2">
            <Link
              href="/settings"
              className="w-full bg-navy-950 hover:bg-navy-900 text-white font-black text-xs uppercase tracking-widest py-3.5 px-5 rounded-2xl border-2 border-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] flex items-center justify-center gap-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <Settings className="h-4 w-4 stroke-[2.5]" />
              <span>OPEN SETTINGS CONTROL CENTER</span>
              <ArrowRight className="h-4 w-4 stroke-[3]" />
            </Link>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={signOut}
            className="w-full bg-white hover:bg-rose-50 text-rose-700 font-black text-xs uppercase tracking-wider py-3.5 px-5 rounded-2xl border-2 border-rose-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4 stroke-[2.5]" />
            <span>Sign Out of Account</span>
          </button>
        </div>

      </div>
    </div>
  );
}
