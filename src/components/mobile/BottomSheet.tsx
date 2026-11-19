"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  maxHeight?: string; // e.g. "max-h-[85vh]"
  showCloseButton?: boolean;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  maxHeight = "max-h-[85vh]",
  showCloseButton = true,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = useCallback(() => {
    soundFX.playPop();
    onOpenChange(false);
  }, [onOpenChange]);

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleClose]);

  // Touch drag to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 100) {
      handleClose();
    }
    setDragOffset(0);
    setIsDragging(false);
    touchStartY.current = null;
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col justify-end select-none animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xs transition-opacity cursor-pointer"
        aria-hidden="true"
      />

      {/* Sheet Surface */}
      <div
        ref={sheetRef}
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className={cn(
          "relative w-full max-w-lg mx-auto bg-[#FAF8F5] dark:bg-[#161514] text-[#161514] dark:text-[#FAF8F5] border-t-2 border-x-2 border-[#161514] dark:border-[#38332E] rounded-t-3xl shadow-[0px_-4px_16px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden pb-[calc(1rem+env(safe-area-inset-bottom,0px))]",
          maxHeight,
          className
        )}
      >
        {/* Drag Handle Zone */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none shrink-0"
        >
          <div className="w-12 h-1.5 rounded-full bg-[#161514]/20 dark:bg-white/20" />
        </div>

        {/* Header Bar */}
        {(title || showCloseButton) && (
          <div className="px-4 pb-2.5 flex items-center justify-between gap-3 border-b border-[#161514]/10 dark:border-white/10 shrink-0">
            <div className="min-w-0 flex-1">
              {typeof title === "string" ? (
                <h3 className="font-heading font-black text-base sm:text-lg tracking-tight text-foreground truncate">
                  {title}
                </h3>
              ) : (
                title
              )}
              {description && (
                <p className="text-xs text-muted-foreground font-sans line-clamp-1 mt-0.5">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={handleClose}
                className="size-8 rounded-full border border-border bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
                aria-label="Close sheet"
              >
                <X className="size-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        )}

        {/* Sheet Content Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 overscroll-contain">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
