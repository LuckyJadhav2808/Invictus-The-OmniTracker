"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  Icon: LucideIcon;
  ctaText?: string;
  onCtaClick?: () => void;
  iconBgClass?: string;
  iconColorClass?: string;
  className?: string;
}

export function EmptyState({
  title,
  description,
  Icon,
  ctaText,
  onCtaClick,
  iconBgClass = "bg-[#CEF431]",
  iconColorClass = "text-[#161514]",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-[#1C1A18] rounded-3xl border-2 border-[#161514] dark:border-[#383531] shadow-[4px_4px_0px_0px_#161514] dark:shadow-[4px_4px_0px_0px_#000000] space-y-4 my-4 transition-colors select-none",
        className
      )}
    >
      <div
        className={cn(
          "size-14 rounded-2xl border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] flex items-center justify-center transition-transform hover:scale-105",
          iconBgClass
        )}
      >
        <Icon className={cn("size-7 stroke-[2.5]", iconColorClass)} />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h4 className="font-heading font-black text-base text-[#161514] dark:text-[#FAF8F5] tracking-tight">
          {title}
        </h4>
        <p className="text-xs font-medium text-[#6B6B6B] dark:text-[#A8A29E] leading-relaxed">
          {description}
        </p>
      </div>
      {ctaText && onCtaClick && (
        <button
          type="button"
          onClick={onCtaClick}
          className="rounded-2xl bg-[#CEF431] text-[#161514] font-heading font-black text-xs px-5 py-2.5 border-2 border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
        >
          {ctaText}
        </button>
      )}
    </div>
  );
}
