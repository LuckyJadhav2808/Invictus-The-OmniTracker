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
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] flex flex-col bg-white rounded-3xl p-0 border-2 sm:border-[2.5px] border-navy-950 shadow-[6px_6px_0px_0px_rgba(31,36,48,1)] overflow-hidden">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-2 border-b-2 border-navy-950/20 bg-cream-bg/40">
            <DialogTitle className="text-xl font-black text-navy-950 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-xs font-bold text-navy-700 mt-0.5">
                {description}
              </DialogDescription>
            )}
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
        className="bg-white rounded-t-3xl px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 border-t-2 border-x-2 border-navy-950 shadow-[0px_-6px_0px_0px_rgba(31,36,48,1)] outline-none max-h-[88vh] overflow-y-auto"
      >
        <div className="mx-auto w-12 h-2 rounded-full bg-navy-950 mb-3 border border-black" />
        <SheetHeader className="text-left p-0 mb-2 border-b-2 border-navy-950/20 pb-2">
          <SheetTitle className="text-lg font-black text-navy-950 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            {title}
          </SheetTitle>
          {description && (
            <SheetDescription className="text-xs font-bold text-navy-700 mt-0.5">
              {description}
            </SheetDescription>
          )}
        </SheetHeader>
        <div className="mt-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
