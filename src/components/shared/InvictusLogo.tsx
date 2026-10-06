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
        "relative rounded-xl flex items-center justify-center border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] overflow-hidden shrink-0 transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5",
        currentSize.icon,
        "bg-[#CEF431]"
      )}
    >
      {/* Vix Gladiator Brand Mark */}
      <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Plume Crest */}
        <path
          d="M36 22C34 8 44 4 50 4C56 4 66 8 64 22H36Z"
          fill="#E61919"
          stroke="#161514"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <line x1="43" y1="19" x2="42" y2="9" stroke="#161514" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="18" x2="50" y2="6" stroke="#161514" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="57" y1="19" x2="58" y2="9" stroke="#161514" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="41" y="19" width="18" height="5" rx="1.5" fill="#FFB800" stroke="#161514" strokeWidth="3" />

        {/* Ear Bolts */}
        <rect x="20" y="42" width="6" height="15" rx="2" fill="#CBD5E1" stroke="#161514" strokeWidth="3" />
        <rect x="74" y="42" width="6" height="15" rx="2" fill="#CBD5E1" stroke="#161514" strokeWidth="3" />

        {/* Helmet Dome */}
        <rect x="25" y="23" width="50" height="50" rx="9" fill="#FFFDF8" stroke="#161514" strokeWidth="4" />
        <line x1="25" y1="34" x2="75" y2="34" stroke="#161514" strokeWidth="3" />
        <rect x="46" y="26" width="8" height="5" rx="1" fill="#CEF431" stroke="#161514" strokeWidth="2" />

        {/* Digital Visor */}
        <rect x="31" y="38" width="38" height="22" rx="4" fill="#161514" />
        <rect x="37" y="44" width="8" height="8" rx="2" fill="#38BDF8" />
        <rect x="55" y="44" width="8" height="8" rx="2" fill="#38BDF8" />
        <circle cx="40" cy="47" r="1.5" fill="#FFFFFF" />
        <circle cx="58" cy="47" r="1.5" fill="#FFFFFF" />

        {/* Invictus 'V' Chin Emblem */}
        <polygon
          points="50,84 38,64 44,64 50,74 56,64 62,64"
          fill="#CEF431"
          stroke="#161514"
          strokeWidth="3"
          strokeLinejoin="round"
        />
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
              theme === "dark" ? "text-white" : "text-[#161514]"
            )}
            style={{ fontFamily: "var(--font-heading)" }}
          >
            INVICTUS
          </span>
        </div>
        <span
          className={cn(
            "font-black tracking-[0.2em] uppercase rounded-lg mt-1 w-fit border-1.5 border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] hidden xs:inline-block",
            currentSize.badge,
            "bg-[#CEF431] text-[#161514]"
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
