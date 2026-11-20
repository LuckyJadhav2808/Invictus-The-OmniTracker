"use client";

import React from "react";
import { Drawer } from "vaul";
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
  snapPoints?: (string | number)[];
  activeSnapPoint?: string | number | null;
  setActiveSnapPoint?: (snapPoint: string | number | null) => void;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  maxHeight = "max-h-[88vh]",
  showCloseButton = true,
  snapPoints,
  activeSnapPoint,
  setActiveSnapPoint,
}: BottomSheetProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          soundFX.playPop();
        }
        onOpenChange(val);
      }}
      shouldScaleBackground
      snapPoints={snapPoints}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={setActiveSnapPoint}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs transition-opacity" />
        <Drawer.Content
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl outline-none select-none",
            "bg-[#FAF8F5] dark:bg-[#161514] text-[#161514] dark:text-[#FAF8F5]",
            "border-t-2 border-x-2 border-[#161514] dark:border-[#38332E]",
            "shadow-[0px_-6px_24px_rgba(0,0,0,0.18)] pb-[calc(1rem+env(safe-area-inset-bottom,0px))]",
            maxHeight,
            className
          )}
        >
          {/* Tactile Native Drag Handle Bar */}
          <div className="w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-[#161514]/25 dark:bg-white/25 transition-colors" />
          </div>

          {/* Header Bar */}
          {(title || showCloseButton) && (
            <div className="px-4 pb-2.5 flex items-center justify-between gap-3 border-b border-[#161514]/10 dark:border-white/10 shrink-0">
              <div className="min-w-0 flex-1">
                {typeof title === "string" ? (
                  <Drawer.Title className="font-heading font-black text-base sm:text-lg tracking-tight text-[#161514] dark:text-[#FAF8F5] leading-snug break-words line-clamp-2">
                    {title}
                  </Drawer.Title>
                ) : (
                  <div className="font-heading font-black">{title}</div>
                )}
                {description && (
                  <Drawer.Description className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] font-sans line-clamp-2 break-words mt-0.5">
                    {description}
                  </Drawer.Description>
                )}
              </div>

              {showCloseButton && (
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="size-8 rounded-full border border-[#161514]/15 dark:border-[#2A2724] bg-white dark:bg-[#252220] hover:bg-[#FAF8F5] dark:hover:bg-[#2e2a28] text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5] flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
                  aria-label="Close sheet"
                >
                  <X className="size-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          )}

          {/* Sheet Content Body with Nested Scroll Isolation */}
          <div className="flex-1 overflow-y-auto px-4 py-3 overscroll-contain">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
