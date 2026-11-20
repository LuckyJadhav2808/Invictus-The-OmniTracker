"use client";

import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface HeroStatItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  shortLabel?: string;
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
  customPager?: (activeSlide: number, onSlideChange: (index: number) => void) => React.ReactNode;
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
  customPager,
}: HeroProps) {
  const [internalSlide, setInternalSlide] = useState(activeSlideIndex);
  const activeSlide = activeSlideIndex !== undefined ? activeSlideIndex : internalSlide;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    duration: 25,
    startIndex: activeSlide,
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const newIndex = emblaApi.selectedScrollSnap();
    if (newIndex !== activeSlide) {
      soundFX.vibrate(12);
      setInternalSlide(newIndex);
      onSlideChange?.(newIndex);
    }
  }, [emblaApi, activeSlide, onSlideChange]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    if (activeSlide !== emblaApi.selectedScrollSnap()) {
      emblaApi.scrollTo(activeSlide);
    }
  }, [emblaApi, activeSlide]);

  const handleSlideSelect = (idx: number) => {
    soundFX.playPop();
    soundFX.vibrate(12);
    setInternalSlide(idx);
    emblaApi?.scrollTo(idx);
    onSlideChange?.(idx);
  };

  return (
    <section
      role="region"
      aria-label={`${variant} hero summary`}
      className={cn(
        "w-full select-none relative overflow-visible transition-colors flex flex-col justify-start pt-0.5 pb-0.5",
        tintedBackground &&
          "bg-gradient-to-b from-[#CEF431]/10 via-transparent to-transparent rounded-3xl pb-1.5",
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

      {/* ================= FULL-WIDTH HERO SLIDES EMBLA VIEWPORT ================= */}
      <div className="w-full overflow-hidden" ref={emblaRef}>
        <div className="flex w-full touch-pan-y">
          {slides.map((slide) => {
            return (
              <div
                key={slide.id}
                className="min-w-0 flex-[0_0_100%] flex flex-col items-center justify-center select-none"
              >
                {slide.content}
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= CAROUSEL INDICATOR (CUSTOM SEGMENTED OR DEFAULT DOTS) ================= */}
      {customPager ? (
        customPager(activeSlide, handleSlideSelect)
      ) : (
        slides.length > 1 && (
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
        )
      )}

      {/* ================= STATS ROW (HAIRLINE DIVIDERS, NO BOXES) ================= */}
      {stats && stats.length > 0 && (
        <div className="w-full mt-2 pt-2.5 border-t border-[#161514]/10 dark:border-white/10 shrink-0">
          <div
            className={cn(
              "grid divide-x divide-[#161514]/10 dark:divide-white/10",
              stats.length === 2 && "grid-cols-2",
              stats.length === 3 && "grid-cols-3",
              stats.length >= 4 && "grid-cols-4"
            )}
          >
            {stats.map((stat) => (
              <div
                key={stat.id}
                onClick={stat.onClick}
                className={cn(
                  "flex flex-col justify-between gap-0.5 px-2 sm:px-3 min-w-0",
                  stat.onClick && "cursor-pointer active:opacity-75 transition-opacity"
                )}
              >
                {/* Row 1: Icon + Label (Full width, zero truncation) */}
                <div className="flex items-center gap-1 text-muted-foreground min-w-0">
                  <span className="shrink-0">{stat.icon}</span>
                  <span className="font-mono font-bold tracking-tight uppercase text-[9px] sm:text-[10px] text-muted-foreground truncate">
                    {stat.label}
                  </span>
                </div>

                {/* Row 2: Prominent Value + Optional Subvalue */}
                <div className="flex items-baseline justify-between gap-1 mt-0.5">
                  <span className="font-mono font-black text-foreground text-xs sm:text-sm tracking-tight truncate">
                    {stat.value}
                  </span>
                  {stat.subValue && (
                    <span className="font-mono text-[9px] text-muted-foreground truncate hidden sm:inline">
                      {stat.subValue}
                    </span>
                  )}
                </div>

                {/* Row 3: Mini Segment Bar */}
                {stat.progressPercent !== undefined && (
                  <div className="w-full h-1 sm:h-1.5 bg-secondary dark:bg-muted rounded-full overflow-hidden mt-0.5">
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

