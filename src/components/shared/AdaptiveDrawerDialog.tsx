"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { useMediaQuery } from "@/hooks/use-media-query";
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
  forceDialog?: boolean;
}

export function AdaptiveDrawerDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = "sm:max-w-[540px]",
  className,
  forceDialog = false,
}: AdaptiveDrawerDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = useCallback(() => {
    soundFX.playPop();
    onOpenChange(false);
  }, [onOpenChange]);

  // Mobile Bottom Sheet for non-destructive drawers/modals
  if (mounted && !isDesktop && !forceDialog) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        className={className}
      >
        <div className="pb-4">{children}</div>
      </BottomSheet>
    );
  }

  // Desktop Centered Dialog (or forced dialog for destructive confirmations)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "w-[94vw] max-h-[88vh] flex flex-col bg-white dark:bg-[#161514] rounded-2xl p-0 border border-[#E8E5DF] dark:border-[#2A2724]",
          "shadow-2xl overflow-hidden transition-colors",
          maxWidth,
          className
        )}
      >
        <DialogHeader className="shrink-0 px-5 sm:px-6 pt-4 pb-3.5 border-b border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#161514] relative flex flex-row items-center justify-between">
          <div className="pr-4 min-w-0 flex-1">
            {typeof title === "string" ? (
              <DialogTitle className="text-base sm:text-lg font-heading font-bold text-[#161514] dark:text-[#FAF8F5] tracking-tight truncate">
                {title}
              </DialogTitle>
            ) : (
              <DialogTitle className="text-base sm:text-lg font-heading font-bold text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription className="text-xs font-normal text-[#8C8882] dark:text-[#A8A29E] mt-0.5 line-clamp-2">
                {description}
              </DialogDescription>
            )}
          </div>

          <NeobrutalistCloseButton onClose={handleClose} size="sm" />
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 scrollbar-thin">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
