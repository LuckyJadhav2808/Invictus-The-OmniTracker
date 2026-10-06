"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NeobrutalistCloseButton } from "@/components/shared/NeobrutalistCloseButton";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

interface AdaptiveDrawerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  enableSwipeToDismiss?: boolean;
}

export function AdaptiveDrawerDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = "sm:max-w-[540px]",
  className,
  enableSwipeToDismiss = true,
}: AdaptiveDrawerDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Touch gesture physics state for mobile drawer
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const currentDeltaY = useRef(0);

  const handleClose = useCallback(() => {
    soundFX.playPop();
    onOpenChange(false);
  }, [onOpenChange]);

  // Reset drag translation when drawer closes
  useEffect(() => {
    if (!open) {
      setTranslateY(0);
      setIsDragging(false);
      currentDeltaY.current = 0;
    }
  }, [open]);

  // Touch handlers for mobile swipe-down-to-dismiss
  const onTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipeToDismiss) return;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!enableSwipeToDismiss || !isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;

    // Only allow dragging downwards
    if (deltaY > 0) {
      // Apply rubberband resistance
      const resistedDelta = Math.min(deltaY * 0.85, 320);
      currentDeltaY.current = deltaY;
      setTranslateY(resistedDelta);
    } else {
      setTranslateY(0);
      currentDeltaY.current = 0;
    }
  };

  const onTouchEnd = () => {
    if (!enableSwipeToDismiss || !isDragging) return;
    setIsDragging(false);
    const totalTime = Date.now() - touchStartTime.current;
    const velocity = currentDeltaY.current / Math.max(totalTime, 1); // px per ms

    // Threshold: dragged down > 75px OR rapid flick down (velocity > 0.12)
    if (currentDeltaY.current > 75 || (velocity > 0.12 && currentDeltaY.current > 30)) {
      soundFX.vibrate(10);
      handleClose();
    } else {
      // Spring back to top
      setTranslateY(0);
    }
    currentDeltaY.current = 0;
  };

  // 1. DESKTOP VIEWPORT (>= 768px): Centered Neobrutalist Dialog
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "max-h-[90vh] flex flex-col bg-white rounded-3xl p-0 border-[2.5px] border-[#161514]",
            "shadow-[6px_6px_0px_0px_#161514] overflow-hidden",
            maxWidth,
            className
          )}
        >
          <DialogHeader className="shrink-0 px-6 pt-5 pb-4 border-b-2 border-[#161514]/15 bg-[#FAF8F5] relative flex flex-row items-center justify-between">
            <div className="pr-4 min-w-0 flex-1">
              <DialogTitle
                className="text-lg sm:text-xl font-heading font-black text-[#161514] tracking-tight truncate"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-xs font-semibold text-[#161514]/70 mt-0.5 line-clamp-2">
                  {description}
                </DialogDescription>
              )}
            </div>

            {/* Standard 44x44px Neobrutalist Close Button */}
            <NeobrutalistCloseButton onClose={handleClose} size="sm" />
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 2. MOBILE VIEWPORT (< 768px): Swipe-Down Bottom Sheet
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        style={{
          transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className={cn(
          "bg-white rounded-t-3xl px-5 pt-3 pb-[calc(2.5rem+env(safe-area-inset-bottom))] border-t-[2.5px] border-x-[2.5px] border-[#161514]",
          "shadow-[0px_-6px_0px_0px_#161514] outline-none max-h-[92vh] flex flex-col z-50 overflow-hidden",
          className
        )}
      >
        {/* Grab Handle & Touch Area */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="w-full pt-1 pb-3 cursor-grab active:cursor-grabbing select-none flex flex-col items-center"
        >
          <div className="w-12 h-1.5 rounded-full bg-[#161514]/30 hover:bg-[#161514]/50 transition-colors" />
        </div>

        {/* Mobile Header with 44px Close Button */}
        <SheetHeader
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="text-left p-0 pb-3 border-b-2 border-[#161514]/15 relative flex flex-row items-center justify-between shrink-0"
        >
          <div className="pr-3 min-w-0 flex-1">
            <SheetTitle
              className="text-lg font-heading font-black text-[#161514] tracking-tight truncate"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {title}
            </SheetTitle>
            {description && (
              <SheetDescription className="text-xs font-semibold text-[#161514]/70 mt-0.5 line-clamp-2">
                {description}
              </SheetDescription>
            )}
          </div>

          <NeobrutalistCloseButton onClose={handleClose} size="sm" />
        </SheetHeader>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto pt-4 pb-2 scrollbar-none">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
