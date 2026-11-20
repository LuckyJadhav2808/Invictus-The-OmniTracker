"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import {
  useMascotStore,
  MASCOT_COLOR_THEMES,
  type MascotColorTheme,
  type MascotExpression,
} from "@/store/mascot-store";

export type StrobiState = "idle" | "focus" | "fire" | "celebrate" | "sleep";
export type StrobiGear = "gladiator" | "fitness" | "tasks" | "study" | "money" | "none";
type TransientReaction = "wink" | "salute" | "cheer" | null;

export interface StrobiCompanionProps {
  state?: StrobiState;
  gear?: StrobiGear;
  size?: number; // Default 48px
  className?: string;
  streakDays?: number;
  onClick?: () => void;
  title?: string;
  showAura?: boolean;
  colorTheme?: MascotColorTheme;
  expression?: MascotExpression;
  showGear?: boolean;
}

const STROBI_QUIPS = [
  "Discipline beats motivation every single day.",
  "Your streak is your foundation. Keep it going!",
  "One focus block at a time. Steady progress.",
  "A productive day begins with one checked habit.",
  "Start early and set the tone for the day.",
  "Consistency is your superpower. Keep moving forward.",
  "Small daily actions compound into lasting results.",
];

/**
 * 🌟 Strobi Universal 3D Companion Avatar (Not in a box!)
 * Parametric 3D-shaded sphere character derived from Strobi archetype.
 * Features:
 * - Free-standing 3D sphere with volumetric radial shading, specular gloss, and floor bounce lighting
 * - Organic diffused ground contact shadow (no square wrapper box)
 * - Autonomous procedural eye blink & glance timers
 * - State engine: 'idle' | 'focus' | 'fire' | 'celebrate' | 'sleep'
 * - Gear archetypes: 'gladiator' (Today) | 'fitness' (Habits) | 'study' (Study) | 'money' (Cashflow) | 'tasks' (Tasks)
 * - Tactile Emil Kowalski spring bounce on click + 8-bit bot synth audio + haptics
 */
export function StrobiCompanion({
  state = "idle",
  gear = "gladiator",
  size = 48,
  className = "",
  streakDays = 0,
  onClick,
  title,
  showAura = true,
  colorTheme: propColorTheme,
  expression: propExpression,
  showGear = true,
}: StrobiCompanionProps) {
  const storeColorTheme = useMascotStore((s) => s.colorTheme);
  const storeExpression = useMascotStore((s) => s.expression);
  const activeColorTheme = propColorTheme || storeColorTheme || "classic-blue";
  const configuredExpression = propExpression || storeExpression || "joy";
  const themeConfig = MASCOT_COLOR_THEMES[activeColorTheme] || MASCOT_COLOR_THEMES["classic-blue"];

  // Unique SVG IDs per component instance to avoid DOM collisions
  const reactId = React.useId();
  const uid = reactId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const groundBlurId = `strobiGroundBlur_${uid}`;
  const customGradId = `strobi3DCustom_${uid}`;
  const celebrateGradId = `strobi3DCelebrate_${uid}`;
  const fireGradId = `strobi3DFire_${uid}`;
  const specularGradId = `strobiSpecular_${uid}`;
  const bounceGradId = `strobiBounceGrad_${uid}`;

  const [quipIndex, setQuipIndex] = useState(0);
  const [transientReaction, setTransientReaction] = useState<TransientReaction>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [glanceOffset, setGlanceOffset] = useState<number>(0);
  const [isBouncing, setIsBouncing] = useState(false);
  const reactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Autonomous Procedural Blink & Glance Timers
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    let glanceTimeout: NodeJS.Timeout;

    const scheduleNextBlink = () => {
      const delay = Math.floor(Math.random() * 3200) + 2600; // 2.6s to 5.8s
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 130);
      }, delay);
    };

    const scheduleNextGlance = () => {
      const delay = Math.floor(Math.random() * 4200) + 3000;
      glanceTimeout = setTimeout(() => {
        const roll = Math.random();
        if (roll < 0.35) {
          setGlanceOffset(-2); // Glance left toward content
        } else if (roll < 0.7) {
          setGlanceOffset(2); // Glance right toward actions
        } else {
          setGlanceOffset(0); // Center focus
        }
        setTimeout(() => {
          setGlanceOffset(0);
          scheduleNextGlance();
        }, 1100);
      }, delay);
    };

    scheduleNextBlink();
    scheduleNextGlance();

    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(glanceTimeout);
    };
  }, []);

  // 2. Interactive Tactile Click Handler
  const handleStrobiClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Tactile Audio Feedback
    const soundVariant = quipIndex % 3 === 0 ? "salute" : quipIndex % 2 === 0 ? "happy" : "curious";
    soundFX.playBotChirp(soundVariant);
    soundFX.vibrate(25);

    // Spring Bounce Physics
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 320);

    // Transient Reaction Machine
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    const reactions: TransientReaction[] = ["wink", "salute", "cheer"];
    const chosenReaction = reactions[quipIndex % reactions.length];
    setTransientReaction(chosenReaction);

    reactionTimerRef.current = setTimeout(() => {
      setTransientReaction(null);
    }, 1200);

    setQuipIndex((prev) => prev + 1);

    if (onClick) {
      onClick();
    } else {
      const quip = STROBI_QUIPS[quipIndex % STROBI_QUIPS.length];
      toast("✨ Strobi: " + quip, {
        duration: 2600,
      });
    }
  };

  const effectiveExpression = transientReaction || state;
  const isCelebratory = effectiveExpression === "celebrate" || effectiveExpression === "cheer";
  const isFiery = effectiveExpression === "fire" || streakDays >= 3;
  const isSleeping = effectiveExpression === "sleep";
  const isFocused = effectiveExpression === "focus";
  const isWinking = effectiveExpression === "wink";

  const defaultTitle =
    gear === "fitness"
      ? "Strobi (Click for New Habit)"
      : gear === "tasks"
      ? "Strobi (Click for New Task)"
      : gear === "study"
      ? "Strobi (Click for Study Focus)"
      : gear === "money"
      ? "Strobi (Click to Log Expense)"
      : "Strobi (Click to Chat)";

  return (
    <button
      type="button"
      onClick={handleStrobiClick}
      title={title || defaultTitle}
      aria-label={title || defaultTitle}
      className={cn(
        "relative inline-flex items-center justify-center p-0 bg-transparent border-0 outline-none focus:outline-none cursor-pointer shrink-0 select-none group transition-transform duration-200",
        isBouncing && "scale-110 -translate-y-1",
        className
      )}
      style={{
        width: size,
        height: size,
        background: "transparent",
        border: "none",
        boxShadow: "none",
      }}
    >
      {/* 🌟 Subtle Ambient Energy Glow (Only on Celebratory or Fiery Streak) */}
      {showAura && isCelebratory && (
        <span className="absolute inset-0 rounded-full bg-[#CEF431]/25 blur-sm animate-pulse pointer-events-none" />
      )}
      {showAura && isFiery && (
        <span className="absolute inset-0 rounded-full bg-amber-500/20 blur-sm animate-pulse pointer-events-none" />
      )}

      {/* 100x100 3D Parametric Strobi Vector Canvas */}
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        className="size-full overflow-visible pointer-events-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Ground Shadow Filter */}
          <filter id={groundBlurId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>

          {/* Dynamic User-Customized 3D Gradient (Defaults to Electric Blue) */}
          <radialGradient
            id={customGradId}
            cx="34%"
            cy="28%"
            r="68%"
            fx="30%"
            fy="24%"
          >
            <stop offset="0%" stopColor={themeConfig.stops[0]} />
            <stop offset="18%" stopColor={themeConfig.stops[1]} />
            <stop offset="50%" stopColor={themeConfig.stops[2]} />
            <stop offset="78%" stopColor={themeConfig.stops[3]} />
            <stop offset="100%" stopColor={themeConfig.stops[4]} />
          </radialGradient>

          {/* Celebratory Emerald-Lime Tinted 3D Gradient */}
          <radialGradient
            id={celebrateGradId}
            cx="34%"
            cy="28%"
            r="68%"
            fx="30%"
            fy="24%"
          >
            <stop offset="0%" stopColor="#BAF7D0" />
            <stop offset="25%" stopColor="#6EE7B7" />
            <stop offset="55%" stopColor="#10B981" />
            <stop offset="85%" stopColor="#047857" />
            <stop offset="100%" stopColor="#064E3B" />
          </radialGradient>

          {/* Fiery Golden 3D Shading */}
          <radialGradient
            id={fireGradId}
            cx="34%"
            cy="28%"
            r="68%"
            fx="30%"
            fy="24%"
          >
            <stop offset="0%" stopColor="#FED7AA" />
            <stop offset="25%" stopColor="#FBBF24" />
            <stop offset="60%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </radialGradient>

          {/* Specular Soft Glow Gradient */}
          <linearGradient id={specularGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Ambient Floor Bounce Light Gradient */}
          <linearGradient id={bounceGradId} x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#A0C0FF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#A0C0FF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Organic Diffuse Ground Contact Shadow (Resting in 3D Space) */}
        <ellipse
          cx="50"
          cy="87.5"
          rx={isBouncing ? 28 : 24}
          ry="6"
          fill="#161514"
          opacity="0.22"
          filter={`url(#${groundBlurId})`}
        />
        <ellipse
          cx="50"
          cy="87"
          rx={isBouncing ? 16 : 13}
          ry="3"
          fill="#161514"
          opacity="0.32"
        />

        {/* 2. Primary 3D Spherical Body (r=34 at cx=50, cy=49) */}
        <g className="transition-transform duration-300">
          <circle
            cx="50"
            cy="49"
            r="34"
            fill={`url(#${customGradId})`}
            stroke="#161514"
            strokeWidth="2.2"
          />

          {/* Subtle Celebration / Fiery Shimmer (preserving iconic blue core) */}
          {isCelebratory && (
            <circle
              cx="50"
              cy="49"
              r="34"
              fill={`url(#${celebrateGradId})`}
              opacity="0.28"
            />
          )}
          {isFiery && (
            <circle
              cx="50"
              cy="49"
              r="34"
              fill={`url(#${fireGradId})`}
              opacity="0.32"
            />
          )}

          {/* 3. Ambient Floor Bounce Light (Curved Lower Rim) */}
          <path
            d="M 26 66 A 34 34 0 0 0 74 66 A 32 32 0 0 1 26 66"
            fill={`url(#${bounceGradId})`}
          />

          {/* 4. Glossy Specular Highlight (Apple / Pixar 3D Depth) */}
          <ellipse
            cx="38"
            cy="31"
            rx="11"
            ry="6"
            transform="rotate(-32 38 31)"
            fill={`url(#${specularGradId})`}
          />
          {/* Crisp Pin-Point Core Catchlight */}
          <circle cx="34" cy="27" r="2.2" fill="#FFFFFF" opacity="0.9" />

          {/* === 5. 3D MODULAR HEADGEAR & ACCESSORIES === */}
          {showGear && gear !== "none" && (
            <>
              {gear === "tasks" ? (
                /* TASKS: 3D Cyber Sensor Antenna */
                <g>
                  <line x1="50" y1="16" x2="50" y2="5" stroke="#161514" strokeWidth="2.4" strokeLinecap="round" />
                  <circle cx="50" cy="5" r="4.2" fill="#F59E0B" stroke="#161514" strokeWidth="1.8" />
                  <circle cx="51.5" cy="3.5" r="1.2" fill="#FFFFFF" />
                  <rect x="44" y="14" width="12" height="3.5" rx="1.5" fill="#E2E8F0" stroke="#161514" strokeWidth="1.8" />
                </g>
              ) : gear === "study" ? (
                /* STUDY: 3D Scholar Mortarboard Cap */
                <g>
                  <polygon
                    points="50,2 72,9.5 50,17 28,9.5"
                    fill="#1E1B4B"
                    stroke="#161514"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                  />
                  <rect x="40" y="15" width="20" height="4" rx="1.5" fill="#312E81" stroke="#161514" strokeWidth="2" />
                  <circle cx="50" cy="9.5" r="1.8" fill="#F59E0B" stroke="#161514" strokeWidth="1" />
                  <path d="M50 9.5 C 57 9.5, 62 13, 61 19" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                </g>
              ) : gear === "money" ? (
                /* MONEY: 3D Emerald Banker Visor with Golden Pip */
                <g>
                  <path
                    d="M 26 27 C 36 18, 64 18, 74 27 L 70 30 C 62 23, 38 23, 30 30 Z"
                    fill="#059669"
                    stroke="#161514"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <circle cx="50" cy="16" r="3.6" fill="#F59E0B" stroke="#161514" strokeWidth="1.8" />
                  <line x1="50" y1="14" x2="50" y2="18" stroke="#161514" strokeWidth="1.2" strokeLinecap="round" />
                </g>
              ) : gear === "fitness" ? (
                /* FITNESS: 3D Curved Sweatband wrapped around forehead */
                <g>
                  <path
                    d="M 23 37 C 38 26, 62 26, 77 37 L 75 43 C 61 32, 39 32, 25 43 Z"
                    fill="#E11D48"
                    stroke="#161514"
                    strokeWidth="2.2"
                  />
                  <path d="M 28 39 C 39 30, 61 30, 72 39" stroke="#FFFFFF" strokeWidth="1.4" fill="none" />
                  {isFiery && (
                    <path
                      d="M 50 3 C 45 11, 55 14, 50 22 C 58 15, 59 10, 50 3 Z"
                      fill="#F59E0B"
                      stroke="#161514"
                      strokeWidth="1.8"
                      className="animate-pulse"
                    />
                  )}
                </g>
              ) : (
                /* GLADIATOR (Today / Default): 3D Golden Victory Laurel Crest */
                <g>
                  {isFiery ? (
                    <g className="animate-pulse">
                      <path
                        d="M42 22C36 11 46 2 50 1C54 6 64 11 58 22Z"
                        fill="#FF4343"
                        stroke="#161514"
                        strokeWidth="2.4"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M46 22C43 14 49 8 50 6C52 10 57 14 54 22Z"
                        fill="#FFB800"
                        stroke="#161514"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                    </g>
                  ) : (
                    <g>
                      <circle cx="50" cy="15" r="3.8" fill="#CEF431" stroke="#161514" strokeWidth="2" />
                      <circle cx="51.2" cy="13.8" r="1.1" fill="#FFFFFF" />
                      <path d="M 44 16 L 50 11.5 L 56 16" stroke="#161514" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                    </g>
                  )}
                </g>
              )}
            </>
          )}

          {/* === 6. 3D FACIAL EXPRESSIONS (Eyes & Twinkle from JSON #111316) === */}
          <g transform={`translate(${glanceOffset}, 0)`} className="transition-transform duration-200">
            {isSleeping ? (
              /* Sleeping: Peaceful Curved Lashes */
              <g>
                <path d="M 39 49 Q 44 53 49 49" stroke="#111316" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M 53 49 Q 58 53 63 49" stroke="#111316" strokeWidth="3" strokeLinecap="round" fill="none" />
                <text x="68" y="34" fill="#818CF8" fontSize="11" fontWeight="900" fontFamily="monospace">Z</text>
                <text x="75" y="27" fill="#818CF8" fontSize="8" fontWeight="900" fontFamily="monospace">z</text>
              </g>
            ) : isCelebratory ? (
              /* Celebratory: Joyous Cheerful Arcs + Rosy Cheeks */
              <g>
                <path d="M 38 50 Q 43 43 48 50" stroke="#111316" strokeWidth="3.4" strokeLinecap="round" fill="none" />
                <path d="M 54 50 Q 59 43 64 50" stroke="#111316" strokeWidth="3.4" strokeLinecap="round" fill="none" />
                {/* Cheerful Glowing Cheeks */}
                <ellipse cx="34" cy="54" rx="4.5" ry="2.6" fill="#CEF431" opacity="0.9" />
                <ellipse cx="68" cy="54" rx="4.5" ry="2.6" fill="#CEF431" opacity="0.9" />
                {/* Happy Mouth */}
                <path d="M 46 56 Q 51 60 56 56" stroke="#111316" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                {/* Sparkle Star */}
                <path d="M 72 32 L 73.5 36 L 77.5 37.5 L 73.5 39 L 72 43 L 70.5 39 L 66.5 37.5 L 70.5 36 Z" fill="#CEF431" />
              </g>
            ) : isBlinking ? (
              /* Blinking: Quick Flat Slits */
              <g>
                <line x1="39" y1="48.5" x2="47" y2="48.5" stroke="#111316" strokeWidth="3.2" strokeLinecap="round" />
                <line x1="55" y1="48.5" x2="63" y2="48.5" stroke="#111316" strokeWidth="3.2" strokeLinecap="round" />
              </g>
            ) : isWinking || configuredExpression === "wink" ? (
              /* Winking: One Wink Chevron, One Glossy Eye */
              <g>
                <path d="M 38 46 L 43 49.5 L 38 53" stroke="#111316" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <ellipse cx="58" cy="48.5" rx="4.2" ry="4.5" fill="#111316" />
                <circle cx="56.6" cy="46.8" r="1.5" fill="#FFFFFF" />
                <path d="M 46 57 Q 50 60 54 57" stroke="#111316" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              </g>
            ) : configuredExpression === "shades" ? (
              /* Retro Obsidian Sunglasses */
              <g>
                <rect x="33" y="42" width="15" height="12" rx="3" fill="#111316" stroke="#161514" strokeWidth="1.2" />
                <rect x="52" y="42" width="15" height="12" rx="3" fill="#111316" stroke="#161514" strokeWidth="1.2" />
                <line x1="48" y1="46" x2="52" y2="46" stroke="#111316" strokeWidth="2.5" />
                <line x1="36" y1="44" x2="43" y2="52" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.8" strokeLinecap="round" />
                <line x1="55" y1="44" x2="62" y2="52" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.8" strokeLinecap="round" />
                <path d="M 46 58 Q 50 61 54 58" stroke="#111316" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              </g>
            ) : configuredExpression === "zen" ? (
              /* Zen: Calm Peaceful Curved Eyes */
              <g>
                <path d="M 39 49 Q 44 54 49 49" stroke="#111316" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                <path d="M 51 49 Q 56 54 61 49" stroke="#111316" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                <path d="M 47 57 Q 50 59.5 53 57" stroke="#111316" strokeWidth="2" strokeLinecap="round" fill="none" />
              </g>
            ) : configuredExpression === "fire" ? (
              /* Fire: Determined Flame Brows + Sharp Obsidian Eyes */
              <g>
                <path d="M 38 43 L 49 46" stroke="#111316" strokeWidth="2.8" strokeLinecap="round" />
                <path d="M 62 43 L 51 46" stroke="#111316" strokeWidth="2.8" strokeLinecap="round" />
                <ellipse cx="43" cy="49" rx="4" ry="4.5" fill="#111316" />
                <circle cx="42" cy="47.5" r="1.4" fill="#FFFFFF" />
                <ellipse cx="57" cy="49" rx="4" ry="4.5" fill="#111316" />
                <circle cx="56" cy="47.5" r="1.4" fill="#FFFFFF" />
                <path d="M 46 57 Q 50 60 54 57" stroke="#111316" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              </g>
            ) : configuredExpression === "scholar" || isFocused ? (
              /* Scholar / Focused: Round Spectacles */
              <g>
                <circle cx="43" cy="48" r="6" stroke="#111316" strokeWidth="2" fill="rgba(255,255,255,0.25)" />
                <circle cx="57" cy="48" r="6" stroke="#111316" strokeWidth="2" fill="rgba(255,255,255,0.25)" />
                <line x1="49" y1="48" x2="51" y2="48" stroke="#111316" strokeWidth="2.2" />
                <circle cx="43" cy="48" r="3" fill="#111316" />
                <circle cx="42" cy="46.8" r="1.1" fill="#FFFFFF" />
                <circle cx="57" cy="48" r="3" fill="#111316" />
                <circle cx="56" cy="46.8" r="1.1" fill="#FFFFFF" />
                <path d="M 47 57 Q 50 59.5 53 57" stroke="#111316" strokeWidth="2" strokeLinecap="round" fill="none" />
              </g>
            ) : (
              /* Standard Ambient Joy: Iconic Glossy Obsidian Spheres with 3D Specular Twinkle & Smile */
              <g>
                {/* Left Eye */}
                <ellipse cx="43" cy="48" rx="4.2" ry="4.6" fill="#111316" />
                <circle cx="41.6" cy="46.2" r="1.5" fill="#FFFFFF" />
                <circle cx="44.2" cy="49.5" r="0.9" fill="#9DB9FF" opacity="0.6" />

                {/* Right Eye */}
                <ellipse cx="59" cy="48" rx="4.2" ry="4.6" fill="#111316" />
                <circle cx="57.6" cy="46.2" r="1.5" fill="#FFFFFF" />
                <circle cx="60.2" cy="49.5" r="0.9" fill="#9DB9FF" opacity="0.6" />

                {/* Warm Friendly Smile */}
                <path
                  d="M 46 56.5 Q 50 60 54 56.5"
                  stroke="#111316"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            )}

            {/* Subtle Happy Mouth Curve (when cheering/celebrating) */}
            {isCelebratory && !isSleeping && (
              <path
                d="M 46 56 Q 51 59.5 56 56"
                stroke="#111316"
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
              />
            )}
          </g>
        </g>
      </svg>
    </button>
  );
}
