"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface ResponsiveFormContainerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ResponsiveFormContainer({
  open,
  onOpenChange,
  title,
  description,
  children,
}: ResponsiveFormContainerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[94vw] sm:max-w-[520px] max-h-[88vh] flex flex-col bg-white dark:bg-[#161514] rounded-2xl p-0 border border-[#E8E5DF] dark:border-[#2A2724] shadow-2xl overflow-hidden text-[#161514] dark:text-[#FAF8F5]"
      >
        <DialogHeader className="shrink-0 px-5 sm:px-6 pt-4 pb-3.5 border-b border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#161514] relative">
          <div className="pr-10">
            <DialogTitle
              className="text-base sm:text-lg font-heading font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight"
            >
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-xs font-normal text-[#8C8882] dark:text-[#FAF8F5]/60 mt-0.5 line-clamp-2">
                {description}
              </DialogDescription>
            )}
          </div>

          {/* Minimalist Tactile Close Button */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-3.5 right-4 size-7 rounded-full bg-[#F1EFEA] dark:bg-[#252220] hover:bg-[#E8E5DF] dark:hover:bg-[#2e2a28] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-center transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="size-3.5 stroke-[2]" />
          </button>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 scrollbar-thin bg-white dark:bg-[#161514]">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
