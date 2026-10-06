"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NeobrutalistCloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClose?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function NeobrutalistCloseButton({
  onClose,
  className,
  size = "md",
  ...props
}: NeobrutalistCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close dialog"
      className={cn(
        // Guarantee minimum 44x44px touch target for WCAG AA compliance
        "min-w-[44px] min-h-[44px] w-11 h-11 inline-flex items-center justify-center rounded-xl",
        "bg-white hover:bg-[#FFF9EA] text-[#161514] border-2 border-[#161514]",
        "shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#161514]",
        "active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
        "transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#161514]",
        className
      )}
      {...props}
    >
      <X className={cn("stroke-[2.5]", size === "sm" ? "size-4" : size === "lg" ? "size-6" : "size-5")} />
    </button>
  );
}
