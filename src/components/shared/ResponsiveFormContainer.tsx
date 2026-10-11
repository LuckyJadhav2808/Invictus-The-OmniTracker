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
        className="w-[94vw] sm:max-w-[520px] max-h-[88vh] flex flex-col bg-white rounded-3xl p-0 border-2 sm:border-[2.5px] border-[#161514] shadow-[6px_6px_0px_0px_#161514] overflow-hidden"
      >
        <DialogHeader className="shrink-0 px-5 sm:px-6 pt-5 pb-3 border-b-2 border-[#161514]/20 bg-[#FAF8F5] relative">
          <div className="pr-10">
            <DialogTitle
              className="text-lg sm:text-xl font-black text-[#161514] tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-xs font-bold text-[#161514]/70 mt-0.5 line-clamp-2">
                {description}
              </DialogDescription>
            )}
          </div>

          {/* Unified Neobrutalist Close Button */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 bg-rose-100 hover:bg-rose-200 text-[#161514] p-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            title="Close modal"
          >
            <X className="h-4 w-4 stroke-[3]" />
          </button>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 scrollbar-thin">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
