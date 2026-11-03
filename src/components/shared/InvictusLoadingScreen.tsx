"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InvictusLoadingScreenProps {
  message?: string;
  submessage?: string;
  fullscreen?: boolean;
}

/**
 * Invictus Sovereign Bootloader & Gate Spinner
 * Strictly used when the next screen layout is UNKNOWN:
 * 1. Cold app boots & pre-hydration gate checks
 * 2. Auth session gate checks & login redirects
 * 3. Safe-mode circuit breaker resets
 */
export function InvictusLoadingScreen({
  message = "INITIALIZING INVICTUS OS…",
  submessage = "Hydrating encrypted vault & offline cache",
  fullscreen = true,
}: InvictusLoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-[#FAF8F5] dark:bg-[#121110] bg-graph-grid transition-colors selection:bg-[#CEF431] selection:text-[#161514]",
        fullscreen ? "min-h-screen w-full fixed inset-0 z-50" : "h-full w-full py-12"
      )}
    >
      <div className="bg-white dark:bg-[#1C1A18] rounded-3xl p-6 sm:p-8 border-[2.5px] border-[#161514] dark:border-[#383531] shadow-[6px_6px_0px_0px_#161514] dark:shadow-[6px_6px_0px_0px_#000000] text-center space-y-4 max-w-xs sm:max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-200 select-none">
        {/* Sovereign Apex Spinner Core */}
        <div className="relative size-16 mx-auto rounded-2xl border-2.5 border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] bg-[#CEF431] flex items-center justify-center overflow-hidden">
          {/* Orbital Rotational Ring */}
          <div
            className="absolute inset-1.5 rounded-xl border border-dashed border-[#161514]/40 animate-spin"
            style={{ animationDuration: "5s" }}
          />

          {/* Sovereign Monolith Vector Icon */}
          <div className="relative z-10 flex items-center justify-center">
            <svg
              className="size-7 text-[#161514] animate-pulse"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <polygon points="12,2 22,22 12,17 2,22" />
            </svg>
          </div>

          {/* Micro Corner Highlight */}
          <div className="absolute -top-1 -right-1 size-3 bg-white/60 dark:bg-white/40 rotate-45 pointer-events-none" />
        </div>

        {/* Message Telemetry */}
        <div className="space-y-1.5">
          <p className="text-[#161514] dark:text-[#FAF8F5] font-heading font-black text-xs sm:text-sm uppercase tracking-wider">
            {message}
          </p>
          {submessage && (
            <p className="text-[11px] font-mono text-[#8C8882] dark:text-[#A8A29E] leading-relaxed">
              {submessage}
            </p>
          )}
        </div>

        {/* Real-time Confidence Telemetry Badge */}
        <div className="pt-1 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] text-[10px] font-mono font-medium text-[#161514] dark:text-[#FAF8F5]">
            <span className="size-2 rounded-full bg-[#03D26F] animate-pulse" />
            <span>Vault Active • Offline-First</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact inline loader for buttons and small badges
 */
export function InvictusInlineLoader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "size-8 rounded-lg",
    md: "size-10 rounded-xl",
    lg: "size-12 rounded-2xl",
  };
  const spinnerClasses = {
    sm: "size-4 border-2",
    md: "size-5 border-2.5",
    lg: "size-6 border-3",
  };

  return (
    <div
      className={cn(
        "mx-auto border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] bg-[#CEF431] flex items-center justify-center",
        sizeClasses[size]
      )}
    >
      <div
        className={cn(
          "rounded-full border-[#161514] border-t-transparent animate-spin",
          spinnerClasses[size]
        )}
      />
    </div>
  );
}
