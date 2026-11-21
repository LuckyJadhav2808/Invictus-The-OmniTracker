"use client";

import React from "react";
import Link from "next/link";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

export interface NeobrutalistEmptyCardProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function NeobrutalistEmptyCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: NeobrutalistEmptyCardProps) {
  return (
    <div
      className={cn(
        "p-6 sm:p-8 rounded-2xl border-2 border-dashed border-border bg-card/40 text-center space-y-2.5 select-none",
        className
      )}
    >
      {Icon && (
        <div className="size-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground mx-auto mb-1">
          <Icon className="size-5 stroke-[2]" />
        </div>
      )}
      <h4 className="text-xs sm:text-sm font-heading font-black text-foreground">
        {title}
      </h4>
      <p className="text-[11px] sm:text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
        {description}
      </p>

      {actionLabel && actionHref && (
        <div className="pt-1.5">
          <Link
            href={actionHref}
            onClick={() => {
              soundFX.playPop();
              soundFX.vibrate(15);
            }}
            className="px-3 py-1.5 rounded-xl border-2 border-[#161514] bg-[#CEF431] text-[#161514] font-heading font-black text-xs shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>{actionLabel}</span>
          </Link>
        </div>
      )}

      {actionLabel && !actionHref && onAction && (
        <div className="pt-1.5">
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              soundFX.vibrate(15);
              onAction();
            }}
            className="px-3 py-1.5 rounded-xl border-2 border-[#161514] bg-[#CEF431] text-[#161514] font-heading font-black text-xs shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>{actionLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
}
