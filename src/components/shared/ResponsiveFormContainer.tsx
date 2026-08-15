"use client";

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
import { X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as SheetPrimitive from "@radix-ui/react-dialog";

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
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false} className="sm:max-w-[520px] max-h-[90vh] flex flex-col bg-white rounded-3xl p-0 border-2 sm:border-[2.5px] border-navy-950 shadow-[6px_6px_0px_0px_rgba(31,36,48,1)] overflow-hidden">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-3 border-b-2 border-navy-950/20 bg-cream-bg/40 relative">
            <div className="pr-8">
              <DialogTitle className="text-xl font-black text-navy-950 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-xs font-bold text-navy-700 mt-0.5">
                  {description}
                </DialogDescription>
              )}
            </div>

            {/* Desktop Close Modal Button (Issue 4 Fix) */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute top-5 right-5 bg-rose-100 hover:bg-rose-300 text-[#161514] p-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              title="Close modal"
            >
              <X className="h-4 w-4 stroke-[3]" />
            </button>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6 mt-4 scrollbar-thin">{children}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="bg-white rounded-t-3xl px-6 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-4 border-t-2 border-x-2 border-navy-950 shadow-[0px_-6px_0px_0px_rgba(31,36,48,1)] outline-none max-h-[92vh] overflow-y-auto z-50"
      >
        <div className="mx-auto w-12 h-2 rounded-full bg-navy-950 mb-3 border border-black" />
        <SheetHeader className="text-left p-0 mb-2 border-b-2 border-navy-950/20 pb-3 relative">
          <div className="pr-10">
            <SheetTitle className="text-lg font-black text-navy-950 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              {title}
            </SheetTitle>
            {description && (
              <SheetDescription className="text-xs font-bold text-navy-700 mt-0.5">
                {description}
              </SheetDescription>
            )}
          </div>

          {/* Mobile Close Modal Button (Issue 4 Fix) */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-0 right-0 bg-rose-100 hover:bg-rose-300 text-[#161514] p-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            title="Close popup"
          >
            <X className="h-4 w-4 stroke-[3]" />
          </button>
        </SheetHeader>
        <div className="mt-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
