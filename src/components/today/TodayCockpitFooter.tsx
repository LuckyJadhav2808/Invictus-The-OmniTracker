"use client";

import React from "react";
import { Shield, Keyboard, ArrowUp, Zap } from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

interface TodayCockpitFooterProps {
  onScrollToTop?: () => void;
  className?: string;
}

export function TodayCockpitFooter({
  onScrollToTop,
  className,
}: TodayCockpitFooterProps) {
  const handleTopClick = () => {
    soundFX.playPop();
    soundFX.vibrate(15);
    if (onScrollToTop) onScrollToTop();
    else {
      const el = document.getElementById("main-scroll-container") || window;
      if ("scrollTo" in el) el.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer
      className={cn(
        "pt-4 pb-32 sm:pb-24 border-t-2 border-[#161514]/15 mt-8 space-y-4 select-none",
        className
      )}
      role="contentinfo"
      aria-label="Today Cockpit Production Footer"
    >
      {/* 1. Keyboard Navigation Quick Legend (Linear / Raycast Benchmark) */}
      <div className="bg-white border-2 border-[#161514] rounded-xl p-3 shadow-[2px_2px_0px_0px_#161514] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded bg-[#F1EFEA] border border-[#161514] flex items-center justify-center">
            <Keyboard className="size-3.5 text-[#161514]" />
          </div>
          <span className="font-heading font-black text-xs text-[#161514] uppercase tracking-wider">
            Cockpit Quick Keys
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap font-mono text-[11px] text-[#161514]">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#161514] shadow-[1px_1px_0px_#161514] font-bold">
              J / K
            </kbd>
            <span className="text-[#161514]/70">Scroll</span>
          </span>

          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#161514] shadow-[1px_1px_0px_#161514] font-bold">
              T
            </kbd>
            <span className="text-[#161514]/70">Timer</span>
          </span>

          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#161514] shadow-[1px_1px_0px_#161514] font-bold">
              E
            </kbd>
            <span className="text-[#161514]/70">Expense</span>
          </span>

          <button
            type="button"
            onClick={handleTopClick}
            className="flex items-center gap-1 hover:text-black cursor-pointer group"
          >
            <kbd className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#161514] shadow-[1px_1px_0px_#161514] font-bold group-hover:bg-[#CEF431] transition-colors">
              ▲
            </kbd>
            <span className="text-[#161514]/70 group-hover:text-[#161514]">Top</span>
          </button>
        </div>
      </div>

      {/* 2. Architecture & Data Sovereignty Stamp */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1 text-[11px] font-mono text-[#161514]/70 text-center sm:text-left">
        <div className="flex items-center gap-1.5">
          <Shield className="size-3.5 text-emerald-700 shrink-0" />
          <span>INVICTUS OS v1.7.2 • LOCAL AES-GCM ENCRYPTED VAULT • ZERO CLS</span>
        </div>

        <div className="flex items-center gap-2">
          <span>0 CLOUD TRACKERS</span>
          <span>•</span>
          <span className="text-[#161514] font-bold">100% SOVEREIGN DATA</span>
        </div>
      </div>
    </footer>
  );
}
