"use client";

import { cn } from "@/lib/utils";

// 1. Sketched Hand-Drawn Arrow with customizable direction and doodle text
interface DoodleArrowProps {
  direction?: "curved-down-right" | "curved-up-right" | "curved-down-left" | "curved-left";
  label?: string;
  className?: string;
  color?: string;
}

export function DoodleArrow({
  direction = "curved-down-right",
  label,
  className,
  color = "#161514",
}: DoodleArrowProps) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 select-none pointer-events-none", className)}>
      {label && (
        <span
          className="font-doodle text-xs sm:text-sm font-black text-[#161514] tracking-wide"
          style={{ color }}
        >
          {label}
        </span>
      )}
      <svg
        width="44"
        height="32"
        viewBox="0 0 54 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible shrink-0"
      >
        {direction === "curved-down-right" && (
          <>
            <path
              d="M 4 8 C 22 4, 38 10, 44 24"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Arrowhead */}
            <path
              d="M 33 22 L 45 26 L 47 14"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
        {direction === "curved-up-right" && (
          <>
            <path
              d="M 4 28 C 18 26, 36 20, 44 8"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 33 6 L 46 8 L 41 19"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
        {direction === "curved-down-left" && (
          <>
            <path
              d="M 46 6 C 30 6, 16 12, 10 26"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 21 24 L 8 27 L 7 15"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
        {direction === "curved-left" && (
          <>
            <path
              d="M 46 18 C 30 14, 20 22, 8 18"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 16 10 L 6 18 L 16 24"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </svg>
    </div>
  );
}

// 2. Tactile Sticky Note with Translucent Tape
interface DoodleStickyNoteProps {
  title?: string;
  content: string;
  footer?: string;
  className?: string;
  color?: "yellow" | "peach" | "mint" | "lavender";
  rot?: string;
}

export function DoodleStickyNote({
  title,
  content,
  footer,
  className,
  color = "yellow",
  rot = "-1.5deg",
}: DoodleStickyNoteProps) {
  const bgColors = {
    yellow: "bg-[#FEF08A]",
    peach: "bg-[#FED7AA]",
    mint: "bg-[#A7F3D0]",
    lavender: "bg-[#E9D5FF]",
  }[color];

  return (
    <div
      className={cn(
        "relative p-4 rounded-lg border-2 border-[#161514] shadow-[3.5px_3.5px_0px_0px_#161514] transition-transform duration-200 hover:rotate-0 hover:scale-[1.02]",
        bgColors,
        className
      )}
      style={{ transform: `rotate(${rot})` }}
    >
      {/* Washi Tape Strip at top */}
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#FAF8F5]/80 border border-[#161514]/30 backdrop-blur-xs shadow-[1px_1px_0px_0px_rgba(22,21,20,0.15)] rotate-1 select-none pointer-events-none"
        style={{
          clipPath:
            "polygon(0% 0%, 100% 0%, 97% 100%, 3% 100%)",
        }}
      />

      <div className="space-y-1.5 select-none">
        {title && (
          <div className="flex items-center gap-1.5 font-marker text-xs font-bold text-[#161514] uppercase tracking-wide">
            <span>📌</span>
            <span>{title}</span>
          </div>
        )}
        <p className="font-doodle text-xs sm:text-sm text-[#161514] leading-relaxed font-semibold">
          {content}
        </p>
        {footer && (
          <div className="pt-1 text-[11px] font-hand font-extrabold text-[#161514]/75 text-right italic">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// 3. Neobrutalist Stamp / Badge
interface DoodleStampProps {
  text: string;
  subtext?: string;
  variant?: "lime" | "orange" | "cyan" | "white";
  rot?: string;
  className?: string;
}

export function DoodleStamp({
  text,
  subtext,
  variant = "lime",
  rot = "2deg",
  className,
}: DoodleStampProps) {
  const colors = {
    lime: "bg-[#CEF431] text-[#161514]",
    orange: "bg-[#FF4F17] text-white",
    cyan: "bg-[#38BDF8] text-[#161514]",
    white: "bg-white text-[#161514]",
  }[variant];

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center justify-center px-2.5 py-1 rounded-md border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] font-heading font-black uppercase tracking-wider select-none",
        colors,
        className
      )}
      style={{ transform: `rotate(${rot})` }}
    >
      <span className="text-[10px] sm:text-xs leading-none">{text}</span>
      {subtext && (
        <span className="text-[8px] font-mono tracking-widest opacity-80 leading-tight">
          {subtext}
        </span>
      )}
    </div>
  );
}

// 4. Background Decorative Sketch Doodles
export function AuthBackgroundDoodles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* Top Left: Hand-Drawn Target Bullseye */}
      <svg
        className="absolute top-12 left-6 sm:left-14 w-20 h-20 text-[#161514]/15 sm:text-[#161514]/20"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="50" cy="50" r="42" strokeDasharray="6 4" />
        <circle cx="50" cy="50" r="26" />
        <circle cx="50" cy="50" r="10" fill="currentColor" fillOpacity="0.3" />
        <line x1="50" y1="2" x2="50" y2="98" />
        <line x1="2" y1="50" x2="98" y2="50" />
      </svg>

      {/* Top Right: Hand-Drawn Starburst / Sparkle Cluster */}
      <svg
        className="absolute top-8 right-8 sm:right-16 w-16 h-16 text-[#FF4F17]/25"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M50 0 L55 38 L95 45 L58 55 L50 95 L42 55 L5 45 L45 38 Z" fill="currentColor" fillOpacity="0.15" />
        <circle cx="82" cy="18" r="4" fill="currentColor" />
        <circle cx="16" cy="78" r="3" fill="currentColor" />
      </svg>

      {/* Bottom Left: Spiral / Swirl Doodle */}
      <svg
        className="absolute bottom-12 left-8 sm:left-20 w-16 h-16 text-[#03D26F]/25"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M50 50 C45 42, 38 48, 40 56 C44 68, 62 66, 66 52 C70 34, 46 26, 32 36 C14 50, 24 80, 50 84 C78 88, 92 60, 84 32" />
      </svg>

      {/* Bottom Right: Hand-Drawn Lightning Doodle */}
      <svg
        className="absolute bottom-16 right-10 sm:right-24 w-14 h-18 text-[#CEF431]/40"
        viewBox="0 0 60 90"
        fill="currentColor"
        stroke="#161514"
        strokeWidth="2"
        strokeLinejoin="round"
      >
        <polygon points="34 2, 4 48, 28 48, 22 88, 56 38, 32 38" />
      </svg>
    </div>
  );
}
