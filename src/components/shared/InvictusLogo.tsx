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
    sm: { icon: "w-8 h-8", title: "text-base", badge: "text-[8px] px-1.5 py-0.5", stroke: "stroke-[2]" },
    md: { icon: "w-10 h-10", title: "text-xl", badge: "text-[9px] px-2 py-0.5", stroke: "stroke-[2.5]" },
    lg: { icon: "w-14 h-14", title: "text-2xl", badge: "text-[10px] px-2.5 py-1", stroke: "stroke-[3]" },
    xl: { icon: "w-20 h-20", title: "text-4xl", badge: "text-xs px-3 py-1", stroke: "stroke-[3.5]" },
  };

  const currentSize = sizeMap[size];

  const logoGraphic = (
    <div
      className={cn(
        "relative rounded-2xl flex items-center justify-center border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] overflow-hidden shrink-0 transition-all hover:scale-105",
        currentSize.icon,
        theme === "dark" ? "bg-navy-950" : "bg-navy-900"
      )}
    >
      {/* Aesthetic Vector Trinity Shield SVG Logo */}
      <svg viewBox="0 0 512 512" className="w-full h-full p-1.5" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logo-border-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="logo-gym" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="100%" stopColor="#EE5253" />
          </linearGradient>
          <linearGradient id="logo-study" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="logo-money" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* Outer Glow Ring */}
        <rect x="16" y="16" width="480" height="480" rx="100" fill="none" stroke="url(#logo-border-grad)" strokeWidth="16" opacity="0.85" />

        {/* 1. DUMBBELL (Gym Space) */}
        <g transform="translate(112, 130)">
          <rect x="10" y="42" width="80" height="14" rx="7" fill="#FFFFFF" />
          <rect x="22" y="20" width="14" height="56" rx="5" fill="url(#logo-gym)" />
          <rect x="10" y="26" width="10" height="44" rx="4" fill="url(#logo-gym)" />
          <rect x="64" y="20" width="14" height="56" rx="5" fill="url(#logo-gym)" />
          <rect x="80" y="26" width="10" height="44" rx="4" fill="url(#logo-gym)" />
        </g>

        {/* 2. OPEN BOOK (Study Space) */}
        <g transform="translate(300, 130)">
          <path d="M50 75 C32 60 14 62 4 68 V 22 C14 16 32 14 50 28 C68 14 86 16 96 22 V 68 C86 62 68 60 50 75 Z" fill="url(#logo-study)" />
          <line x1="50" y1="28" x2="50" y2="75" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
        </g>

        {/* 3. MONEY COIN (Money Space) */}
        <g transform="translate(206, 290)">
          <circle cx="50" cy="50" r="42" fill="url(#logo-money)" />
          <circle cx="50" cy="50" r="32" fill="none" stroke="#FFFFFF" strokeWidth="4" opacity="0.6" />
          <path d="M38 34 H62 M38 44 H58 M38 34 V52 C46 52 56 52 56 60 C56 66 46 66 38 66 H62" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        {/* CENTRAL OMNI SPARKLE STAR */}
        <g transform="translate(256, 230)">
          <path d="M0 -40 Q0 0 40 0 Q0 0 0 40 Q0 0 -40 0 Q0 0 0 -40 Z" fill="#FFFFFF" />
          <circle cx="0" cy="0" r="8" fill="#FBBF24" />
        </g>
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
    <div className={cn("flex items-center gap-3 select-none", className)}>
      {logoGraphic}
      <div className="flex flex-col">
        <span
          className={cn(
            "font-black tracking-tight leading-none uppercase flex items-center gap-1.5",
            currentSize.title,
            theme === "dark" ? "text-white" : "text-navy-950"
          )}
          style={{ fontFamily: "var(--font-heading)" }}
        >
          INVICTUS
        </span>
        <span
          className={cn(
            "font-black tracking-[0.2em] uppercase rounded-md mt-1 w-fit border border-navy-950 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]",
            currentSize.badge,
            "bg-amber-300 text-navy-950"
          )}
        >
          THE OMNITRACKER
        </span>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{logoContent}</Link>;
  }

  return logoContent;
}
