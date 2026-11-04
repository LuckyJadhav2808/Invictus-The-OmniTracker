"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface InvictusLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon-only" | "horizontal";
  theme?: "light" | "dark";
  className?: string;
  href?: string;
}

export function InvictusLogo({
  size = "md",
  variant = "full",
  theme = "light",
  className,
  href = "/today",
}: InvictusLogoProps) {
  const sizeMap = {
    sm: { icon: "w-8 h-8", text: "text-base", badge: "text-[8px] px-1.5 py-0.5", gap: "gap-2" },
    md: { icon: "w-10 h-10", text: "text-xl", badge: "text-[9px] px-2 py-0.5", gap: "gap-2.5" },
    lg: { icon: "w-12 h-12", text: "text-2xl", badge: "text-[10px] px-2.5 py-1", gap: "gap-3" },
    xl: { icon: "w-16 h-16", text: "text-4xl", badge: "text-xs px-3 py-1", gap: "gap-4" },
  };

  const currentSize = sizeMap[size];

  const logoGraphic = (
    <div
      className={cn(
        "relative rounded-xl flex items-center justify-center bg-[#161514] dark:bg-[#1E1C1A] overflow-hidden shrink-0 shadow-xs border border-[#161514]/20 dark:border-[#383531] dark:shadow-[1px_1px_0px_0px_#000000] transition-transform duration-150 hover:scale-105 active:scale-95",
        currentSize.icon
      )}
    >
      {/* Invictus Sovereign Monolith Brand Mark */}
      <svg viewBox="0 0 512 512" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g id="icon" transform="translate(256, 256)">
          {/* Contiguous Roman Monolith "I" Body in High-Contrast Electric Lime */}
          <path
            d="M -140 -160 L 140 -160 L 105 -100 L 55 -100 L 55 100 L 105 100 L 140 160 L -140 160 L -105 100 L -55 100 L -55 -100 L -105 -100 Z"
            fill="#CEF431"
          />
          {/* Ascending Victory Chevron Cutout */}
          <path
            d="M 0 -50 L 36 15 L 16 15 L 0 -10 L -16 15 L -36 15 Z"
            fill="#161514"
          />
        </g>
      </svg>
    </div>
  );

  if (variant === "icon-only") {
    if (href) {
      return (
        <Link href={href} className={cn("inline-block", className)} aria-label="Invictus Today">
          {logoGraphic}
        </Link>
      );
    }
    return <div className={className}>{logoGraphic}</div>;
  }

  const logoContent = (
    <div className={cn("flex items-center select-none", currentSize.gap, className)}>
      {logoGraphic}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "font-black tracking-tight leading-none uppercase",
              currentSize.text,
              theme === "dark" ? "text-white" : "text-[#161514] dark:text-[#FAF8F5]"
            )}
            style={{ fontFamily: "var(--font-heading)" }}
          >
            INVICTUS
          </span>
        </div>
        <span
          className={cn(
            "font-mono font-medium tracking-widest uppercase rounded px-1.5 py-0.5 mt-0.5 w-fit border border-[#E8E5DF] dark:border-[#383531] bg-[#F1EFEA] dark:bg-[#252321] text-[#8C8882] dark:text-[#A8A29E] text-[9px] hidden xs:inline-block"
          )}
        >
          OMNITRACKER
        </span>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} aria-label="Invictus Home">{logoContent}</Link>;
  }

  return logoContent;
}
