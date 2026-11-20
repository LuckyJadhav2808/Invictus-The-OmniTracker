"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TelemetryMarqueeProps {
  items: string[];
  icon?: React.ReactNode;
  speed?: number; // Duration in seconds for full loop (default: 32)
  className?: string;
  reverse?: boolean;
}

export function TelemetryMarquee({
  items,
  icon,
  speed = 32,
  className,
  reverse = false,
}: TelemetryMarqueeProps) {
  if (!items || items.length === 0) return null;

  return (
    <div
      className={cn(
        "group relative flex w-full overflow-hidden select-none border-y-2 border-[#161514] bg-[#161514] dark:bg-[#0D0C0B] py-2 text-[#FAF8F5]",
        className
      )}
      style={
        {
          "--marquee-duration": `${speed}s`,
        } as React.CSSProperties
      }
      role="marquee"
      aria-live="off"
    >
      {/* 2 Sets of duplicate content for seamless infinite CSS looping */}
      <div
        className={cn(
          "flex min-w-full shrink-0 items-center justify-around gap-6 animate-telemetry-marquee group-hover:[animation-play-state:paused] group-active:[animation-play-state:paused]",
          reverse && "direction-reverse"
        )}
      >
        {items.map((item, idx) => (
          <div key={`set1-${idx}`} className="flex items-center gap-2.5 shrink-0">
            {icon && <span className="text-[#CEF431] shrink-0">{icon}</span>}
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#FAF8F5]">
              {item}
            </span>
            <span className="text-[#CEF431] text-[10px] opacity-70">•</span>
          </div>
        ))}
      </div>

      <div
        aria-hidden="true"
        className={cn(
          "flex min-w-full shrink-0 items-center justify-around gap-6 animate-telemetry-marquee group-hover:[animation-play-state:paused] group-active:[animation-play-state:paused]",
          reverse && "direction-reverse"
        )}
      >
        {items.map((item, idx) => (
          <div key={`set2-${idx}`} className="flex items-center gap-2.5 shrink-0">
            {icon && <span className="text-[#CEF431] shrink-0">{icon}</span>}
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#FAF8F5]">
              {item}
            </span>
            <span className="text-[#CEF431] text-[10px] opacity-70">•</span>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes telemetry-marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-telemetry-marquee {
          animation: telemetry-marquee var(--marquee-duration, 32s) linear infinite;
        }
        .direction-reverse {
          animation-direction: reverse;
        }
      `}</style>
    </div>
  );
}
