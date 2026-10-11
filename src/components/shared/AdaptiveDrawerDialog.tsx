"use client";

import React, { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
}: AdaptiveDrawerDialogProps) {
  const handleClose = useCallback(() => {
    soundFX.playPop();
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "w-[94vw] max-h-[88vh] flex flex-col bg-white rounded-3xl p-0 border-2 sm:border-[2.5px] border-[#161514]",
          "shadow-[6px_6px_0px_0px_#161514] overflow-hidden",
          maxWidth,
          className
        )}
      >
        <DialogHeader className="shrink-0 px-5 sm:px-6 pt-5 pb-3.5 border-b-2 border-[#161514]/15 bg-[#FAF8F5] relative flex flex-row items-center justify-between">
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

          {/* Standard Neobrutalist Close Button */}
          <NeobrutalistCloseButton onClose={handleClose} size="sm" />
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 scrollbar-thin">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
