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
        // Guarantee minimum 44x44px touch target for WCAG AA compliance while rendering a refined 28-32px circle
        "min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#161514] dark:focus-visible:ring-[#FAF8F5]",
        className
      )}
      {...props}
    >
      <span className="size-7 rounded-full bg-[#F1EFEA] hover:bg-[#E8E5DF] dark:bg-[#252321] dark:hover:bg-[#2F2C29] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-center transition-colors shadow-xs">
        <X className={cn("stroke-[2]", size === "sm" ? "size-3.5" : size === "lg" ? "size-5" : "size-4")} />
      </span>
    </button>
  );
}
