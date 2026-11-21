"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

export interface SubpageHeaderProps {
  backHref: string;
  backLabel: string;
  title: string;
  badge?: string;
  badgeColorClass?: string;
  subtitle?: string;
  icon?: React.ElementType;
  rightAction?: React.ReactNode;
  className?: string;
}

export function SubpageHeader({
  backHref,
  backLabel,
  title,
  badge,
  badgeColorClass = "bg-[#CEF431] text-[#161514] border-[#161514]",
  subtitle,
  icon: Icon,
  rightAction,
  className,
}: SubpageHeaderProps) {
  const handleBack = () => {
    soundFX.playPop();
    soundFX.vibrate(15);
  };

  return (
    <div className={cn("flex items-center justify-between gap-3 pt-1 pb-1 select-none", className)}>
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <Link
          href={backHref}
          onClick={handleBack}
          className="size-9 sm:size-10 rounded-xl border-2 border-[#161514] dark:border-white/20 bg-[#FAF8F5] dark:bg-[#1F1D1B] hover:bg-[#CEF431] hover:text-[#161514] text-[#161514] dark:text-stone-100 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          aria-label={`Back to ${backLabel}`}
          title={`Back to ${backLabel}`}
        >
          <ArrowLeft className="size-4 sm:size-5 stroke-[2.5]" />
        </Link>

        <div className="min-w-0">
          {badge && (
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={cn(
                  "text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border",
                  badgeColorClass
                )}
              >
                {badge}
              </span>
            </div>
          )}
          <h1 className="text-lg sm:text-2xl font-heading font-black text-[#161514] dark:text-stone-100 tracking-tight flex items-center gap-2 truncate">
            {Icon && <Icon className="size-4 sm:size-5 stroke-[2.5] text-muted-foreground shrink-0" />}
            <span className="truncate">{title}</span>
          </h1>
          {subtitle && (
            <p className="text-[11px] font-sans text-muted-foreground truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {rightAction && <div className="shrink-0 flex items-center gap-2">{rightAction}</div>}
    </div>
  );
}
