"use client";

import { cn } from "@/lib/utils";

export type MascotType =
  | "burger-boss"
  | "cake-skates"
  | "sushi-stack"
  | "book-wizard"
  | "star-avatar";

interface PlayfulMascotProps {
  type: MascotType;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function PlayfulMascot({ type, className, size = "md" }: PlayfulMascotProps) {
  const sizeMap = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
    xl: "w-44 h-44",
  };

  const currentSize = sizeMap[size];

  switch (type) {
    case "burger-boss":
      return (
        <div className={cn("relative shrink-0 select-none", currentSize, className)}>
          {/* 🍔 BURGER BOSS: Sunglasses, Cap, White Gloves & Roller Skates */}
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[3px_3px_0px_rgba(22,21,20,1)]" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Rubber Hose Arms */}
            <path d="M 40 100 Q 20 80 15 110" stroke="#161514" strokeWidth="8" strokeLinecap="round" />
            <path d="M 160 100 Q 180 80 185 110" stroke="#161514" strokeWidth="8" strokeLinecap="round" />
            {/* White Gloves */}
            <circle cx="15" cy="110" r="10" fill="#FFFFFF" stroke="#161514" strokeWidth="4" />
            <circle cx="185" cy="110" r="10" fill="#FFFFFF" stroke="#161514" strokeWidth="4" />
            
            {/* Rubber Hose Legs */}
            <path d="M 70 145 L 60 175" stroke="#161514" strokeWidth="8" strokeLinecap="round" />
            <path d="M 130 145 L 140 175" stroke="#161514" strokeWidth="8" strokeLinecap="round" />
            {/* Roller Skates */}
            <rect x="45" y="170" width="30" height="16" rx="6" fill="#EF4444" stroke="#161514" strokeWidth="4" />
            <circle cx="52" cy="188" r="5" fill="#CEF431" stroke="#161514" strokeWidth="3" />
            <circle cx="68" cy="188" r="5" fill="#CEF431" stroke="#161514" strokeWidth="3" />
            <rect x="125" y="170" width="30" height="16" rx="6" fill="#EF4444" stroke="#161514" strokeWidth="4" />
            <circle cx="132" cy="188" r="5" fill="#CEF431" stroke="#161514" strokeWidth="3" />
            <circle cx="148" cy="188" r="5" fill="#CEF431" stroke="#161514" strokeWidth="3" />

            {/* Top Bun */}
            <path d="M 40 75 C 40 35 160 35 160 75 Z" fill="#FBBF24" stroke="#161514" strokeWidth="5" />
            {/* Sesame Seeds */}
            <ellipse cx="75" cy="50" rx="3" ry="5" fill="#FFFFFF" transform="rotate(-20 75 50)" />
            <ellipse cx="105" cy="42" rx="3" ry="5" fill="#FFFFFF" />
            <ellipse cx="135" cy="50" rx="3" ry="5" fill="#FFFFFF" transform="rotate(20 135 50)" />

            {/* Red Cap */}
            <path d="M 60 40 C 60 20 120 20 130 40 Z" fill="#EF4444" stroke="#161514" strokeWidth="4" />
            <path d="M 125 38 L 165 42" stroke="#161514" strokeWidth="5" strokeLinecap="round" />

            {/* Lettuce Layer */}
            <path d="M 35 75 Q 50 88 65 75 Q 80 88 95 75 Q 110 88 125 75 Q 140 88 165 75 Z" fill="#03D26F" stroke="#161514" strokeWidth="4" />
            {/* Cheese Melt Layer */}
            <path d="M 38 88 L 162 88 L 140 108 L 120 92 L 100 112 L 80 92 Z" fill="#CEF431" stroke="#161514" strokeWidth="4" />
            {/* Meat Patty */}
            <rect x="36" y="105" width="128" height="22" rx="10" fill="#78350F" stroke="#161514" strokeWidth="5" />
            {/* Bottom Bun */}
            <path d="M 42 127 H 158 C 158 145 42 145 42 127 Z" fill="#F59E0B" stroke="#161514" strokeWidth="5" />

            {/* Retro Sunglasses */}
            <rect x="50" y="60" width="42" height="24" rx="6" fill="#161514" />
            <rect x="108" y="60" width="42" height="24" rx="6" fill="#161514" />
            <line x1="92" y1="68" x2="108" y2="68" stroke="#161514" strokeWidth="5" />
            <line x1="55" y1="64" x2="70" y2="76" stroke="#FFFFFF" strokeWidth="3" opacity="0.8" />
            <line x1="113" y1="64" x2="128" y2="76" stroke="#FFFFFF" strokeWidth="3" opacity="0.8" />

            {/* Tongue Out Mouth */}
            <path d="M 85 92 Q 100 106 115 92 Z" fill="#161514" />
            <path d="M 94 94 Q 100 108 108 94 Z" fill="#EF4444" />
          </svg>
        </div>
      );

    case "cake-skates":
      return (
        <div className={cn("relative shrink-0 select-none", currentSize, className)}>
          {/* 🍰 ROLLER-SKATE CAKE: Slice with Frosting, Googly Eyes & Skates */}
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[3px_3px_0px_rgba(22,21,20,1)]" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Arms */}
            <path d="M 45 100 Q 25 85 20 105" stroke="#161514" strokeWidth="7" strokeLinecap="round" />
            <path d="M 155 100 Q 175 85 180 105" stroke="#161514" strokeWidth="7" strokeLinecap="round" />
            <circle cx="20" cy="105" r="9" fill="#FFFFFF" stroke="#161514" strokeWidth="3.5" />
            <circle cx="180" cy="105" r="9" fill="#FFFFFF" stroke="#161514" strokeWidth="3.5" />

            {/* Legs */}
            <path d="M 70 148 L 65 174" stroke="#161514" strokeWidth="7" strokeLinecap="round" />
            <path d="M 130 148 L 135 174" stroke="#161514" strokeWidth="7" strokeLinecap="round" />
            {/* Roller Skates */}
            <rect x="50" y="168" width="28" height="15" rx="5" fill="#CEF431" stroke="#161514" strokeWidth="3.5" />
            <circle cx="56" cy="185" r="4.5" fill="#03D26F" stroke="#161514" strokeWidth="2.5" />
            <circle cx="72" cy="185" r="4.5" fill="#03D26F" stroke="#161514" strokeWidth="2.5" />
            <rect x="122" y="168" width="28" height="15" rx="5" fill="#CEF431" stroke="#161514" strokeWidth="3.5" />
            <circle cx="128" cy="185" r="4.5" fill="#03D26F" stroke="#161514" strokeWidth="2.5" />
            <circle cx="144" cy="185" r="4.5" fill="#03D26F" stroke="#161514" strokeWidth="2.5" />

            {/* Cake Wedge Slice */}
            <path d="M 100 30 L 165 75 L 165 140 L 35 140 L 35 75 Z" fill="#FB7185" stroke="#161514" strokeWidth="5" />
            {/* Cake Sponge Layers */}
            <path d="M 35 95 L 165 95" stroke="#161514" strokeWidth="4" />
            <path d="M 35 118 L 165 118" stroke="#161514" strokeWidth="4" />
            <rect x="37" y="97" width="126" height="19" fill="#FDE68A" />

            {/* Pink Frosting Drips */}
            <path d="M 35 75 Q 45 88 55 75 Q 65 88 75 75 Q 85 88 95 75 Q 105 88 115 75 Q 125 88 135 75 Q 145 88 165 75 V 50 H 35 Z" fill="#F472B6" stroke="#161514" strokeWidth="4" />

            {/* Cherry on Top */}
            <circle cx="100" cy="22" r="14" fill="#EF4444" stroke="#161514" strokeWidth="4" />
            <path d="M 100 10 Q 115 0 120 5" stroke="#161514" strokeWidth="4" strokeLinecap="round" />

            {/* Googly Eyes */}
            <circle cx="75" cy="72" r="11" fill="#FFFFFF" stroke="#161514" strokeWidth="3" />
            <circle cx="77" cy="73" r="5" fill="#161514" />
            <circle cx="125" cy="72" r="11" fill="#FFFFFF" stroke="#161514" strokeWidth="3" />
            <circle cx="127" cy="73" r="5" fill="#161514" />

            {/* Big Smile */}
            <path d="M 85 96 Q 100 112 115 96" stroke="#161514" strokeWidth="4" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      );

    case "sushi-stack":
      return (
        <div className={cn("relative shrink-0 select-none", currentSize, className)}>
          {/* 🍣 SUSHI STACK: 3 Stacked Rolls with Chopsticks & Rubber Hose Limbs */}
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[3px_3px_0px_rgba(22,21,20,1)]" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Chopsticks in Background */}
            <line x1="30" y1="20" x2="165" y2="175" stroke="#D97706" strokeWidth="6" strokeLinecap="round" />
            <line x1="50" y1="15" x2="180" y2="160" stroke="#D97706" strokeWidth="6" strokeLinecap="round" />

            {/* Arms */}
            <path d="M 40 100 Q 20 80 15 105" stroke="#161514" strokeWidth="7" strokeLinecap="round" />
            <path d="M 160 100 Q 180 80 185 105" stroke="#161514" strokeWidth="7" strokeLinecap="round" />
            <circle cx="15" cy="105" r="8.5" fill="#FFFFFF" stroke="#161514" strokeWidth="3.5" />
            <circle cx="185" cy="105" r="8.5" fill="#FFFFFF" stroke="#161514" strokeWidth="3.5" />

            {/* Bottom Sushi Roll (Nori + Rice + Salmon) */}
            <rect x="42" y="120" width="116" height="48" rx="14" fill="#014651" stroke="#161514" strokeWidth="5" />
            <ellipse cx="100" cy="120" rx="58" ry="16" fill="#FFFFFF" stroke="#161514" strokeWidth="4" />
            <ellipse cx="100" cy="120" rx="28" ry="8" fill="#EF4444" stroke="#161514" strokeWidth="3" />

            {/* Middle Sushi Roll */}
            <rect x="52" y="75" width="96" height="42" rx="12" fill="#03D26F" stroke="#161514" strokeWidth="5" />
            <ellipse cx="100" cy="75" rx="48" ry="14" fill="#FFFFFF" stroke="#161514" strokeWidth="4" />
            <ellipse cx="100" cy="75" rx="22" ry="7" fill="#F59E0B" stroke="#161514" strokeWidth="3" />

            {/* Top Nigiri (Salmon Slab + Googly Eyes) */}
            <rect x="62" y="32" width="76" height="38" rx="12" fill="#FB7185" stroke="#161514" strokeWidth="5" />
            {/* White Salmon Stripes */}
            <path d="M 75 35 Q 85 45 95 35" stroke="#FFFFFF" strokeWidth="3.5" opacity="0.8" />
            <path d="M 105 35 Q 115 45 125 35" stroke="#FFFFFF" strokeWidth="3.5" opacity="0.8" />

            {/* Middle Roll Googly Eyes */}
            <circle cx="82" cy="98" r="8" fill="#FFFFFF" stroke="#161514" strokeWidth="2.5" />
            <circle cx="84" cy="99" r="3.5" fill="#161514" />
            <circle cx="118" cy="98" r="8" fill="#FFFFFF" stroke="#161514" strokeWidth="2.5" />
            <circle cx="120" cy="99" r="3.5" fill="#161514" />
            <path d="M 94 106 Q 100 114 106 106" stroke="#161514" strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      );

    case "book-wizard":
      return (
        <div className={cn("relative shrink-0 select-none", currentSize, className)}>
          {/* 📚 BOOK WIZARD: Open Book with Wizard Hat & Magic Sparkles */}
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[3px_3px_0px_rgba(22,21,20,1)]" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Magic Sparkles ✦ */}
            <path d="M 30 40 Q 30 55 45 55 Q 30 55 30 70 Q 30 55 15 55 Q 30 55 30 40 Z" fill="#CEF431" stroke="#161514" strokeWidth="2" />
            <path d="M 170 30 Q 170 42 182 42 Q 170 42 170 54 Q 170 42 158 42 Q 170 42 170 30 Z" fill="#CEF431" stroke="#161514" strokeWidth="2" />

            {/* Arms */}
            <path d="M 40 120 Q 20 100 15 125" stroke="#161514" strokeWidth="7" strokeLinecap="round" />
            <path d="M 160 120 Q 180 100 185 125" stroke="#161514" strokeWidth="7" strokeLinecap="round" />
            <circle cx="15" cy="125" r="8" fill="#FFFFFF" stroke="#161514" strokeWidth="3" />
            <circle cx="185" cy="125" r="8" fill="#FFFFFF" stroke="#161514" strokeWidth="3" />

            {/* Open Book Cover & Pages */}
            <path d="M 100 160 C 65 135 30 140 10 150 V 80 C 30 70 65 65 100 88 C 135 65 170 70 190 80 V 150 C 170 140 135 135 100 160 Z" fill="#014651" stroke="#161514" strokeWidth="5" />
            <path d="M 100 154 C 67 132 35 136 18 144 V 83 C 35 75 67 71 100 91 C 133 71 165 75 182 83 V 144 C 165 136 133 132 100 154 Z" fill="#FFFFFF" stroke="#161514" strokeWidth="4" />

            {/* Spine Line */}
            <line x1="100" y1="91" x2="100" y2="154" stroke="#161514" strokeWidth="4" strokeLinecap="round" />

            {/* Left Page Text Lines */}
            <line x1="30" y1="98" x2="80" y2="108" stroke="#161514" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
            <line x1="30" y1="114" x2="80" y2="124" stroke="#161514" strokeWidth="3" opacity="0.6" strokeLinecap="round" />

            {/* Right Page Text Lines */}
            <line x1="120" y1="108" x2="170" y2="98" stroke="#161514" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
            <line x1="120" y1="124" x2="170" y2="114" stroke="#161514" strokeWidth="3" opacity="0.6" strokeLinecap="round" />

            {/* Wizard Hat */}
            <path d="M 70 85 L 100 20 L 130 85 Z" fill="#6366F1" stroke="#161514" strokeWidth="4" />
            <ellipse cx="100" cy="85" rx="42" ry="10" fill="#4F46E5" stroke="#161514" strokeWidth="4" />
            <polygon points="100,45 104,55 115,55 106,62 109,72 100,66 91,72 94,62 85,55 96,55" fill="#CEF431" />

            {/* Eyes on Book Spine */}
            <circle cx="85" cy="115" r="7" fill="#161514" />
            <circle cx="87" cy="113" r="2" fill="#FFFFFF" />
            <circle cx="115" cy="115" r="7" fill="#161514" />
            <circle cx="117" cy="113" r="2" fill="#FFFFFF" />
          </svg>
        </div>
      );

    case "star-avatar":
    default:
      return (
        <div className={cn("relative shrink-0 select-none", currentSize, className)}>
          {/* 👾 STAR AVATAR: Cool Planet Star Avatar with Sunglasses & Waving Hand */}
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[3px_3px_0px_rgba(22,21,20,1)]" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Waving Arm */}
            <path d="M 150 100 Q 175 70 180 50" stroke="#161514" strokeWidth="8" strokeLinecap="round" />
            <circle cx="180" cy="50" r="10" fill="#FFFFFF" stroke="#161514" strokeWidth="4" />

            <path d="M 50 100 Q 25 110 20 130" stroke="#161514" strokeWidth="8" strokeLinecap="round" />
            <circle cx="20" cy="130" r="10" fill="#FFFFFF" stroke="#161514" strokeWidth="4" />

            {/* 5-Point Bold Star Body */}
            <path
              d="M 100 18 L 123 68 L 178 75 L 138 114 L 148 168 L 100 142 L 52 168 L 62 114 L 22 75 L 77 68 Z"
              fill="#CEF431"
              stroke="#161514"
              strokeWidth="6"
              strokeLinejoin="round"
            />

            {/* Cool Sunglasses */}
            <rect x="62" y="76" width="34" height="20" rx="5" fill="#161514" />
            <rect x="104" y="76" width="34" height="20" rx="5" fill="#161514" />
            <line x1="96" y1="84" x2="104" y2="84" stroke="#161514" strokeWidth="4" />
            <line x1="66" y1="80" x2="76" y2="90" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.8" />
            <line x1="108" y1="80" x2="118" y2="90" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.8" />

            {/* Cheerful Smile */}
            <path d="M 86 112 Q 100 126 114 112 Z" fill="#161514" />
            <path d="M 94 114 Q 100 125 106 114 Z" fill="#EF4444" />
          </svg>
        </div>
      );
  }
}
