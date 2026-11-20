"use client";

import { type LucideIcon, Sparkles } from "lucide-react";
import { StrobiCompanion, type StrobiGear } from "@/components/mascot/StrobiCompanion";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  Icon?: LucideIcon;
  ctaText?: string;
  onCtaClick?: () => void;
  secondaryCtaText?: string;
  onSecondaryCtaClick?: () => void;
  iconBgClass?: string;
  iconColorClass?: string;
  showMascot?: boolean;
  mascotGear?: StrobiGear;
  mascotQuip?: string;
  className?: string;
}

export function EmptyState({
  title,
  description,
  Icon,
  ctaText,
  onCtaClick,
  secondaryCtaText,
  onSecondaryCtaClick,
  iconBgClass = "bg-[#CEF431]",
  iconColorClass = "text-[#161514]",
  showMascot = false,
  mascotGear = "gladiator",
  mascotQuip,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-white dark:bg-[#1C1A18] rounded-3xl border-2 border-[#161514] dark:border-[#383531] shadow-[4px_4px_0px_0px_#161514] dark:shadow-[4px_4px_0px_0px_#000000] space-y-4 my-4 transition-colors select-none",
        className
      )}
    >
      {showMascot ? (
        <div className="flex flex-col items-center space-y-2">
          {/* Strobi Companion as Interactive Guide */}
          <div className="size-20 flex items-center justify-center">
            <StrobiCompanion
              size={76}
              gear={mascotGear}
              showGear={mascotGear !== "none"}
            />
          </div>

          {/* Strobi Speech Bubble */}
          {mascotQuip && (
            <div className="relative max-w-xs px-3.5 py-2 rounded-2xl bg-[#FAF8F5] dark:bg-[#252321] border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] leading-snug">
              <span>{mascotQuip}</span>
              {/* Pointer triangle */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#FAF8F5] dark:bg-[#252321] border-t-2 border-l-2 border-[#161514] dark:border-[#383531] rotate-45" />
            </div>
          )}
        </div>
      ) : Icon ? (
        <div
          className={cn(
            "size-14 rounded-2xl border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] flex items-center justify-center transition-transform hover:scale-105",
            iconBgClass
          )}
        >
          <Icon className={cn("size-7 stroke-[2.5]", iconColorClass)} />
        </div>
      ) : null}

      <div className="space-y-1.5 max-w-sm">
        <h4 className="font-heading font-black text-base text-[#161514] dark:text-[#FAF8F5] tracking-tight">
          {title}
        </h4>
        <p className="text-xs font-medium text-[#6B6B6B] dark:text-[#A8A29E] leading-relaxed">
          {description}
        </p>
      </div>

      {(ctaText || secondaryCtaText) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          {secondaryCtaText && onSecondaryCtaClick && (
            <button
              type="button"
              onClick={onSecondaryCtaClick}
              className="rounded-2xl bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] font-heading font-black text-xs px-4 py-2.5 border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            >
              {secondaryCtaText}
            </button>
          )}

          {ctaText && onCtaClick && (
            <button
              type="button"
              onClick={onCtaClick}
              className="rounded-2xl bg-[#CEF431] text-[#161514] font-heading font-black text-xs px-5 py-2.5 border-2 border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="size-3.5 stroke-[2.5]" />
              <span>{ctaText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
