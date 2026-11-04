"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InvictusLoadingScreenProps {
  message?: string;
  submessage?: string;
  fullscreen?: boolean;
}

/**
 * Invictus Minimal Luxury Bootloader
 * Designed for pure, calm transitions when the next screen layout is indeterminate:
 * - Zero modal box clutter
 * - Zero rotating dashed gears or distracting badges
 * - Calm monolithic mark with smooth micro-spinner track
 */
export function InvictusLoadingScreen({
  message = "INITIALIZING INVICTUS OS",
  submessage = "Loading encrypted offline state…",
  fullscreen = true,
}: InvictusLoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-[#121110] transition-colors select-none",
        fullscreen ? "min-h-screen w-full fixed inset-0 z-50" : "h-full w-full py-16"
      )}
    >
      <div className="flex flex-col items-center space-y-4 animate-in fade-in duration-200">
        {/* Sleek Sovereign Mark with Micro Spinner Ring */}
        <div className="relative size-14 flex items-center justify-center">
          {/* Subtle Outer Spinner Track */}
          <div className="absolute inset-0 rounded-2xl border-2 border-[#161514]/10 dark:border-white/10 border-t-[#161514] dark:border-t-[#CEF431] animate-spin" />

          {/* Central Invictus Monolith Tile */}
          <div className="size-10 rounded-xl bg-[#161514] dark:bg-[#1E1C1A] border border-[#161514]/20 dark:border-[#383531] shadow-xs flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 512 512" className="size-7 p-0.5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(256, 256)">
                {/* Contiguous Roman Monolith "I" Body in High-Contrast Electric Lime */}
                <path
                  d="M -140 -160 L 140 -160 L 105 -100 L 55 -100 L 55 100 L 105 100 L 140 160 L -140 160 L -105 100 L -55 100 L -55 -100 L -105 -100 Z"
                  fill="#CEF431"
                />
                {/* Ascending Victory Chevron Cutout */}
                <path
                  d="M 0 -50 L 36 15 L 16 15 L 0 -10 L -16 15 L -36 15 Z"
                  fill="#161514"
                />
              </g>
            </svg>
          </div>
        </div>

        {/* Calm Telemetry Copy */}
        <div className="text-center space-y-1">
          <p className="text-xs font-mono font-bold tracking-widest uppercase text-[#161514] dark:text-[#FAF8F5]">
            {message}
          </p>
          {submessage && (
            <p className="text-[11px] font-mono text-[#8C8882] dark:text-[#A8A29E]">
              {submessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact inline loader for buttons and action triggers
 */
export function InvictusInlineLoader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "size-4 border-[1.5px]",
    md: "size-5 border-2",
    lg: "size-6 border-2.5",
  };

  return (
    <div
      className={cn(
        "rounded-full border-[#161514]/20 dark:border-white/20 border-t-[#161514] dark:border-t-[#CEF431] animate-spin inline-block",
        sizeClasses[size]
      )}
    />
  );
}
