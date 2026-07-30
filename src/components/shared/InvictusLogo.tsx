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
        "relative rounded-2xl flex items-center justify-center border-2 border-navy-900 shadow-[2.5px_2.5px_0px_0px_rgba(30,35,42,1)] overflow-hidden shrink-0 transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5",
        currentSize.icon,
        "bg-gradient-to-br from-amber-400 via-rose-400 to-indigo-500"
      )}
    >
      {/* Sleek Vector Trinity Monogram "I" + Polaris Sparkle */}
      <svg viewBox="0 0 100 100" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Monogram Base Geometry */}
        <path
          d="M32 20 H68 M50 20 V80 M32 80 H68"
          stroke="#1E232A"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M32 20 H68 M50 20 V80 M32 80 H68"
          stroke="#FFFFFF"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Central 4-Point Polaris Sparkle */}
        <path
          d="M50 32 Q50 50 68 50 Q50 50 50 68 Q50 50 32 50 Q50 50 50 32 Z"
          fill="#F59E0B"
          stroke="#1E232A"
          strokeWidth="3"
        />
        <circle cx="50" cy="50" r="3.5" fill="#FFFFFF" />
      </svg>
    </div>
  );

  if (variant === "icon-only") {
    if (href) {
      return (
        <Link href={href} className={cn("inline-block", className)}>
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
              theme === "dark" ? "text-white" : "text-navy-950"
            )}
            style={{ fontFamily: "var(--font-heading)" }}
          >
            INVICTUS
          </span>
        </div>
        <span
          className={cn(
            "font-black tracking-[0.2em] uppercase rounded-lg mt-1 w-fit border-1.5 border-navy-900 shadow-[1px_1px_0px_0px_rgba(30,35,42,1)]",
            currentSize.badge,
            "bg-amber-300 text-navy-950"
          )}
        >
          OMNITRACKER
        </span>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{logoContent}</Link>;
  }

  return logoContent;
}
