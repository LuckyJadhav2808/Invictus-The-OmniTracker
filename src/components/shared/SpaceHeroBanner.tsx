"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowUpRight, CheckCircle, Clock, Wallet, Flame } from "lucide-react";

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
  // Production-level rich Neobrutalist color themes matching each space
  const themeStyles = {
    today: {
      cardBg: "bg-gradient-to-br from-amber-300 via-amber-200 to-amber-100 text-navy-950 border-navy-950",
      badgeBg: "bg-white text-navy-950 border-navy-950 font-black shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]",
      statBg: "bg-white text-navy-950 border-navy-950 font-black shadow-[2.5px_2.5px_0px_0px_rgba(31,36,48,1)]",
      btnBg: "bg-navy-950 text-amber-300 hover:bg-navy-900 border-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)]",
    },
    life: {
      cardBg: "bg-gradient-to-br from-emerald-300 via-teal-200 to-emerald-100 text-navy-950 border-navy-950",
      badgeBg: "bg-white text-navy-950 border-navy-950 font-black shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]",
      statBg: "bg-white text-navy-950 border-navy-950 font-black shadow-[2.5px_2.5px_0px_0px_rgba(31,36,48,1)]",
      btnBg: "bg-navy-950 text-emerald-300 hover:bg-navy-900 border-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)]",
    },
    study: {
      cardBg: "bg-gradient-to-br from-indigo-500 via-indigo-600 to-navy-950 text-white border-navy-950",
      badgeBg: "bg-amber-300 text-navy-950 border-navy-950 font-black shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]",
      statBg: "bg-navy-900/90 text-white border-navy-950 font-black shadow-[2.5px_2.5px_0px_0px_rgba(31,36,48,1)]",
      btnBg: "bg-amber-300 text-navy-950 hover:bg-amber-400 border-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)]",
    },
    money: {
      cardBg: "bg-gradient-to-br from-amber-400 via-amber-300 to-emerald-300 text-navy-950 border-navy-950",
      badgeBg: "bg-white text-navy-950 border-navy-950 font-black shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]",
      statBg: "bg-white text-navy-950 border-navy-950 font-black shadow-[2.5px_2.5px_0px_0px_rgba(31,36,48,1)]",
      btnBg: "bg-navy-950 text-amber-300 hover:bg-navy-900 border-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)]",
    },
    analytics: {
      cardBg: "bg-gradient-to-br from-rose-400 via-rose-300 to-amber-200 text-navy-950 border-navy-950",
      badgeBg: "bg-white text-navy-950 border-navy-950 font-black shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]",
      statBg: "bg-white text-navy-950 border-navy-950 font-black shadow-[2.5px_2.5px_0px_0px_rgba(31,36,48,1)]",
      btnBg: "bg-navy-950 text-rose-300 hover:bg-navy-900 border-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)]",
    },
  }[space];

  return (
    <div
      className={cn(
        "relative w-full rounded-3xl p-6 sm:p-7 md:p-8 border-2.5 border-navy-950 shadow-[5px_5px_0px_0px_rgba(31,36,48,1)] overflow-hidden transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_rgba(31,36,48,1)] my-4",
        themeStyles.cardBg
      )}
    >
      {/* Background Decorative Grid Pattern Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e232a_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

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
                  "text-xs font-black px-5 py-2.5 rounded-2xl border-2 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]",
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
              <span className="text-sm font-black tracking-tight px-2.5 py-0.5 rounded-xl bg-navy-950 text-white border border-navy-950">
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
