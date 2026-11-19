"use client";

import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface SwipeActionConfig {
  icon: React.ReactNode;
  label: string;
  color: string; // Tailwind bg class e.g. "bg-[#03D26F]" or "bg-[#FF4B4B]"
  textColor?: string;
  onTrigger: () => void;
}

export interface SwipeActionRowProps {
  children: React.ReactNode;
  leftAction?: SwipeActionConfig; // Revealed by dragging to the left (swipe left -> action on the right side)
  rightAction?: SwipeActionConfig; // Revealed by dragging to the right (swipe right -> action on the left side)
  threshold?: number; // Distance in px needed to trigger (default 72)
  className?: string;
  disabled?: boolean;
}

export function SwipeActionRow({
  children,
  leftAction,
  rightAction,
  threshold = 72,
  className,
  disabled = false,
}: SwipeActionRowProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isHorizontalScrollRef = useRef<boolean | null>(null);
  const hasVibratedThresholdRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalScrollRef.current = null;
    hasVibratedThresholdRef.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || touchStartXRef.current === null || touchStartYRef.current === null) return;

    const deltaX = e.touches[0].clientX - touchStartXRef.current;
    const deltaY = e.touches[0].clientY - touchStartYRef.current;

    // Detect if this is an intentional horizontal swipe or vertical page scroll
    if (isHorizontalScrollRef.current === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        isHorizontalScrollRef.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    if (!isHorizontalScrollRef.current) return;

    // Disallow swiping right if no rightAction, disallow swiping left if no leftAction
    if (deltaX > 0 && !rightAction) return;
    if (deltaX < 0 && !leftAction) return;

    // Rubber-band resistance curve past threshold
    let clampedDelta = deltaX;
    const maxDrag = threshold * 1.6;

    if (Math.abs(deltaX) > threshold) {
      const excess = Math.abs(deltaX) - threshold;
      const dampened = excess * 0.35;
      clampedDelta = deltaX > 0 ? threshold + dampened : -threshold - dampened;
      if (Math.abs(clampedDelta) > maxDrag) {
        clampedDelta = deltaX > 0 ? maxDrag : -maxDrag;
      }
    }

    // Trigger haptic bump once when crossing threshold
    if (Math.abs(clampedDelta) >= threshold && !hasVibratedThresholdRef.current) {
      hasVibratedThresholdRef.current = true;
      try {
        soundFX.vibrate(20);
      } catch {}
    } else if (Math.abs(clampedDelta) < threshold && hasVibratedThresholdRef.current) {
      hasVibratedThresholdRef.current = false;
    }

    setOffset(clampedDelta);
  };

  const handleTouchEnd = useCallback(() => {
    if (disabled) return;
    setIsDragging(false);

    if (offset >= threshold && rightAction) {
      try {
        soundFX.playPop();
      } catch {}
      rightAction.onTrigger();
    } else if (offset <= -threshold && leftAction) {
      try {
        soundFX.playPop();
      } catch {}
      leftAction.onTrigger();
    }

    // Reset back to center with spring transition
    setOffset(0);
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isHorizontalScrollRef.current = null;
    hasVibratedThresholdRef.current = false;
  }, [disabled, offset, threshold, rightAction, leftAction]);

  return (
    <div className={cn("relative overflow-hidden select-none rounded-xl", className)}>
      {/* Background Plate: Revealed on Swipe Right */}
      {rightAction && (
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-28 flex items-center justify-start pl-4 font-mono font-black text-xs transition-opacity border-r border-[#161514]/20",
            rightAction.color,
            rightAction.textColor || "text-[#161514]"
          )}
          style={{ opacity: offset > 10 ? Math.min(offset / threshold, 1) : 0 }}
        >
          <div className="flex items-center gap-1.5 transition-transform">
            {rightAction.icon}
            <span className="text-[10px] uppercase tracking-wider">{rightAction.label}</span>
          </div>
        </div>
      )}

      {/* Background Plate: Revealed on Swipe Left */}
      {leftAction && (
        <div
          className={cn(
            "absolute inset-y-0 right-0 w-28 flex items-center justify-end pr-4 font-mono font-black text-xs transition-opacity border-l border-[#161514]/20",
            leftAction.color,
            leftAction.textColor || "text-white"
          )}
          style={{ opacity: offset < -10 ? Math.min(Math.abs(offset) / threshold, 1) : 0 }}
        >
          <div className="flex items-center gap-1.5 transition-transform">
            <span className="text-[10px] uppercase tracking-wider">{leftAction.label}</span>
            {leftAction.icon}
          </div>
        </div>
      )}

      {/* Foreground Interactive Surface */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? "none" : "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: isDragging ? "transform" : "auto",
        }}
        className="relative z-10 w-full"
      >
        {children}
      </div>
    </div>
  );
}
