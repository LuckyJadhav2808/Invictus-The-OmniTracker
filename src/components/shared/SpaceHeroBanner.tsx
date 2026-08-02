"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { PlayfulMascot, type MascotType } from "@/components/shared/PlayfulMascot";

interface SpaceHeroBannerProps {
  space: "today" | "life" | "study" | "money" | "analytics";
  badgeText: string;
  title: string;
  subtitle: string;
  accentColor?: string;
  stats?: { label: string; value: string | number; icon?: string }[];
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  children?: ReactNode;
}

export function SpaceHeroBanner({
  space,
  badgeText,
  title,
  subtitle,
  stats,
  actionButton,
  activeFilter,
  onFilterChange,
  children,
}: SpaceHeroBannerProps) {
  // Master Palette + Retro Space Tints Matching Reference Design
  const themeStyles = {
    today: {
      cardBg: "bg-gradient-to-br from-[#CEF431] via-[#03D26F] to-[#EAF4F4] text-[#161514] border-[#161514]",
      badgeBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
      statBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] sm:shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
      btnBg: "bg-[#161514] text-[#CEF431] hover:bg-[#014651] border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
    },
    life: {
      cardBg: "bg-gradient-to-br from-[#FDE68A] via-[#FEF08A] to-[#03D26F] text-[#161514] border-[#161514]",
      badgeBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
      statBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] sm:shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
      btnBg: "bg-[#161514] text-[#CEF431] hover:bg-[#014651] border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
    },
    study: {
      cardBg: "bg-gradient-to-br from-[#C084FC] via-[#DDD6FE] to-[#014651] text-[#161514] border-[#161514]",
      badgeBg: "bg-[#CEF431] text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
      statBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] sm:shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
      btnBg: "bg-[#161514] text-[#CEF431] hover:bg-[#014651] border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
    },
    money: {
      cardBg: "bg-gradient-to-br from-[#FBCFE8] via-[#F472B6] to-[#CEF431] text-[#161514] border-[#161514]",
      badgeBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
      statBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] sm:shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
      btnBg: "bg-[#161514] text-[#CEF431] hover:bg-[#014651] border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
    },
    analytics: {
      cardBg: "bg-gradient-to-br from-[#FDE68A] via-[#03D26F] to-[#014651] text-[#161514] border-[#161514]",
      badgeBg: "bg-[#CEF431] text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
      statBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] sm:shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
      btnBg: "bg-[#161514] text-[#CEF431] hover:bg-[#014651] border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
    },
  }[space];

  const mascotMap: Record<string, MascotType> = {
    today: "star-avatar",
    life: "sushi-stack",
    study: "book-wizard",
    money: "burger-boss",
    analytics: "cake-skates",
  };

  return (
    <div
      className={cn(
        "relative w-full rounded-3xl p-4 sm:p-6 md:p-8 border-2.5 border-[#161514] shadow-[4px_4px_0px_0px_rgba(22,21,20,1)] sm:shadow-[5px_5px_0px_0px_rgba(22,21,20,1)] overflow-hidden transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 my-2.5 sm:my-4",
        themeStyles.cardBg
      )}
    >
      {/* Background Decorative Pattern Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#161514_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-6">
        
        {/* Left Main Content with Playful Mascot Avatar */}
        <div className="flex items-center sm:items-start gap-3 sm:gap-6 max-w-xl">
          {/* Desktop & Mobile Mascot */}
          <PlayfulMascot type={mascotMap[space] || "star-avatar"} size="sm" className="sm:hidden block shrink-0" />
          <PlayfulMascot type={mascotMap[space] || "star-avatar"} size="lg" className="hidden sm:block shrink-0" />

          <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-black border-2 w-fit uppercase tracking-wider",
                  themeStyles.badgeBg
                )}
              >
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[2.5]" />
                <span>{badgeText}</span>
              </div>

              {/* Capsule Pill Filters: All, Year, Month, Week */}
              <div className="flex items-center gap-1 bg-white/80 p-0.5 sm:p-1 rounded-full border-1.5 sm:border-2 border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]">
                {["All", "Year", "Month", "Week"].map((flt) => {
                  const isAct = (activeFilter || "All").toLowerCase() === flt.toLowerCase();
                  return (
                    <button
                      key={flt}
                      type="button"
                      onClick={() => onFilterChange?.(flt)}
                      className={cn(
                        "px-2 sm:px-3 py-0.5 text-[9px] sm:text-[10px] font-black rounded-full transition-all cursor-pointer uppercase tracking-wider",
                        isAct
                          ? "bg-[#CEF431] text-[#161514] border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]"
                          : "bg-transparent text-[#161514]/70 border-transparent hover:bg-[#EAF4F4]"
                      )}
                    >
                      {flt}
                    </button>
                  );
                })}
              </div>
            </div>

            <h1
              className="text-lg sm:text-3xl md:text-4xl font-black tracking-tight leading-tight text-[#161514] truncate sm:whitespace-normal"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {title}
            </h1>

            <p className="text-[11px] sm:text-sm font-bold text-[#161514]/80 leading-snug sm:leading-relaxed max-w-lg hidden sm:block">
              {subtitle}
            </p>

            {/* Action Button */}
            {actionButton && (
              <div className="pt-0.5 sm:pt-1.5">
                <button
                  type="button"
                  onClick={actionButton.onClick}
                  className={cn(
                    "text-[10px] sm:text-xs font-black px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl border-2 transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5",
                    themeStyles.btnBg
                  )}
                >
                  <span>{actionButton.label}</span>
                  {actionButton.icon || <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Production Stat Cards (Responsive Grid Row on Mobile, Vertical Stack on Desktop) */}
        <div className="grid grid-cols-3 md:flex md:flex-col gap-1.5 sm:gap-2.5 min-w-0 md:min-w-[210px] shrink-0">
          {stats?.map((st, idx) => (
            <div
              key={idx}
              className={cn(
                "px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl border-2 flex flex-col sm:flex-row items-center sm:justify-between gap-1 sm:gap-3 transition-all text-center sm:text-left",
                themeStyles.statBg
              )}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                {st.icon && <span className="text-xs sm:text-base">{st.icon}</span>}
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider truncate max-w-[55px] sm:max-w-none">
                  {st.label}
                </span>
              </div>
              <span className="text-[10px] sm:text-sm font-black tracking-tight px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 rounded-lg sm:rounded-xl bg-[#161514] text-white border border-[#161514]">
                {st.value}
              </span>
            </div>
          ))}
          {children}
        </div>

      </div>
    </div>
  );
}
