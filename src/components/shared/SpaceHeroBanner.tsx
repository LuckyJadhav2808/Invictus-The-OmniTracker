"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { PlayfulMascot, type MascotType } from "@/components/shared/PlayfulMascot";

interface SpaceHeroBannerProps {
  space: "today" | "life" | "study" | "money" | "tasks" | "analytics";
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
  // Master Studio Duotone Palette (Aesthetic, Warm, Harmonious Neobrutalism)
  const themeStyles = {
    today: {
      cardBg: "bg-[#FFF9EA] text-[#161514] border-[#161514]",
      badgeBg: "bg-[#CEF431] text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
      statBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] sm:shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
      btnBg: "bg-[#161514] text-[#CEF431] hover:bg-[#252321] border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
    },
    life: {
      cardBg: "bg-[#ECFDF5] text-[#161514] border-[#161514]",
      badgeBg: "bg-[#03D26F] text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
      statBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] sm:shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
      btnBg: "bg-[#161514] text-[#03D26F] hover:bg-[#252321] border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
    },
    study: {
      cardBg: "bg-[#F5F3FF] text-[#161514] border-[#161514]",
      badgeBg: "bg-[#C084FC] text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
      statBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] sm:shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
      btnBg: "bg-[#161514] text-[#C084FC] hover:bg-[#252321] border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
    },
    tasks: {
      cardBg: "bg-[#FFFBEB] text-[#161514] border-[#161514]",
      badgeBg: "bg-[#F59E0B] text-white border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
      statBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] sm:shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
      btnBg: "bg-[#161514] text-[#F59E0B] hover:bg-[#252321] border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
    },
    money: {
      cardBg: "bg-[#FFF1F2] text-[#161514] border-[#161514]",
      badgeBg: "bg-[#FBCFE8] text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
      statBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] sm:shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
      btnBg: "bg-[#161514] text-[#FBCFE8] hover:bg-[#252321] border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
    },
    analytics: {
      cardBg: "bg-[#F0F9FF] text-[#161514] border-[#161514]",
      badgeBg: "bg-[#7DD3FC] text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
      statBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] sm:shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
      btnBg: "bg-[#161514] text-[#7DD3FC] hover:bg-[#252321] border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
    },
  }[space];

  const mascotMap: Record<string, MascotType> = {
    today: "star-avatar",
    life: "sushi-stack",
    study: "book-wizard",
    tasks: "robot-taskmaster",
    money: "burger-boss",
    analytics: "cake-skates",
  };

  return (
    <div
      className={cn(
        "relative w-full rounded-3xl p-3.5 sm:p-6 md:p-8 border-2.5 border-[#161514] shadow-[4px_4px_0px_0px_rgba(22,21,20,1)] sm:shadow-[5px_5px_0px_0px_rgba(22,21,20,1)] overflow-hidden transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 my-2.5 sm:my-4",
        themeStyles.cardBg
      )}
    >
      {/* Background Decorative Pattern Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#161514_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-6">
        
        {/* Left Main Content with Playful Mascot Avatar */}
        <div className="flex items-center sm:items-start gap-3 sm:gap-6 max-w-xl min-w-0">
          {/* Desktop & Mobile Mascot */}
          <PlayfulMascot type={mascotMap[space] || "star-avatar"} size="sm" className="sm:hidden block shrink-0" />
          <PlayfulMascot type={mascotMap[space] || "star-avatar"} size="lg" className="hidden sm:block shrink-0" />

          <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 max-w-full">
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-3.5 sm:py-1.5 rounded-xl text-[9px] sm:text-xs font-black border-2 w-fit uppercase tracking-wider shrink-0",
                  themeStyles.badgeBg
                )}
              >
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[2.5]" />
                <span>{badgeText}</span>
              </div>

              {/* Capsule Pill Filters: All, Year, Month, Week (Overflow Resilient) */}
              {onFilterChange && (
                <div className="flex items-center gap-0.5 sm:gap-1 bg-white/90 p-0.5 sm:p-1 rounded-full border-1.5 sm:border-2 border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] max-w-full overflow-x-auto no-scrollbar">
                  {["All", "Year", "Month", "Week"].map((flt) => {
                    const isAct = (activeFilter || "All").toLowerCase() === flt.toLowerCase();
                    return (
                      <button
                        key={flt}
                        type="button"
                        onClick={() => onFilterChange?.(flt)}
                        className={cn(
                          "px-1.5 sm:px-3 py-0.5 text-[8px] sm:text-[10px] font-black rounded-full transition-all cursor-pointer uppercase tracking-wider shrink-0",
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
              )}
            </div>

            <h1
              className="text-base sm:text-3xl md:text-4xl font-black tracking-tight leading-tight text-[#161514] truncate sm:whitespace-normal"
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
                    "text-[10px] sm:text-xs font-black px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl border-2 transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 max-w-full truncate",
                    themeStyles.btnBg
                  )}
                >
                  <span className="truncate">{actionButton.label}</span>
                  {actionButton.icon || <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3] shrink-0" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Production Stat Cards (Responsive Grid Row on Mobile, Vertical Stack on Desktop) */}
        <div className="grid grid-cols-3 md:flex md:flex-col gap-1 sm:gap-2.5 min-w-0 md:min-w-[210px] shrink-0 max-w-full">
          {stats?.map((st, idx) => (
            <div
              key={idx}
              className={cn(
                "px-1.5 py-1 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl border-1.5 sm:border-2 flex flex-col sm:flex-row items-center sm:justify-between gap-0.5 sm:gap-3 transition-all text-center sm:text-left min-w-0 overflow-hidden",
                themeStyles.statBg
              )}
            >
              <div className="flex items-center gap-1 sm:gap-2 min-w-0 truncate">
                {st.icon && <span className="text-[10px] sm:text-base shrink-0">{st.icon}</span>}
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider truncate">
                  {st.label}
                </span>
              </div>
              <span className="text-[9px] sm:text-sm font-black tracking-tight px-1 py-0.5 sm:px-2.5 sm:py-0.5 rounded-md sm:rounded-xl bg-[#161514] text-white border border-[#161514] truncate">
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
