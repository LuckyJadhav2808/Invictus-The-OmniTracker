"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/shared/AuthProvider";
import { LogOut, Settings, User, Sparkles, RefreshCw } from "lucide-react";
import Link from "next/link";
import { UpdateCheckModal } from "@/components/shared/UpdateCheckModal";
import { YearlyActivityMatrix } from "@/components/profile/YearlyActivityMatrix";
import { APP_VERSION_CONFIG } from "@/config/version";
import { MobileAppBar } from "@/components/mobile/MobileAppBar";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { soundFX } from "@/components/shared/SoundFX";

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const handleBack = () => {
    soundFX.playPop();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/today");
    }
  };

  return (
    <div className="w-full max-w-xl lg:max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-6 space-y-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] bg-[#FAF8F5] dark:bg-[#161514] select-none text-[#161514] dark:text-[#FAF8F5] min-h-screen transition-colors overflow-x-hidden">
      {/* ================= SLOT 1: MOBILE APP BAR (Mobile Only) ================= */}
      <div className="-mx-2 -mt-2 sm:-mx-4 sm:-mt-4 lg:hidden">
        <MobileAppBar
          title="Profile"
          onBack={handleBack}
          dateShortLabel={`v${APP_VERSION_CONFIG.version}`}
          showDynamicIsland={false}
          customMenuItems={
            <>
              <DropdownMenuItem
                onClick={() => {
                  soundFX.playPop();
                  router.push("/settings");
                }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-heading font-black cursor-pointer hover:bg-secondary focus:bg-secondary"
              >
                <Settings className="size-3.5" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  soundFX.playPop();
                  setIsUpdateModalOpen(true);
                }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-heading font-black cursor-pointer hover:bg-secondary focus:bg-secondary"
              >
                <RefreshCw className="size-3.5" />
                <span>Check Updates</span>
              </DropdownMenuItem>
            </>
          }
        />
      </div>

      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Desktop Profile Header (Desktop Only) */}
        <div className="hidden lg:flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight uppercase font-heading">
              User Profile & Engine
            </h1>
            <p className="text-xs text-[#8C8882] dark:text-[#A8A29E] font-medium mt-0.5">
              Account telemetry, lifetime activity matrix, and session controls
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setIsUpdateModalOpen(true);
            }}
            className="bg-[#CEF431] hover:bg-[#bce022] text-[#161514] text-xs font-black uppercase px-3.5 py-1.5 rounded-xl border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] flex items-center gap-1.5 cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>v{APP_VERSION_CONFIG.version}</span>
          </button>
        </div>

        {/* User Info Card - Harmonized Neobrutalist Responsive Layout */}
        <div id="user-profile-card" className="bg-white dark:bg-[#1C1A18] rounded-3xl p-4 sm:p-6 border-2 border-[#161514] dark:border-[#383531] shadow-[4px_4px_0px_0px_#161514] dark:shadow-[4px_4px_0px_0px_#000000] space-y-4 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="size-13 sm:size-16 rounded-2xl bg-amber-400 border-2 border-[#161514] dark:border-[#383531] flex items-center justify-center shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] shrink-0">
                <User className="size-6 sm:size-8 text-[#161514] stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-base sm:text-lg text-[#161514] dark:text-[#FAF8F5] tracking-tight font-heading leading-tight break-words">
                  {user?.displayName || "Invictus Explorer"}
                </p>
                <p className="text-[#161514]/70 dark:text-[#FAF8F5]/70 text-xs font-bold break-all">{user?.email}</p>
                <span className="inline-block mt-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-[#161514] dark:border-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-lg shadow-[1px_1px_0px_0px_#161514]">
                  Active Session
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#161514]/10 dark:border-white/10">
              <Link
                href="/settings"
                onClick={() => soundFX.playPop()}
                className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#FFF9EA] dark:hover:bg-[#2A2724] border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] text-[#161514] dark:text-[#FAF8F5] text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                title="Settings"
              >
                <Settings className="size-3.5 stroke-[2.5]" />
                <span>Settings</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setIsUpdateModalOpen(true);
                }}
                className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#FFF9EA] dark:hover:bg-[#2A2724] border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] text-[#161514] dark:text-[#FAF8F5] text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                title="Check for updates"
              >
                <RefreshCw className="size-3.5 stroke-[2.5]" />
                <span>Updates</span>
              </button>
            </div>
          </div>
        </div>

        {/* 365-DAY GITHUB-STYLE LIFE MOMENTUM MATRIX */}
        <div id="activity-matrix-section" className="scroll-mt-24 w-full max-w-full overflow-hidden">
          <YearlyActivityMatrix />
        </div>

        {/* Sign Out Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              signOut();
            }}
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
