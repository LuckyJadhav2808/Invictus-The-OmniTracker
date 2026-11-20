"use client";

import { User, ShieldCheck, HardDrive, Globe, Sparkles } from "lucide-react";
import { StrobiCompanion } from "@/components/mascot/StrobiCompanion";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

export interface SettingsHeroSummaryProps {
  displayName: string;
  isGuest: boolean;
  userEmail?: string | null;
  storageKb: number;
  currency: string;
  timezone: string;
  version: string;
  onSelectTab?: (tab: "preferences" | "modules" | "reminders" | "security" | "datavault") => void;
  className?: string;
}

export function SettingsHeroSummary({
  displayName,
  isGuest,
  userEmail,
  storageKb,
  currency,
  timezone,
  version,
  onSelectTab,
  className,
}: SettingsHeroSummaryProps) {
  const shortTz = timezone.includes("/") ? timezone.split("/")[1].replace(/_/g, " ") : timezone;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#FAF8F5] to-amber-50/30 dark:from-[#1C1A18] dark:via-[#161514] dark:to-neutral-900/40 p-4 sm:p-5 border border-[#E8E5DF]/70 dark:border-[#2A2724]/70 shadow-xs select-none transition-all",
        className
      )}
    >
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-[#CEF431]/10 dark:bg-[#CEF431]/5 blur-2xl" />

      {/* Main Top Row: Profile & Strobi Companion */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        {/* Left: Avatar + Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative size-11 sm:size-12 rounded-2xl bg-[#161514] text-[#FAF8F5] dark:bg-white dark:text-[#161514] flex items-center justify-center font-heading font-black text-base shadow-xs shrink-0">
            {displayName ? displayName.charAt(0).toUpperCase() : <User className="size-5 stroke-[2.2]" />}
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white dark:border-[#161514]",
                isGuest ? "bg-[#CEF431]" : "bg-[#03D26F]"
              )}
              title={isGuest ? "Air-Gapped Guest" : "Cloud Synchronized"}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-heading font-black text-base sm:text-lg tracking-tight text-[#161514] dark:text-[#FAF8F5] truncate max-w-[190px] sm:max-w-[260px]">
                {displayName || (isGuest ? "Guest Explorer" : "Invictus User")}
              </h2>
              <span
                className={cn(
                  "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0",
                  isGuest
                    ? "bg-[#CEF431]/20 text-[#161514] dark:text-[#CEF431] border border-[#CEF431]/40"
                    : "bg-[#03D26F]/20 text-[#03D26F] border border-[#03D26F]/40"
                )}
              >
                {isGuest ? "Air-Gapped" : "Pro Synced"}
              </span>
            </div>
            <p className="text-xs font-mono text-[#8C8882] dark:text-[#A8A29E] truncate">
              {userEmail || (isGuest ? "Offline Local Storage" : "Cloud Vault Active")}
            </p>
          </div>
        </div>

        {/* Right: Tactile Strobi Companion Miniature */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C8882] dark:text-[#A8A29E]">
              Life Engine
            </span>
            <span className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
              100% Calibrated
            </span>
          </div>
          <div
            className="cursor-pointer active:scale-95 transition-transform"
            onClick={() => {
              soundFX.playPop();
              soundFX.vibrate(15);
            }}
            title="Strobi Engine Companion"
          >
            <StrobiCompanion gear="gladiator" state="idle" size={42} showAura={false} />
          </div>
        </div>
      </div>

      {/* Hairline Divider */}
      <div className="my-3 sm:my-3.5 h-px w-full bg-[#E8E5DF]/70 dark:bg-[#2A2724]/70" />

      {/* Bottom Telemetry Strip: 4 Hairline Stats */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
        {/* Metric 1: Vault Storage */}
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            onSelectTab?.("datavault");
          }}
          className="p-1 sm:p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left flex flex-col items-center justify-center cursor-pointer"
        >
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C8882] dark:text-[#A8A29E] flex items-center gap-1">
            <HardDrive className="size-3 stroke-[2]" />
            <span className="hidden xs:inline">Vault</span>
          </span>
          <span className="text-xs sm:text-sm font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
            {storageKb} <span className="text-[10px] font-mono font-normal text-muted-foreground">KB</span>
          </span>
        </button>

        {/* Metric 2: Currency */}
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            onSelectTab?.("preferences");
          }}
          className="p-1 sm:p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left flex flex-col items-center justify-center cursor-pointer border-l border-[#E8E5DF]/60 dark:border-[#2A2724]/60"
        >
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C8882] dark:text-[#A8A29E] flex items-center gap-1">
            <Sparkles className="size-3 stroke-[2]" />
            <span className="hidden xs:inline">Currency</span>
          </span>
          <span className="text-xs sm:text-sm font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
            {currency}
          </span>
        </button>

        {/* Metric 3: Timezone */}
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            onSelectTab?.("preferences");
          }}
          className="p-1 sm:p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left flex flex-col items-center justify-center cursor-pointer border-l border-[#E8E5DF]/60 dark:border-[#2A2724]/60"
        >
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C8882] dark:text-[#A8A29E] flex items-center gap-1">
            <Globe className="size-3 stroke-[2]" />
            <span className="hidden xs:inline">Region</span>
          </span>
          <span className="text-xs sm:text-sm font-heading font-black text-[#161514] dark:text-[#FAF8F5] truncate max-w-[70px] sm:max-w-[90px]">
            {shortTz}
          </span>
        </button>

        {/* Metric 4: Version */}
        <div className="p-1 sm:p-1.5 rounded-xl flex flex-col items-center justify-center border-l border-[#E8E5DF]/60 dark:border-[#2A2724]/60">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C8882] dark:text-[#A8A29E] flex items-center gap-1">
            <ShieldCheck className="size-3 stroke-[2]" />
            <span className="hidden xs:inline">Engine</span>
          </span>
          <span className="text-xs sm:text-sm font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
            v{version}
          </span>
        </div>
      </div>
    </div>
  );
}
