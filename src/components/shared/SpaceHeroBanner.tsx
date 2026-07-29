"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowUpRight } from "lucide-react";

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
  children?: ReactNode;
}

export function SpaceHeroBanner({
  space,
  badgeText,
  title,
  subtitle,
  stats,
  actionButton,
  children,
}: SpaceHeroBannerProps) {
  const themeStyles = {
    today: {
      cardBg: "bg-gradient-to-br from-[#DBE64C] via-[#74C365] to-[#00804C] text-[#001F3F] border-[#001F3F]",
      badgeBg: "bg-[#001F3F]/15 text-[#001F3F] border-[#001F3F] font-black",
      statBg: "bg-white/80 backdrop-blur-md text-[#001F3F] border-[#001F3F] font-black",
      btnBg: "bg-[#001F3F] text-[#DBE64C] hover:bg-[#0A294A] border-[#001F3F]",
    },
    life: {
      cardBg: "bg-gradient-to-br from-[#DBE64C] via-[#74C365] to-[#00804C] text-[#001F3F] border-[#001F3F]",
      badgeBg: "bg-[#001F3F]/15 text-[#001F3F] border-[#001F3F] font-black",
      statBg: "bg-white/85 backdrop-blur-md text-[#001F3F] border-[#001F3F] font-black",
      btnBg: "bg-[#001F3F] text-[#DBE64C] hover:bg-[#0A294A] border-[#001F3F]",
    },
    study: {
      cardBg: "bg-gradient-to-br from-[#1E488F] via-[#0F356B] to-[#001F3F] text-white border-[#001F3F]",
      badgeBg: "bg-white/20 text-white border-white/40 font-black",
      statBg: "bg-white/15 backdrop-blur-md text-white border-white/30 font-black",
      btnBg: "bg-[#DBE64C] text-[#001F3F] hover:bg-[#74C365] border-[#001F3F]",
    },
    money: {
      cardBg: "bg-gradient-to-br from-[#74C365] via-[#00804C] to-[#001F3F] text-white border-[#001F3F]",
      badgeBg: "bg-white/20 text-white border-white/40 font-black",
      statBg: "bg-white/15 backdrop-blur-md text-white border-white/30 font-black",
      btnBg: "bg-[#DBE64C] text-[#001F3F] hover:bg-white border-[#001F3F]",
    },
    analytics: {
      cardBg: "bg-gradient-to-br from-[#1E488F] via-[#00804C] to-[#001F3F] text-white border-[#001F3F]",
      badgeBg: "bg-white/20 text-white border-white/40 font-black",
      statBg: "bg-white/15 backdrop-blur-md text-white border-white/30 font-black",
      btnBg: "bg-[#DBE64C] text-[#001F3F] hover:bg-white border-[#001F3F]",
    },
  }[space];

  return (
    <div
      className={cn(
        "relative w-full rounded-3xl p-6 sm:p-8 md:p-9 border-2 sm:border-[2.5px] shadow-[5px_5px_0px_0px_rgba(31,36,48,1)] overflow-hidden transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_rgba(31,36,48,1)] my-4",
        themeStyles.cardBg
      )}
    >
      {/* Background Floating Decorative Orbs */}
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15 blur-xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-black/10 blur-lg pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Left Info Column */}
        <div className="space-y-3 max-w-xl">
          <div
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black border-2 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] w-fit",
              themeStyles.badgeBg
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{badgeText}</span>
          </div>

          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {title}
          </h1>

          <p className="text-xs sm:text-sm font-bold opacity-90 leading-relaxed">
            {subtitle}
          </p>

          {/* Action Button if provided */}
          {actionButton && (
            <div className="pt-1">
              <button
                onClick={actionButton.onClick}
                className={cn(
                  "text-xs font-black px-5 py-2.5 rounded-2xl shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] border-2 transition-all flex items-center gap-2 cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]",
                  themeStyles.btnBg
                )}
              >
                <span>{actionButton.label}</span>
                {actionButton.icon || <ArrowUpRight className="h-4 w-4 stroke-[3]" />}
              </button>
            </div>
          )}
        </div>

        {/* Right Stats Pills / Custom Content */}
        <div className="flex flex-wrap md:flex-col gap-2.5 min-w-[200px]">
          {stats?.map((st, idx) => (
            <div
              key={idx}
              className={cn(
                "flex-1 md:flex-none px-4 py-2.5 rounded-2xl border-2 flex items-center justify-between gap-3 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]",
                themeStyles.statBg
              )}
            >
              <div className="flex items-center gap-2">
                {st.icon && <span className="text-base">{st.icon}</span>}
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {st.label}
                </span>
              </div>
              <span className="text-sm font-black tracking-tight">{st.value}</span>
            </div>
          ))}
          {children}
        </div>

      </div>
    </div>
  );
}
