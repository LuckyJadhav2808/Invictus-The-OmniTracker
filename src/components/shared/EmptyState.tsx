"use client";

import { Button } from "@/components/ui/button";
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  Icon: LucideIcon;
  ctaText?: string;
  onCtaClick?: () => void;
  iconBgClass?: string;
  iconColorClass?: string;
}

export function EmptyState({
  title,
  description,
  Icon,
  ctaText,
  onCtaClick,
  iconBgClass = "bg-amber-300",
  iconColorClass = "text-navy-950",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-4 my-4">
      <div className={`h-14 w-14 rounded-2xl border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] ${iconBgClass} flex items-center justify-center`}>
        <Icon className={`h-7 w-7 ${iconColorClass} stroke-[2.5]`} />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h4 className="font-black text-base text-navy-950 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>{title}</h4>
        <p className="text-xs font-bold text-navy-700 leading-relaxed">{description}</p>
      </div>
      {ctaText && onCtaClick && (
        <button
          type="button"
          onClick={onCtaClick}
          className="rounded-2xl bg-amber-400 text-navy-950 font-black hover:bg-amber-500 text-xs px-5 py-2.5 border-2 border-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] transition-all cursor-pointer"
        >
          {ctaText}
        </button>
      )}
    </div>
  );
}
