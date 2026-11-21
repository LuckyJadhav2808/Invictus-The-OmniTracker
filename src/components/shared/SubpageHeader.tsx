"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    soundFX.playPop();
    soundFX.vibrate(15);
  };

  return (
    <header
      className={cn(
        "bg-white dark:bg-[#161514] border-2 border-[#161514] dark:border-white/20 rounded-2xl p-3 sm:p-4 shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          onClick={handleBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#161514] dark:border-white/20 bg-[#FAF8F5] dark:bg-[#1F1D1B] hover:bg-[#CEF431] hover:text-[#161514] dark:hover:bg-[#CEF431] dark:hover:text-[#161514] text-[#161514] dark:text-stone-100 font-heading font-black text-xs shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer shrink-0"
          aria-label={`Back to ${backLabel}`}
        >
          <ArrowLeft className="size-4 stroke-[2.5]" />
          <span>{backLabel}</span>
        </Link>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {badge && (
              <span
                className={cn(
                  "text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border",
                  badgeColorClass
                )}
              >
                {badge}
              </span>
            )}
          </div>
          <h1 className="text-base sm:text-lg font-heading font-black text-[#161514] dark:text-stone-100 tracking-tight flex items-center gap-2 truncate mt-0.5">
            {Icon && <Icon className="size-4 sm:size-5 stroke-[2.5] shrink-0" />}
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
    </header>
  );
}
