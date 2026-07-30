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
      cardBg: "bg-white text-navy-950 border-navy-950",
      badgeBg: "bg-amber-300 text-navy-950 border-navy-950 font-black",
      statBg: "bg-cream-bg/60 text-navy-950 border-navy-950 font-black",
      btnBg: "bg-navy-950 text-white hover:bg-navy-900 border-navy-950",
    },
    life: {
      cardBg: "bg-white text-navy-950 border-navy-950",
      badgeBg: "bg-emerald-300 text-navy-950 border-navy-950 font-black",
      statBg: "bg-emerald-50 text-navy-950 border-navy-950 font-black",
      btnBg: "bg-navy-950 text-white hover:bg-navy-900 border-navy-950",
    },
    study: {
      cardBg: "bg-white text-navy-950 border-navy-950",
      badgeBg: "bg-indigo-300 text-navy-950 border-navy-950 font-black",
      statBg: "bg-indigo-50 text-navy-950 border-navy-950 font-black",
      btnBg: "bg-navy-950 text-white hover:bg-navy-900 border-navy-950",
    },
    money: {
      cardBg: "bg-white text-navy-950 border-navy-950",
      badgeBg: "bg-amber-300 text-navy-950 border-navy-950 font-black",
      statBg: "bg-amber-50 text-navy-950 border-navy-950 font-black",
      btnBg: "bg-navy-950 text-white hover:bg-navy-900 border-navy-950",
    },
    analytics: {
      cardBg: "bg-white text-navy-950 border-navy-950",
      badgeBg: "bg-rose-300 text-navy-950 border-navy-950 font-black",
      statBg: "bg-rose-50 text-navy-950 border-navy-950 font-black",
      btnBg: "bg-navy-950 text-white hover:bg-navy-900 border-navy-950",
    },
  }[space];

  return (
    <div
      className={cn(
        "relative w-full rounded-3xl p-6 sm:p-7 md:p-8 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] overflow-hidden transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(31,36,48,1)] my-4",
        themeStyles.cardBg
      )}
    >
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Left Info Column */}
        <div className="space-y-3 max-w-xl">
          <div
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black border-2 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] w-fit uppercase tracking-wider",
              themeStyles.badgeBg
            )}
          >
            <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>{badgeText}</span>
          </div>

          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight text-navy-950"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {title}
          </h1>

          <p className="text-xs sm:text-sm font-bold text-navy-700 leading-relaxed">
            {subtitle}
          </p>

          {/* Action Button if provided */}
          {actionButton && (
            <div className="pt-1">
              <button
                type="button"
                onClick={actionButton.onClick}
                className={cn(
                  "text-xs font-black px-5 py-2.5 rounded-2xl shadow-[2.5px_2.5px_0px_0px_rgba(31,36,48,1)] border-2 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]",
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
        <div className="flex flex-wrap md:flex-col gap-2.5 min-w-[210px]">
          {stats?.map((st, idx) => (
            <div
              key={idx}
              className={cn(
                "flex-1 md:flex-none px-4 py-2.5 rounded-2xl border-2 flex items-center justify-between gap-4 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]",
                themeStyles.statBg
              )}
            >
              <div className="flex items-center gap-2">
                {st.icon && <span className="text-base">{st.icon}</span>}
                <span className="text-[10px] font-black uppercase tracking-wider text-navy-800">
                  {st.label}
                </span>
              </div>
              <span className="text-sm font-black tracking-tight text-navy-950">{st.value}</span>
            </div>
          ))}
          {children}
        </div>

      </div>
    </div>
  );
}
