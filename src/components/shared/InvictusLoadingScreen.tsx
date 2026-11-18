"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InvictusLoadingScreenProps {
  message?: string;
  submessage?: string;
  fullscreen?: boolean;
}

/**
 * Invictus Minimal Sovereign Icon Splash Screen
 * Pure, calm native-app splash screen benchmarked against Apple iOS / Linear.
 * - Zero noisy "INITIALIZING INVICTUS OS" or terminal telemetry by default
 * - Zero distracting outer spinning wheels
 * - Centerpiece: Sovereign Roman Monolith squircle icon with high-contrast electric lime mark
 * - Hardware-accelerated smooth entrance with subtle, calm breathing pulse
 */
export function InvictusLoadingScreen({
  message,
  submessage,
  fullscreen = true,
}: InvictusLoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-[#121110] transition-colors select-none",
        fullscreen ? "min-h-screen w-full fixed inset-0 z-50" : "h-full w-full py-16"
      )}
    >
      <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* 🏛️ Sovereign Roman Monolith Squircle Splash Icon */}
        <div className="relative size-20 sm:size-24 rounded-3xl bg-[#161514] dark:bg-[#1E1C1A] border-2 border-[#161514]/20 dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center overflow-hidden transition-transform duration-300 motion-safe:animate-pulse">
          <svg
            viewBox="0 0 512 512"
            className="size-14 sm:size-16 p-1 drop-shadow-xs"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="splash-monolith-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#CEF431" />
                <stop offset="100%" stopColor="#03D26F" />
              </linearGradient>
            </defs>
            <g transform="translate(256, 256)">
              {/* Contiguous Roman Monolith "I" Body in High-Contrast Electric Lime -> Emerald */}
              <path
                d="M -140 -160 L 140 -160 L 105 -100 L 55 -100 L 55 100 L 105 100 L 140 160 L -140 160 L -105 100 L -55 100 L -55 -100 L -105 -100 Z"
                fill="url(#splash-monolith-gradient)"
              />
              {/* Ascending Victory Chevron Cutout */}
              <path
                d="M 0 -50 L 36 15 L 16 15 L 0 -10 L -16 15 L -36 15 Z"
                fill="#161514"
              />
            </g>
          </svg>
        </div>

        {/* Optional Contextual Message (Only rendered if caller explicitly provides one) */}
        {message && (
          <div className="text-center space-y-1 pt-1 animate-in fade-in duration-200">
            <p className="text-xs font-mono font-bold tracking-widest uppercase text-[#161514] dark:text-[#FAF8F5]">
              {message}
            </p>
            {submessage && (
              <p className="text-[11px] font-mono text-[#8C8882] dark:text-[#A8A29E]">
                {submessage}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Alias export for semantic clarity
 */
export { InvictusLoadingScreen as InvictusSplashScreen };

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
