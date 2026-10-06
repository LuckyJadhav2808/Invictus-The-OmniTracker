"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DoodleInvictusTitleProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showReplay?: boolean;
  showSubtitle?: boolean;
}

const LETTERS = [
  { char: "I", rot: "-2.5deg", dy: "0px", dx: "0px" },
  { char: "N", rot: "2.2deg", dy: "-1px", dx: "1px" },
  { char: "V", rot: "-1.8deg", dy: "1px", dx: "0px" },
  { char: "I", rot: "3.2deg", dy: "-2px", dx: "1px" },
  { char: "C", rot: "-2deg", dy: "0px", dx: "0px" },
  { char: "T", rot: "1.8deg", dy: "-1px", dx: "1px" },
  { char: "U", rot: "-1.2deg", dy: "1px", dx: "0px" },
  { char: "S", rot: "2.6deg", dy: "-1px", dx: "1px" },
];

export function DoodleInvictusTitle({
  className,
  size = "lg",
  showReplay = true,
  showSubtitle = true,
}: DoodleInvictusTitleProps) {
  const [animKey, setAnimKey] = useState(0);
  const [isWriting, setIsWriting] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Pen nib glides across during letter drawing and vanishes cleanly once letters finish
  useEffect(() => {
    setIsWriting(true);
    const timer = setTimeout(() => {
      setIsWriting(false);
    }, 1250);
    return () => clearTimeout(timer);
  }, [animKey]);

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimKey((prev) => prev + 1);
  };

  const sizeClasses = {
    sm: "text-3xl sm:text-4xl",
    md: "text-4xl sm:text-5xl",
    lg: "text-4xl xs:text-5xl sm:text-6xl md:text-7xl",
    xl: "text-5xl xs:text-6xl sm:text-7xl md:text-8xl",
  }[size];

  return (
    <div
      key={animKey}
      className={cn("relative inline-block select-none group text-center lg:text-left", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hand-Drawn Doodle Crown perched on top of 'V' */}
      <div
        className="absolute -top-6 xs:-top-7 sm:-top-8 left-[27%] xs:left-[28%] z-20 animate-doodle-crown pointer-events-none"
        style={{ transformOrigin: "bottom center" }}
      >
        <svg
          width="38"
          height="28"
          viewBox="0 0 42 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[2px_2px_0px_#161514]"
        >
          {/* Hand-drawn Crown Outline & Fill */}
          <path
            d="M 5 24 L 2 9 L 14 15 L 21 4 L 28 15 L 40 9 L 37 24 Z"
            fill="#CEF431"
            stroke="#161514"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Crown Jewels (Hand-drawn ink dots) */}
          <circle cx="2" cy="8" r="2.2" fill="#FF4F17" stroke="#161514" strokeWidth="1.5" />
          <circle cx="21" cy="4" r="2.5" fill="#38BDF8" stroke="#161514" strokeWidth="1.5" />
          <circle cx="40" cy="8" r="2.2" fill="#FF4F17" stroke="#161514" strokeWidth="1.5" />
          <circle cx="21" cy="18" r="2" fill="#161514" />
        </svg>
      </div>

      {/* Sparkle 1 (Top Right) */}
      <div className="absolute -top-4 -right-4 xs:-right-6 sm:-right-7 z-10 animate-doodle-sparkle-1 pointer-events-none text-[#FF4F17]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" />
        </svg>
      </div>

      {/* Sparkle 2 (Top Left) */}
      <div className="absolute -top-2 -left-4 xs:-left-5 z-10 animate-doodle-sparkle-2 pointer-events-none text-[#03D26F]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="stroke-[#161514] stroke-[1.5]">
          <path d="M12 0 L14 9 L23 12 L14 15 L12 24 L10 15 L1 12 L10 9 Z" />
        </svg>
      </div>

      {/* Virtual Pen Nib Indicator (Active strictly while writing letters) */}
      {isWriting && (
        <div
          className="absolute top-0 left-0 z-30 animate-doodle-pen pointer-events-none hidden sm:block"
          aria-hidden="true"
        >
          <div className="relative -top-2">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              className="filter drop-shadow-[1.5px_1.5px_0px_#161514]"
            >
              {/* Hand-drawn Fountain Pen Nib */}
              <path
                d="M3 21L6 20L19 7C20 6 20 4 19 3C18 2 16 2 15 3L2 16L1 21L3 21Z"
                fill="#CEF431"
                stroke="#161514"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path d="M14 4L18 8" stroke="#161514" strokeWidth="2" strokeLinecap="round" />
              <circle cx="2" cy="22" r="1.5" fill="#161514" />
            </svg>
            <span className="absolute -bottom-1 -left-1 size-2 rounded-full bg-[#03D26F] animate-ping opacity-60" />
          </div>
        </div>
      )}

      {/* Main Handwritten Letters Container */}
      <div className="relative inline-flex items-center justify-center font-marker tracking-wider text-[#161514]">
        {LETTERS.map((item, idx) => (
          <span
            key={`${animKey}-${idx}`}
            className="animate-doodle-letter cursor-pointer transition-transform duration-150 hover:scale-125 hover:text-[#03D26F] hover:rotate-6 active:scale-95"
            style={
              {
                animationDelay: `${idx * 120}ms`,
                "--rot": item.rot,
                transform: `translate(${item.dx}, ${item.dy}) rotate(${item.rot})`,
                textShadow:
                  "2px 2px 0px #FAF8F5, 3px 3px 0px rgba(22, 21, 20, 0.95)",
              } as React.CSSProperties
            }
          >
            <span className={cn(sizeClasses, "inline-block")}>{item.char}</span>
          </span>
        ))}

        {/* Interactive "Re-draw" Mini Badge button */}
        {showReplay && (
          <button
            type="button"
            onClick={handleReplay}
            title="Write again! ✍️"
            className={cn(
              "absolute -right-8 xs:-right-10 sm:-right-12 bottom-1.5 sm:bottom-2 p-1 sm:p-1.5 rounded-lg bg-[#FAF8F5] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] transition-all cursor-pointer hover:bg-[#CEF431] hover:rotate-12 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
              isHovered ? "opacity-100 scale-100" : "opacity-80 sm:opacity-50 hover:opacity-100"
            )}
            aria-label="Replay handwriting animation"
          >
            <RefreshCw className="size-3.5 sm:size-4 text-[#161514] transition-transform duration-300 hover:rotate-180" />
          </button>
        )}
      </div>

      {/* Energetic Hand-drawn Underline Squiggle */}
      <div className="relative -mt-1 sm:-mt-2 w-full flex justify-center overflow-visible">
        <svg
          viewBox="0 0 340 28"
          className="w-[104%] max-w-[380px] sm:max-w-[420px] h-5 sm:h-7 overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shadow line */}
          <path
            d="M 6 16 C 50 11, 110 22, 175 14 C 235 7, 290 19, 334 13"
            stroke="#161514"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-doodle-underline opacity-25"
          />
          {/* Main Primary Green Ink Swoosh */}
          <path
            d="M 4 14 C 48 9, 108 20, 173 12 C 233 5, 288 17, 332 11"
            stroke="#03D26F"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-doodle-underline"
          />
          {/* Secondary scribbled flourish loop */}
          <path
            d="M 220 18 C 265 24, 305 21, 336 17"
            stroke="#CEF431"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="animate-doodle-underline"
            style={{ animationDelay: "1.15s" }}
          />
        </svg>
      </div>

      {/* Subtitle / Handwritten Tag */}
      {showSubtitle && (
        <div className="flex items-center justify-center lg:justify-start mt-1 sm:mt-1.5 gap-2">
          <div className="relative inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 bg-[#CEF431] border-2 border-[#161514] rounded-md shadow-[2px_2px_0px_0px_#161514] -rotate-1 transform hover:rotate-0 transition-transform">
            <Sparkles className="size-3 text-[#161514] stroke-[2.5]" />
            <span className="font-doodle text-xs sm:text-sm font-bold tracking-wider text-[#161514] uppercase">
              THE OMNITRACKER
            </span>
            <span className="text-[10px] font-mono font-black text-[#161514] ml-0.5">v1.3</span>
          </div>
        </div>
      )}
    </div>
  );
}
