"use client";

import { useState } from "react";
import { useAuth } from "@/components/shared/AuthProvider";
import { LogOut, Settings, User, Sparkles, RefreshCw } from "lucide-react";
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
            className="text-2xl md:text-3xl font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight uppercase font-heading"
          >
            USER PROFILE & ENGINE
          </h1>
          <button
            type="button"
            onClick={() => setIsUpdateModalOpen(true)}
            className="bg-[#CEF431] hover:bg-[#bce022] text-[#161514] text-xs font-black uppercase px-3.5 py-1.5 rounded-xl border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] flex items-center gap-1.5 cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>v{APP_VERSION_CONFIG.version}</span>
          </button>
        </div>

        {/* User Info Card */}
        <div id="user-profile-card" className="bg-white dark:bg-[#1C1A18] rounded-3xl p-5 sm:p-6 border-[2.5px] border-[#161514] dark:border-[#383531] shadow-[5px_5px_0px_0px_#161514] dark:shadow-[5px_5px_0px_0px_#000000] space-y-5 scroll-mt-24">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-amber-400 border-2 border-[#161514] dark:border-[#383531] flex items-center justify-center shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] shrink-0">
                <User className="h-8 w-8 text-[#161514] stroke-[2.5]" />
              </div>
              <div>
                <p className="font-black text-lg text-[#161514] dark:text-[#FAF8F5] tracking-tight font-heading">
                  {user?.displayName || "Invictus Explorer"}
                </p>
                <p className="text-[#161514]/70 dark:text-[#FAF8F5]/70 text-xs font-bold">{user?.email}</p>
                <span className="inline-block mt-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-2 border-[#161514] dark:border-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-lg shadow-[1px_1px_0px_0px_#161514]">
                  Active Session
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/settings"
                className="p-2.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#FFF9EA] dark:hover:bg-[#2A2724] border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] text-[#161514] dark:text-[#FAF8F5] text-xs font-black flex items-center gap-1.5 cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(true)}
                className="p-2.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#FFF9EA] dark:hover:bg-[#2A2724] border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] text-[#161514] dark:text-[#FAF8F5] text-xs font-black flex items-center gap-1.5 cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                title="Check for updates"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Updates</span>
              </button>
            </div>
          </div>
        </div>

        {/* 365-DAY GITHUB-STYLE LIFE MOMENTUM MATRIX */}
        <div id="activity-matrix-section" className="scroll-mt-24">
          <YearlyActivityMatrix />
        </div>

        {/* Sign Out Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={signOut}
            className="w-full bg-white dark:bg-[#1C1A18] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-black text-xs uppercase tracking-wider py-3.5 px-5 rounded-2xl border-2 border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center gap-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
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
