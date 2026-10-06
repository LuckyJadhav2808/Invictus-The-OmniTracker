"use client";

import React, { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Trophy, Dumbbell, BookOpen, Droplets, Moon, Compass } from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";

export type HabitArchetype = "fitness" | "study" | "hydration" | "wellness" | "general";

interface HabitCompanionSpriteProps {
  iconName?: string;
  habitTitle?: string;
  isCelebrating?: boolean;
  className?: string;
  onClick?: () => void;
}

export function detectHabitArchetype(iconName: string = "", title: string = ""): HabitArchetype {
  const lower = title.toLowerCase();

  if (
    iconName === "Droplet" ||
    lower.includes("water") ||
    lower.includes("hydrate") ||
    lower.includes("drink")
  ) {
    return "hydration";
  }

  if (
    iconName === "Dumbbell" ||
    iconName === "Flame" ||
    lower.includes("gym") ||
    lower.includes("workout") ||
    lower.includes("exercise") ||
    lower.includes("run") ||
    lower.includes("step") ||
    lower.includes("walk") ||
    lower.includes("lift") ||
    lower.includes("pushup")
  ) {
    return "fitness";
  }

  if (
    iconName === "BookOpen" ||
    iconName === "Book" ||
    iconName === "Code" ||
    lower.includes("read") ||
    lower.includes("study") ||
    lower.includes("code") ||
    lower.includes("learn") ||
    lower.includes("write") ||
    lower.includes("focus")
  ) {
    return "study";
  }

  if (
    iconName === "Moon" ||
    iconName === "Heart" ||
    iconName === "Smile" ||
    lower.includes("sleep") ||
    lower.includes("meditat") ||
    lower.includes("journal") ||
    lower.includes("relax") ||
    lower.includes("bed")
  ) {
    return "wellness";
  }

  return "general";
}

const ARCHETYPE_CONFIG: Record<
  HabitArchetype,
  {
    label: string;
    badgeBg: string;
    quip: string;
    IconComponent: React.ComponentType<{ className?: string }>;
  }
> = {
  fitness: {
    label: "Iron Physicality",
    badgeBg: "bg-rose-100 text-rose-900 border-rose-900",
    quip: "Strength is forged in the arena. Lock in every rep!",
    IconComponent: Dumbbell,
  },
  study: {
    label: "Cognitive Mastery",
    badgeBg: "bg-amber-100 text-amber-900 border-amber-900",
    quip: "Knowledge compounds like interest. Defend your mind!",
    IconComponent: BookOpen,
  },
  hydration: {
    label: "Liquid Velocity",
    badgeBg: "bg-sky-100 text-sky-900 border-sky-900",
    quip: "Liquid fuel for muscular and cognitive output. Drink deep!",
    IconComponent: Droplets,
  },
  wellness: {
    label: "Deep Restoration",
    badgeBg: "bg-indigo-100 text-indigo-900 border-indigo-900",
    quip: "True warriors honor rest. Sleep fuels tomorrow's victory.",
    IconComponent: Moon,
  },
  general: {
    label: "Iron Discipline",
    badgeBg: "bg-emerald-100 text-emerald-900 border-emerald-900",
    quip: "Small daily rituals forge an unbreakable character.",
    IconComponent: Compass,
  },
};

/**
 * Ultra-Crisp State-Driven Vector Habit Companion ("Vix")
 * Features:
 * - 64x64 Neobrutalist vector SVG with zero chipped edges
 * - Archetype Gear Overhauls (fitness barbell, study scroll, water flask, zen halo)
 * - Autonomous blink & glance timers
 * - Web Audio API bot chirps and spring physics bounce on click
 */
export function HabitCompanionSprite({
  iconName = "Target",
  habitTitle = "",
  isCelebrating = false,
  className,
  onClick,
}: HabitCompanionSpriteProps) {
  const archetype = useMemo(
    () => detectHabitArchetype(iconName, habitTitle),
    [iconName, habitTitle]
  );

  const config = ARCHETYPE_CONFIG[archetype];
  const Icon = config.IconComponent;

  // Autonomous Blink & Glance Timers
  const [isBlinking, setIsBlinking] = useState(false);
  const [glanceOffset, setGlanceOffset] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);

  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    let glanceTimeout: NodeJS.Timeout;

    const scheduleNextBlink = () => {
      const delay = Math.floor(Math.random() * 3200) + 2800;
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 140);
      }, delay);
    };

    const scheduleNextGlance = () => {
      const delay = Math.floor(Math.random() * 4000) + 3000;
      glanceTimeout = setTimeout(() => {
        const roll = Math.random();
        if (roll < 0.35) {
          setGlanceOffset(-2);
        } else if (roll < 0.7) {
          setGlanceOffset(2);
        } else {
          setGlanceOffset(0);
        }
        setTimeout(() => {
          setGlanceOffset(0);
          scheduleNextGlance();
        }, 1200);
      }, delay);
    };

    scheduleNextBlink();
    scheduleNextGlance();

    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(glanceTimeout);
    };
  }, []);

  const handleSpriteClick = () => {
    soundFX.playBotChirp("happy");
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 350);
    if (onClick) onClick();
  };

  // Eye visor color based on archetype
  const visorColor =
    isCelebrating
      ? "#CEF431"
      : archetype === "fitness"
      ? "#FF4343"
      : archetype === "study"
      ? "#FFB800"
      : archetype === "hydration"
      ? "#0284C7"
      : archetype === "wellness"
      ? "#818CF8"
      : "#03D26F";

  return (
    <div
      onClick={handleSpriteClick}
      className={cn(
        "relative flex items-center gap-3 p-3 rounded-2xl border-2 border-[#161514] bg-[#FAF8F5] shadow-[3px_3px_0px_0px_#161514] select-none transition-all cursor-pointer hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1.5px_1.5px_0px_0px_#161514]",
        className
      )}
    >
      {/* 2D Sprite Character Frame */}
      <div
        className={cn(
          "relative size-14 shrink-0 rounded-xl bg-white border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center overflow-hidden transition-transform",
          isCelebrating ? "animate-bounce scale-110" : isBouncing ? "scale-105" : "hover:scale-105"
        )}
        style={{ transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        {/* 64x64 Ultra-Crisp Vector SVG */}
        <svg
          viewBox="0 0 64 64"
          className="size-12 overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* === 1. ARCHETYPE HEADGEAR === */}
          {archetype === "fitness" ? (
            <g>
              <path d="M24 15C22 6 27 2 32 2C37 2 42 6 40 15H24Z" fill="#E11D48" stroke="#161514" strokeWidth="2" strokeLinejoin="round" />
              <path d="M28 15C27 8 30 5 32 5C34 5 37 8 36 15H28Z" fill="#FFB800" />
              <rect x="25" y="13" width="14" height="3.5" rx="1" fill="#FF4343" stroke="#161514" strokeWidth="1.5" />
            </g>
          ) : archetype === "study" ? (
            <g>
              <rect x="24" y="11" width="16" height="5" rx="1.5" fill="#1E1B4B" stroke="#161514" strokeWidth="1.8" />
              <polygon points="32,2 48,8 32,13 16,8" fill="#4338CA" stroke="#161514" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="32" cy="7.5" r="1.5" fill="#FFB800" stroke="#161514" strokeWidth="1" />
              <path d="M32 7.5 C 38 7.5, 42 11, 41 15" stroke="#FFB800" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </g>
          ) : archetype === "hydration" ? (
            <g>
              {/* Droplet Plume */}
              <path d="M32 1 C28 6 24 10 24 14 C24 18 40 18 40 14 C40 10 36 6 32 1 Z" fill="#0284C7" stroke="#161514" strokeWidth="1.8" />
              <circle cx="32" cy="11" r="2" fill="#BAE6FD" />
              <rect x="26" y="13.5" width="12" height="3" rx="1" fill="#38BDF8" stroke="#161514" strokeWidth="1.5" />
            </g>
          ) : archetype === "wellness" ? (
            <g>
              {/* Zen Moon Aura Halo */}
              <path d="M24 15C22 6 27 2 32 2C37 2 42 6 40 15H24Z" fill="#818CF8" stroke="#161514" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="32" cy="5" r="2.5" fill="#E0E7FF" stroke="#161514" strokeWidth="1" />
              <rect x="26" y="13.5" width="12" height="3" rx="1" fill="#C7D2FE" stroke="#161514" strokeWidth="1.5" />
            </g>
          ) : (
            <g>
              <path d="M24 15C22 6 27 2 32 2C37 2 42 6 40 15H24Z" fill="#E11D48" stroke="#161514" strokeWidth="2" strokeLinejoin="round" />
              <path d="M28 15C27 8 30 5 32 5C34 5 37 8 36 15H28Z" fill="#FFB800" />
              <rect x="26" y="13.5" width="12" height="3" rx="1" fill="#FFB800" stroke="#161514" strokeWidth="1.5" />
            </g>
          )}

          {/* === 2. HELMET & EARS === */}
          <rect x="9" y="23" width="4.5" height="9" rx="1.5" fill="#E2E8F0" stroke="#161514" strokeWidth="1.6" />
          <rect x="50.5" y="23" width="4.5" height="9" rx="1.5" fill="#E2E8F0" stroke="#161514" strokeWidth="1.6" />

          {/* Helmet Main Shell */}
          <rect x="12" y="16" width="40" height="22" rx="4.5" fill="#FFFFFF" stroke="#161514" strokeWidth="2" />
          <circle cx="32" cy="18.5" r="1.3" fill="#CEF431" stroke="#161514" strokeWidth="0.8" />

          {/* Visor Screen */}
          <rect x="16" y="20" width="32" height="14" rx="3" fill="#161514" />
          <path d="M17.5 21.5L25 21.5L20 32.5L17.5 32.5Z" fill="white" fillOpacity="0.08" />

          {/* Eyes (With Autonomous Blinking & Glancing) */}
          {isBlinking && !isCelebrating ? (
            <g>
              <rect x="20" y="26.5" width="8" height="1.8" rx="0.9" fill={visorColor} />
              <rect x="36" y="26.5" width="8" height="1.8" rx="0.9" fill={visorColor} />
            </g>
          ) : isCelebrating ? (
            <g transform={`translate(${glanceOffset}, 0)`}>
              <path d="M20 28C22 23 26 23 28 28" stroke={visorColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M36 28C38 23 42 23 44 28" stroke={visorColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </g>
          ) : (
            <g transform={`translate(${glanceOffset}, 0)`}>
              <rect x="21" y="23.5" width="6.5" height="7.5" rx="2" fill={visorColor} />
              <rect x="22" y="24.5" width="2.2" height="2.5" rx="0.8" fill="#FFFFFF" />
              <rect x="36.5" y="23.5" width="6.5" height="7.5" rx="2" fill={visorColor} />
              <rect x="37.5" y="24.5" width="2.2" height="2.5" rx="0.8" fill="#FFFFFF" />
            </g>
          )}

          {/* Neck */}
          <rect x="28" y="37.5" width="8" height="3" rx="1" fill="#94A3B8" stroke="#161514" strokeWidth="1.5" />

          {/* Chest Plate */}
          <path d="M17 40H47L44 54H20L17 40Z" fill="#FFFFFF" stroke="#161514" strokeWidth="2" strokeLinejoin="round" />

          {/* Archetype Gear Props */}
          {archetype === "fitness" ? (
            <g>
              <path d="M29 44L33 49L37 44" stroke="#FF4343" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="5" y1="46" x2="15" y2="46" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
              <rect x="4.5" y="43" width="2.2" height="6" rx="0.5" fill="#161514" />
              <rect x="13.5" y="43" width="2.2" height="6" rx="0.5" fill="#161514" />
            </g>
          ) : archetype === "study" ? (
            <g>
              <path d="M29 44L33 49L37 44" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 40 L10 41.5 L14 40 L14 47.5 L10 49 L6 47.5 Z" fill="#F1F5F9" stroke="#161514" strokeWidth="1.5" />
              <line x1="10" y1="41.5" x2="10" y2="49" stroke="#161514" strokeWidth="1" />
            </g>
          ) : archetype === "hydration" ? (
            <g>
              <path d="M29 44L33 49L37 44" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {/* Water Flask */}
              <rect x="6.5" y="40" width="7" height="10" rx="1.5" fill="#BAE6FD" stroke="#161514" strokeWidth="1.5" />
              <rect x="8.5" y="38" width="3" height="2.5" rx="0.5" fill="#0284C7" stroke="#161514" strokeWidth="1" />
            </g>
          ) : (
            <path d="M27 43.5L32 50L37 43.5" stroke="#CEF431" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Hands */}
          <rect x="10.5" y="42" width="6" height="7" rx="2" fill="#161514" />
          <rect x="47.5" y="42" width="6" height="7" rx="2" fill="#161514" />

          {/* Boots */}
          <rect x="22" y="53.5" width="7" height="4.5" rx="1.8" fill="#161514" />
          <rect x="35" y="53.5" width="7" height="4.5" rx="1.8" fill="#161514" />
        </svg>

        {/* Celebration Particles */}
        {isCelebrating && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <Sparkles className="size-5 text-amber-500 animate-spin" />
          </div>
        )}
      </div>

      {/* Speech & Commentary Column */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              "text-[9px] font-heading font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1",
              config.badgeBg
            )}
          >
            <Icon className="size-2.5 stroke-[2.5]" />
            <span>{config.label}</span>
          </span>

          {isCelebrating && (
            <span className="text-[9px] font-heading font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#CEF431] text-[#161514] border border-[#161514] flex items-center gap-0.5 animate-pulse">
              <Trophy className="size-2.5" />
              <span>Conquest Ready!</span>
            </span>
          )}
        </div>

        <p className="text-xs font-bold text-[#161514] mt-1 leading-snug line-clamp-2">
          {isCelebrating
            ? "⚔️ Vix: Habit forged in iron! Consistency is your sharpest weapon. Let's conquer it!"
            : `⚔️ Vix: "${habitTitle ? `For '${habitTitle}': ` : ""}${config.quip}"`}
        </p>
      </div>
    </div>
  );
}
