"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface HeroStatItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  progressPercent?: number; // 0 - 100
  progressColor?: string; // CSS color string or tailwind class
  onClick?: () => void;
}

export interface HeroSlide {
  id: string;
  title?: string;
  content: React.ReactNode;
}

export interface HeroProps {
  variant?: "gauge" | "ring" | "balance" | "countdown" | "chart";
  slides: HeroSlide[];
  stats?: HeroStatItem[]; // 2 columns separated by hairline vertical divider
  topLeft?: React.ReactNode;
  topRight?: React.ReactNode;
  activeSlideIndex?: number;
  onSlideChange?: (index: number) => void;
  className?: string;
  tintedBackground?: boolean; // Optional lime-tinted background zone for presence without borders
}

export function Hero({
  variant = "gauge",
  slides,
  stats,
  topLeft,
  topRight,
  activeSlideIndex = 0,
  onSlideChange,
  className,
  tintedBackground = false,
}: HeroProps) {
  const [internalSlide, setInternalSlide] = useState(activeSlideIndex);
  const activeSlide = activeSlideIndex !== undefined ? activeSlideIndex : internalSlide;

  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);

  const handleSlideSelect = (idx: number) => {
    soundFX.playPop();
    soundFX.vibrate(12);
    setInternalSlide(idx);
    onSlideChange?.(idx);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
    }
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null) return;
    const delta = touchDeltaXRef.current;
    const threshold = 35;

    if (delta < -threshold && activeSlide < slides.length - 1) {
      handleSlideSelect(activeSlide + 1);
    } else if (delta > threshold && activeSlide > 0) {
      handleSlideSelect(activeSlide - 1);
    }

    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  };

  return (
    <section
      role="region"
      aria-label={`${variant} hero summary`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        "w-full select-none relative overflow-hidden transition-colors flex flex-col justify-between pt-1 pb-2",
        tintedBackground &&
          "bg-gradient-to-b from-[#CEF431]/10 via-transparent to-transparent rounded-3xl pb-3",
        className
      )}
    >
      {/* ================= CORNER CHIPS ROW (OUTSIDE ARC) ================= */}
      {(topLeft || topRight) && (
        <div className="flex items-center justify-between gap-2 px-1 pb-1 z-10 shrink-0">
          <div className="flex items-center gap-1.5">{topLeft}</div>
          <div className="flex items-center gap-1.5">{topRight}</div>
        </div>
      )}

      {/* ================= FULL-WIDTH HERO SLIDES VIEWPORT ================= */}
      <div className="relative w-full flex-1 min-h-[190px] sm:min-h-[210px] flex items-center justify-center overflow-hidden">
        {slides.map((slide, idx) => {
          const isActive = idx === activeSlide;
          return (
            <div
              key={slide.id}
              className={cn(
                "w-full h-full flex flex-col items-center justify-center transition-all duration-250 ease-out",
                isActive
                  ? "opacity-100 scale-100 relative pointer-events-auto"
                  : "opacity-0 scale-95 absolute inset-0 pointer-events-none"
              )}
              style={{ willChange: "transform, opacity" }}
              aria-hidden={!isActive}
            >
              {slide.content}
            </div>
          );
        })}
      </div>

      {/* ================= CAROUSEL DOTS INDICATOR ================= */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-1 shrink-0 z-10">
          {slides.map((slide, idx) => (
            <button
              key={`dot-${slide.id}`}
              type="button"
              onClick={() => handleSlideSelect(idx)}
              className="p-2 -m-2 cursor-pointer touch-manipulation flex items-center justify-center"
              aria-label={`Go to slide ${idx + 1}: ${slide.title || slide.id}`}
            >
              <span
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  activeSlide === idx
                    ? "w-6 bg-[#161514] dark:bg-[#CEF431]"
                    : "w-1.5 bg-[#161514]/20 dark:bg-white/20 hover:bg-[#161514]/40"
                )}
              />
            </button>
          ))}
        </div>
      )}

      {/* ================= STATS ROW (HAIRLINE DIVIDERS, NO BOXES) ================= */}
      {stats && stats.length > 0 && (
        <div className="w-full mt-2 pt-2.5 border-t border-[#161514]/10 dark:border-white/10 shrink-0">
          <div
            className={cn(
              "grid gap-2 divide-x divide-[#161514]/10 dark:divide-white/10",
              stats.length === 2 && "grid-cols-2",
              stats.length === 3 && "grid-cols-3",
              stats.length >= 4 && "grid-cols-4"
            )}
          >
            {stats.map((stat, i) => (
              <div
                key={stat.id}
                onClick={stat.onClick}
                className={cn(
                  "flex flex-col justify-between gap-1 px-2.5",
                  i > 0 && "pl-3",
                  stat.onClick && "cursor-pointer active:opacity-75 transition-opacity"
                )}
              >
                {/* Top: Icon + Label + Value */}
                <div className="flex items-center justify-between gap-1 text-[11px] min-w-0">
                  <div className="flex items-center gap-1 text-muted-foreground truncate">
                    <span className="shrink-0">{stat.icon}</span>
                    <span className="font-mono font-bold tracking-wider uppercase text-[10px] truncate">
                      {stat.label}
                    </span>
                  </div>
                  <span className="font-mono font-black text-foreground shrink-0 text-xs">
                    {stat.value}
                  </span>
                </div>

                {/* Bottom: Mini Segment Bar */}
                {stat.progressPercent !== undefined && (
                  <div className="w-full h-1.5 bg-secondary dark:bg-muted rounded-full overflow-hidden mt-0.5">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        stat.progressColor || "bg-[#03D26F]"
                      )}
                      style={{
                        width: `${Math.max(0, Math.min(100, stat.progressPercent))}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
