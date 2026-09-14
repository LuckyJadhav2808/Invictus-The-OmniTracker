"use client";

import { useState } from "react";
import { useAuth } from "@/components/shared/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User, Sparkles, ShieldCheck, Database, Bell, Sliders, ArrowRight, Trophy, RefreshCw } from "lucide-react";
import Link from "next/link";
import { UpdateCheckModal } from "@/components/shared/UpdateCheckModal";
import { YearlyActivityMatrix } from "@/components/profile/YearlyActivityMatrix";
import { APP_VERSION_CONFIG } from "@/config/version";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 p-3 sm:p-6 md:p-8 space-y-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Profile Header */}
        <div className="flex items-center justify-between">
          <h1
            className="text-2xl md:text-3xl font-black text-[#161514] tracking-tight uppercase font-heading"
          >
            USER PROFILE & ENGINE
          </h1>
          <button
            type="button"
            onClick={() => setIsUpdateModalOpen(true)}
            className="bg-[#CEF431] hover:bg-[#bce022] text-[#161514] text-xs font-black uppercase px-3.5 py-1.5 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center gap-1.5 cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <span>⚡ v{APP_VERSION_CONFIG.version}</span>
          </button>
        </div>

        {/* User Info Card */}
        <div id="user-profile-card" className="bg-white rounded-3xl p-5 sm:p-6 border-[2.5px] border-[#161514] shadow-[5px_5px_0px_0px_#161514] space-y-5 scroll-mt-24">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-amber-400 border-2 border-[#161514] flex items-center justify-center shadow-[2px_2px_0px_0px_#161514] shrink-0">
                <User className="h-8 w-8 text-[#161514] stroke-[2.5]" />
              </div>
              <div>
                <p className="font-black text-lg text-[#161514] tracking-tight font-heading">
                  {user?.displayName || "Invictus Explorer"}
                </p>
                <p className="text-[#161514]/70 text-xs font-bold">{user?.email}</p>
                <span className="inline-block mt-1.5 bg-emerald-100 text-emerald-900 border-2 border-[#161514] text-[9px] font-black px-2 py-0.5 rounded-lg shadow-[1px_1px_0px_0px_#161514]">
                  Active Session
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(true)}
              className="p-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#FFF9EA] border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] text-[#161514] text-xs font-black flex items-center gap-1.5 cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all shrink-0"
              title="Check for updates"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Updates</span>
            </button>
          </div>
        </div>

        {/* 🌟 365-DAY GITHUB-STYLE LIFE MOMENTUM MATRIX */}
        <div id="activity-matrix-section" className="scroll-mt-24">
          <YearlyActivityMatrix />
        </div>

        {/* Prominent Settings Discovery Hero Card */}
        <div id="settings-discovery-card" className="bg-gradient-to-br from-[#CEF431] via-[#03D26F] to-[#EAF4F4] rounded-3xl p-6 border-[2.5px] border-[#161514] shadow-[5px_5px_0px_0px_#161514] space-y-4 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="bg-white text-[#161514] px-3 py-1 rounded-xl text-xs font-black border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-auto">
              <Sparkles className="h-4 w-4" /> 11 Settings Categories Available
            </span>
            <span className="text-xs font-black text-[#161514] bg-white/90 px-2.5 py-1 rounded-lg border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514] whitespace-nowrap shrink-0 self-start sm:self-auto">
              FULL CONTROL
            </span>
          </div>

          <div>
            <h2 className="text-xl font-black text-[#161514] tracking-tight uppercase font-heading">
              LIFE ENGINE SETTINGS CONTROL CENTER
            </h2>
            <p className="text-xs font-bold text-[#161514] mt-1 leading-relaxed">
              Customize your entire workspace with global wake-up timers, space modules, currency, security, data backups, and OS status bar alerts.
            </p>
          </div>

          {/* Quick Features Badges */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { label: `⚡ v${APP_VERSION_CONFIG.version} Updates`, icon: "⚡" },
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
                className="bg-white text-[#161514] text-[10px] font-black px-2.5 py-1 rounded-xl border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514] flex items-center gap-1"
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
              className="w-full bg-[#161514] hover:bg-[#2a2725] text-white font-black text-xs uppercase tracking-widest py-3.5 px-5 rounded-2xl border-2 border-[#161514] shadow-[3.5px_3.5px_0px_0px_#161514] flex items-center justify-center gap-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
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
            className="w-full bg-white hover:bg-rose-50 text-rose-700 font-black text-xs uppercase tracking-wider py-3.5 px-5 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex items-center justify-center gap-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <LogOut className="h-4 w-4 stroke-[2.5]" />
            <span>Sign Out of Account</span>
          </button>
        </div>

      </div>

      {/* In-App Update Modal */}
      <UpdateCheckModal
        open={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
      />
    </div>
  );
}
