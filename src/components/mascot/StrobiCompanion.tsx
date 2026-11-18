"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

export type StrobiState = "idle" | "focus" | "fire" | "celebrate" | "sleep";
export type StrobiGear = "gladiator" | "fitness" | "tasks" | "study" | "money";
type TransientReaction = "wink" | "salute" | "cheer" | null;

export interface StrobiCompanionProps {
  state?: StrobiState;
  gear?: StrobiGear;
  size?: number; // Default 42px
  className?: string;
  streakDays?: number;
  onClick?: () => void;
  title?: string;
  showAura?: boolean;
}

const STROBI_QUIPS = [
  "Discipline beats motivation every single day.",
  "Your streak is your fortress. Defend it!",
  "One focus block at a time. Total conquest.",
  "An unconquered day begins with one checked habit.",
  "Armor up! Victory is won in the morning.",
  "Momentum is your greatest weapon. Keep swinging!",
  "Small daily reps turn discipline into identity.",
];

/**
 * 🌟 Strobi Universal Companion Avatar
 * Parametric 3D-shaded vector blob companion derived from Strobi archetype.
 * Features:
 * - 64x64 Neobrutalist vector SVG with depth highlights and ambient drop shadow
 * - Autonomous procedural eye blink & glance timers (eyes glance left/right)
 * - State engine: 'idle' | 'focus' | 'fire' | 'celebrate' | 'sleep'
 * - Gear archetypes: 'gladiator' (Today) | 'fitness' (Habits) | 'study' (Study) | 'money' (Cashflow) | 'tasks' (Tasks)
 * - Tactile Emil Kowalski spring bounce on click + 8-bit bot synth audio + haptics
 */
export function StrobiCompanion({
  state = "idle",
  gear = "gladiator",
  size = 42,
  className = "",
  streakDays = 0,
  onClick,
  title,
  showAura = true,
}: StrobiCompanionProps) {
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
          setGlanceOffset(-1.8); // Glance left toward task list
        } else if (roll < 0.7) {
          setGlanceOffset(1.8); // Glance right toward actions
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
        description: "Your Loyal Productivity Companion",
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
      ? "Strobi: Fitness Companion (Click for New Habit)"
      : gear === "tasks"
      ? "Strobi: Taskmaster Companion (Click for New Task)"
      : gear === "study"
      ? "Strobi: Scholar Companion (Click for Focus Session)"
      : gear === "money"
      ? "Strobi: Wealth Guardian (Click to Log Expense)"
      : "Strobi: Gladiator Companion (Click for Motivation)";

  return (
    <button
      type="button"
      onClick={handleStrobiClick}
      title={title || defaultTitle}
      aria-label={title || defaultTitle}
      className={cn(
        "relative inline-flex items-center justify-center p-1 bg-white dark:bg-[#1E1B18] border-2 border-[#161514] rounded-2xl shadow-[2.5px_2.5px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_#000000] hover:bg-[#FAF8F5] dark:hover:bg-[#25221F] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 cursor-pointer shrink-0 select-none group",
        isBouncing && "scale-105",
        className
      )}
      style={{
        width: size,
        height: size,
        transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      {/* 🌟 Pulsing Aura for Celebratory & Fire States */}
      {showAura && isCelebratory && (
        <span className="absolute -inset-1 rounded-2xl bg-[#CEF431]/30 blur-xs animate-pulse pointer-events-none" />
      )}
      {showAura && isFiery && (
        <span className="absolute -inset-1 rounded-2xl bg-amber-500/25 blur-xs animate-pulse pointer-events-none" />
      )}

      {/* 64x64 Strobi Vector Canvas */}
      <svg
        viewBox="0 0 64 64"
        width="100%"
        height="100%"
        className="size-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Strobi Signature 3D Shading Radial Gradient */}
          <radialGradient
            id="strobiBodyGrad"
            cx="36%"
            cy="32%"
            r="64%"
            fx="32%"
            fy="28%"
          >
            <stop offset="0%" stopColor="#7C9BF5" />
            <stop offset="55%" stopColor="#5B7FE5" />
            <stop offset="100%" stopColor="#3A5EC9" />
          </radialGradient>

          {/* Celebratory Emerald-Lime Tint Gradient */}
          <radialGradient
            id="strobiCelebratoryGrad"
            cx="36%"
            cy="32%"
            r="64%"
            fx="32%"
            fy="28%"
          >
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="60%" stopColor="#5B7FE5" />
            <stop offset="100%" stopColor="#047857" />
          </radialGradient>

          {/* Golden Fire Shading */}
          <radialGradient
            id="strobiFireGrad"
            cx="36%"
            cy="32%"
            r="64%"
            fx="32%"
            fy="28%"
          >
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="65%" stopColor="#5B7FE5" />
            <stop offset="100%" stopColor="#B45309" />
          </radialGradient>
        </defs>

        {/* 1. Ground Drop Shadow (Breathes with avatar) */}
        <ellipse
          cx="32"
          cy="57.5"
          rx={isBouncing ? 15 : 12.5}
          ry="3"
          fill="#161514"
          opacity="0.18"
          className="transition-all duration-300"
        />

        {/* 2. Primary Spherical Body (240x240 sphere normalized to 40x40 at cx=32, cy=35) */}
        <circle
          cx="32"
          cy="34.5"
          r="19.5"
          fill={
            isCelebratory
              ? "url(#strobiCelebratoryGrad)"
              : isFiery
              ? "url(#strobiFireGrad)"
              : "url(#strobiBodyGrad)"
          }
          stroke="#161514"
          strokeWidth="2.4"
        />

        {/* 3. Specular Light Curve (Apple HIG Depth Reflection) */}
        <path
          d="M 21 24 A 13 13 0 0 1 34 17"
          stroke="rgba(255, 255, 255, 0.55)"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />

        {/* === 4. MODULAR HEADGEAR & ACCESSORIES === */}
        {gear === "tasks" ? (
          /* TASKS: Cyber Sensor Antenna with Golden Orb */
          <g>
            <line x1="32" y1="15" x2="32" y2="5" stroke="#161514" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="32" cy="5" r="3.2" fill="#F59E0B" stroke="#161514" strokeWidth="1.6" />
            <circle cx="33" cy="4" r="0.8" fill="#FFFFFF" />
            <rect x="28" y="14" width="8" height="2.5" rx="1" fill="#E2E8F0" stroke="#161514" strokeWidth="1.4" />
          </g>
        ) : gear === "study" ? (
          /* STUDY: Scholar Academic Mortarboard Cap */
          <g>
            <polygon
              points="32,4 47,9.5 32,15 17,9.5"
              fill="#1E1B4B"
              stroke="#161514"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <rect x="25" y="14" width="14" height="3" rx="1" fill="#312E81" stroke="#161514" strokeWidth="1.6" />
            <circle cx="32" cy="9.5" r="1.3" fill="#F59E0B" stroke="#161514" strokeWidth="0.8" />
            <path d="M32 9.5 C 37 9.5, 41 12, 40 16" stroke="#F59E0B" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          </g>
        ) : gear === "money" ? (
          /* MONEY: Emerald Banker Visor with Golden Pip */
          <g>
            <path
              d="M 17 18 C 23 12, 41 12, 47 18 L 44 20 C 39 16, 25 16, 20 20 Z"
              fill="#059669"
              stroke="#161514"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="9" r="2.8" fill="#F59E0B" stroke="#161514" strokeWidth="1.4" />
            <line x1="32" y1="7.5" x2="32" y2="10.5" stroke="#161514" strokeWidth="1" strokeLinecap="round" />
          </g>
        ) : gear === "fitness" ? (
          /* FITNESS: Crimson Sweatband with White Competition Stripes */
          <g>
            <rect x="18" y="19" width="28" height="4.5" rx="2" fill="#E11D48" stroke="#161514" strokeWidth="1.8" />
            <line x1="22" y1="19" x2="22" y2="23.5" stroke="#FFFFFF" strokeWidth="1.4" />
            <line x1="42" y1="19" x2="42" y2="23.5" stroke="#FFFFFF" strokeWidth="1.4" />
            {isFiery && (
              <path
                d="M 32 5 C 29 11, 35 13, 32 19 C 37 14, 38 10, 32 5 Z"
                fill="#F59E0B"
                stroke="#161514"
                strokeWidth="1.4"
                className="animate-pulse"
              />
            )}
          </g>
        ) : (
          /* GLADIATOR (Today / Default): Golden Champion Laurel or Mohawk Crest */
          <g>
            {isFiery ? (
              <g className="animate-pulse">
                <path
                  d="M26 15C22 7 29 1 32 0C35 4 42 7 38 15Z"
                  fill="#FF4343"
                  stroke="#161514"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M29 15C27 10 31 6 32 4C34 7 37 10 35 15Z"
                  fill="#FFB800"
                  stroke="#161514"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </g>
            ) : (
              <g>
                <circle cx="32" cy="11" r="2.8" fill="#CEF431" stroke="#161514" strokeWidth="1.6" />
                <path d="M 28 11.5 L 32 8 L 36 11.5" stroke="#161514" strokeWidth="1.2" fill="none" />
              </g>
            )}
          </g>
        )}

        {/* === 5. FACIAL EXPRESSIONS (JSON: eyes gap, shiftY, dynamic states) === */}
        <g transform={`translate(${glanceOffset}, 0)`} className="transition-transform duration-200">
          {isSleeping ? (
            /* Sleeping: Calm Resting Curved Lines */
            <g>
              <path d="M 24 35 Q 27 37.5 30 35" stroke="#111316" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M 34 35 Q 37 37.5 40 35" stroke="#111316" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <text x="44" y="24" fill="#818CF8" fontSize="8" fontWeight="bold" fontFamily="monospace">Z</text>
              <text x="49" y="19" fill="#818CF8" fontSize="6" fontWeight="bold" fontFamily="monospace">z</text>
            </g>
          ) : isCelebratory ? (
            /* Celebratory: Happy Arcs + Cheeks */
            <g>
              <path d="M 24 36 Q 27 32 30 36" stroke="#111316" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 34 36 Q 37 32 40 36" stroke="#111316" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Joyous Cheeks */}
              <circle cx="21.5" cy="38" r="2.4" fill="#CEF431" opacity="0.9" />
              <circle cx="42.5" cy="38" r="2.4" fill="#CEF431" opacity="0.9" />
              {/* Confetti Star */}
              <path d="M 46 22 L 47 25 L 50 26 L 47 27 L 46 30 L 45 27 L 42 26 L 45 25 Z" fill="#CEF431" />
            </g>
          ) : isBlinking ? (
            /* Blinking: Flat Quick Blink Slits */
            <g>
              <line x1="24.5" y1="34.5" x2="29.5" y2="34.5" stroke="#111316" strokeWidth="2.4" strokeLinecap="round" />
              <line x1="34.5" y1="34.5" x2="39.5" y2="34.5" stroke="#111316" strokeWidth="2.4" strokeLinecap="round" />
            </g>
          ) : isWinking ? (
            /* Winking: One Wink Chevron, One Open Eye */
            <g>
              <path d="M 24 33 L 27 35.5 L 24 38" stroke="#111316" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="37" cy="34.5" r="2.8" fill="#111316" />
              <circle cx="36.2" cy="33.6" r="0.9" fill="#FFFFFF" />
            </g>
          ) : isFocused ? (
            /* Focused: Scholar Glasses with Bead Eyes */
            <g>
              <circle cx="27" cy="34.5" r="4.5" stroke="#F59E0B" strokeWidth="1.6" fill="rgba(255,255,255,0.25)" />
              <circle cx="37" cy="34.5" r="4.5" stroke="#F59E0B" strokeWidth="1.6" fill="rgba(255,255,255,0.25)" />
              <line x1="31.5" y1="34.5" x2="32.5" y2="34.5" stroke="#F59E0B" strokeWidth="1.8" />
              <circle cx="27" cy="34.5" r="2" fill="#111316" />
              <circle cx="37" cy="34.5" r="2" fill="#111316" />
            </g>
          ) : (
            /* Standard Ambient Eyes: Iconic Strobi Obsidian Beads with Twinkle */
            <g>
              {/* Left Eye */}
              <circle cx="27" cy="34.5" r="2.8" fill="#111316" />
              <circle cx="26.1" cy="33.6" r="0.9" fill="#FFFFFF" />

              {/* Right Eye */}
              <circle cx="37" cy="34.5" r="2.8" fill="#111316" />
              <circle cx="36.1" cy="33.6" r="0.9" fill="#FFFFFF" />
            </g>
          )}

          {/* Subtle Happy Mouth Curve (when celebrating or cheering) */}
          {(isCelebratory || isWinking) && (
            <path
              d="M 29.5 41 Q 32 43.5 34.5 41"
              stroke="#111316"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          )}
        </g>
      </svg>
    </button>
  );
}
