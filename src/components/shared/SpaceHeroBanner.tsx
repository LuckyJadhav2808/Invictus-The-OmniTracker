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
  // Master 5-Color Palette Spectrum Styles
  const themeStyles = {
    today: {
      cardBg: "bg-gradient-to-br from-[#CEF431] via-[#03D26F] to-[#014651] text-[#161514] border-[#161514]",
      badgeBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
      statBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
      btnBg: "bg-[#161514] text-[#CEF431] hover:bg-[#014651] border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)]",
    },
    life: {
      cardBg: "bg-gradient-to-br from-[#03D26F] via-[#CEF431] to-[#014651] text-[#161514] border-[#161514]",
      badgeBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
      statBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
      btnBg: "bg-[#161514] text-[#CEF431] hover:bg-[#014651] border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)]",
    },
    study: {
      cardBg: "bg-gradient-to-br from-[#014651] via-[#161514] to-[#014651] text-white border-[#161514]",
      badgeBg: "bg-[#CEF431] text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
      statBg: "bg-[#014651] text-white border-[#161514] font-black shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
      btnBg: "bg-[#CEF431] text-[#161514] hover:bg-[#03D26F] border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)]",
    },
    money: {
      cardBg: "bg-gradient-to-br from-[#CEF431] via-[#03D26F] to-[#014651] text-[#161514] border-[#161514]",
      badgeBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
      statBg: "bg-white text-[#161514] border-[#161514] font-black shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
      btnBg: "bg-[#161514] text-[#CEF431] hover:bg-[#014651] border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)]",
    },
    analytics: {
      cardBg: "bg-gradient-to-br from-[#03D26F] via-[#014651] to-[#161514] text-white border-[#161514]",
      badgeBg: "bg-[#CEF431] text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
      statBg: "bg-[#014651] text-white border-[#161514] font-black shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]",
      btnBg: "bg-[#CEF431] text-[#161514] hover:bg-[#03D26F] border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)]",
    },
  }[space];

  return (
    <div
      className={cn(
        "relative w-full rounded-3xl p-6 sm:p-7 md:p-8 border-2.5 border-[#161514] shadow-[5px_5px_0px_0px_rgba(22,21,20,1)] overflow-hidden transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_rgba(22,21,20,1)] my-4",
        themeStyles.cardBg
      )}
    >
      {/* Background Decorative Pattern Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#161514_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Left Main Content */}
        <div className="space-y-3.5 max-w-xl">
          <div
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black border-2 w-fit uppercase tracking-wider",
              themeStyles.badgeBg
            )}
          >
            <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>{badgeText}</span>
          </div>

          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {title}
          </h1>

          <p className="text-xs sm:text-sm font-bold opacity-90 leading-relaxed max-w-lg">
            {subtitle}
          </p>

          {/* Action Button */}
          {actionButton && (
            <div className="pt-1.5">
              <button
                type="button"
                onClick={actionButton.onClick}
                className={cn(
                  "text-xs font-black px-5 py-2.5 rounded-2xl border-2 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]",
                  themeStyles.btnBg
                )}
              >
                <span>{actionButton.label}</span>
                {actionButton.icon || <ArrowUpRight className="h-4 w-4 stroke-[3]" />}
              </button>
            </div>
          )}
        </div>

        {/* Right Production Stat Cards */}
        <div className="flex flex-col gap-2.5 min-w-[220px] shrink-0">
          {stats?.map((st, idx) => (
            <div
              key={idx}
              className={cn(
                "px-4 py-3 rounded-2xl border-2 flex items-center justify-between gap-4 transition-all hover:scale-[1.02]",
                themeStyles.statBg
              )}
            >
              <div className="flex items-center gap-2.5">
                {st.icon && <span className="text-base">{st.icon}</span>}
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {st.label}
                </span>
              </div>
              <span className="text-sm font-black tracking-tight px-2.5 py-0.5 rounded-xl bg-[#161514] text-white border border-[#161514]">
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
