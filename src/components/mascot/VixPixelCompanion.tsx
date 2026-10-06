'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { soundFX } from '@/components/shared/SoundFX';

export type VixPixelState = 'idle' | 'focus' | 'fire' | 'celebrate' | 'sleep';
export type VixGearType = 'gladiator' | 'fitness' | 'tasks' | 'study' | 'money';
type TransientReaction = 'wink' | 'salute' | 'cheer' | null;

interface VixPixelCompanionProps {
  state?: VixPixelState;
  gear?: VixGearType;
  size?: number; // e.g. 40, 42, 48, 56
  className?: string;
  streakDays?: number;
  onClick?: () => void;
  title?: string;
}

const TACTICAL_QUIPS = [
  'Discipline beats motivation every single day.',
  'Your streak is your fortress. Defend it!',
  'One focus block at a time. Total conquest.',
  'An unconquered day begins with one checked habit.',
  'Armor up! Victory is won in the morning.',
  'Momentum is your greatest weapon. Keep swinging!',
];

/**
 * Universal State-Driven Vector Mascot Companion ("Vix")
 * Features:
 * - Ultra-crisp 64x64 Neobrutalist vector SVG (No pixel distortion, zero chipped edges)
 * - Archetype Gear Overhauls ('gladiator', 'fitness', 'tasks', 'study', 'money')
 * - Autonomous blink & glance timers (eyes blink & look around naturally)
 * - Prioritized expression state machine (transient reactions -> live telemetry)
 * - Spring physics micro-bounces and tactile Web Audio bot chirps
 * - Direct shortcut trigger when onClick is provided
 */
export function VixPixelCompanion({
  state = 'idle',
  gear = 'gladiator',
  size = 42,
  className = '',
  streakDays = 0,
  onClick,
  title,
}: VixPixelCompanionProps) {
  const [quipIndex, setQuipIndex] = useState(0);
  const [transientReaction, setTransientReaction] = useState<TransientReaction>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [glanceOffset, setGlanceOffset] = useState<number>(0);
  const [isBouncing, setIsBouncing] = useState(false);
  const reactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Autonomous Blink & Glance Timer Engine
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    let glanceTimeout: NodeJS.Timeout;

    const scheduleNextBlink = () => {
      const delay = Math.floor(Math.random() * 3200) + 2800; // 2.8s to 6s
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
          setGlanceOffset(-2); // glance left
        } else if (roll < 0.7) {
          setGlanceOffset(2); // glance right
        } else {
          setGlanceOffset(0); // center
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

  // 2. Interactive Click Handler with Audio, Spring Physics & Shortcut/Reaction
  const handleMascotClick = () => {
    // Audio feedback: Web Audio 8-bit frequency sweep
    const soundVariant = quipIndex % 3 === 0 ? 'salute' : quipIndex % 2 === 0 ? 'happy' : 'curious';
    soundFX.playBotChirp(soundVariant);

    // Spring bounce physics trigger
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 350);

    // Transient reaction state machine (Priority 1)
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    const reactions: TransientReaction[] = ['wink', 'salute', 'cheer'];
    const chosenReaction = reactions[quipIndex % reactions.length];
    setTransientReaction(chosenReaction);

    reactionTimerRef.current = setTimeout(() => {
      setTransientReaction(null);
    }, 1200);

    setQuipIndex((prev) => prev + 1);

    // Direct Shortcut trigger or fallback tactical quip toast
    if (onClick) {
      onClick();
    } else {
      const quip = TACTICAL_QUIPS[quipIndex % TACTICAL_QUIPS.length];
      toast('⚔️ Vix: ' + quip, {
        duration: 2600,
        description: 'Gladiator Bot • Ready for battle',
      });
    }
  };

  // 3. Prioritized Expression Computation
  // Priority 1: Transient click reaction
  // Priority 2: Live workspace telemetry state
  const effectiveExpression = transientReaction || state;

  // Eye Visor Palette
  const visorColor =
    effectiveExpression === 'focus'
      ? '#FFB800'
      : effectiveExpression === 'fire'
      ? '#FF4343'
      : effectiveExpression === 'celebrate' || effectiveExpression === 'cheer'
      ? '#CEF431'
      : effectiveExpression === 'sleep'
      ? '#818CF8'
      : gear === 'money'
      ? '#10B981'
      : '#38BDF8';

  const defaultTitle =
    gear === 'fitness'
      ? 'Vix: Iron Fitness Companion (Click for New Habit)'
      : gear === 'tasks'
      ? 'Vix: Taskmaster Companion (Click for New Task)'
      : gear === 'study'
      ? 'Vix: Scholar Companion (Click for New Subject)'
      : gear === 'money'
      ? 'Vix: Banker Companion (Click to Log Transaction)'
      : 'Vix the Gladiator Bot (Click for tactical quip)';

  return (
    <button
      type="button"
      onClick={handleMascotClick}
      title={title || defaultTitle}
      aria-label={title || defaultTitle}
      className={`relative inline-flex items-center justify-center p-1 bg-white border-2 border-[#161514] rounded-xl shadow-[2px_2px_0px_#161514] hover:bg-[#FAF8F5] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 cursor-pointer shrink-0 select-none ${
        isBouncing ? 'scale-105' : 'scale-100'
      } ${className}`}
      style={{
        width: size,
        height: size,
        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* 64x64 Ultra-Crisp Vector SVG */}
      <svg
        viewBox="0 0 64 64"
        width="100%"
        height="100%"
        className="size-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* === 1. MODULAR HEADGEAR BY GEAR TYPE === */}
        {gear === 'tasks' ? (
          /* === TASKS: Cyber Antenna with Golden Sensor Orb === */
          <g>
            <line x1="32" y1="14" x2="32" y2="4" stroke="#161514" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="32" cy="4" r="3.5" fill="#F59E0B" stroke="#161514" strokeWidth="1.8" />
            <circle cx="33" cy="3" r="1" fill="#FFFFFF" />
            <rect x="27" y="13.5" width="10" height="3" rx="1" fill="#CBD5E1" stroke="#161514" strokeWidth="1.5" />
          </g>
        ) : gear === 'study' ? (
          /* === STUDY: Academic Scholar Mortarboard Cap === */
          <g>
            <rect x="24" y="11" width="16" height="5" rx="1.5" fill="#1E1B4B" stroke="#161514" strokeWidth="1.8" />
            <polygon points="32,2 48,8 32,13 16,8" fill="#4338CA" stroke="#161514" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="32" cy="7.5" r="1.5" fill="#FFB800" stroke="#161514" strokeWidth="1" />
            <path d="M32 7.5 C 38 7.5, 42 11, 41 15" stroke="#FFB800" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </g>
        ) : gear === 'money' ? (
          /* === MONEY: Emerald Banker Visor Cap === */
          <g>
            <rect x="22" y="11" width="20" height="5" rx="1.5" fill="#065F46" stroke="#161514" strokeWidth="1.8" />
            <path d="M16 14 C 22 10, 42 10, 48 14 L45 16 C 40 13, 24 13, 19 16 Z" fill="#10B981" stroke="#161514" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="32" cy="6" r="3" fill="#FFB800" stroke="#161514" strokeWidth="1.5" />
            <line x1="32" y1="4.5" x2="32" y2="7.5" stroke="#161514" strokeWidth="1" strokeLinecap="round" />
          </g>
        ) : gear === 'fitness' ? (
          /* === FITNESS: Iron Gladiator Plume with Crimson Sweatband === */
          <g>
            {state === 'fire' || effectiveExpression === 'cheer' ? (
              <g className="animate-pulse">
                <path d="M26 15C22 7 29 1 32 0C35 4 42 7 38 15Z" fill="#FF4343" stroke="#161514" strokeWidth="2" strokeLinejoin="round" />
                <path d="M29 15C27 10 31 6 32 4C34 7 37 10 35 15Z" fill="#FFB800" stroke="#161514" strokeWidth="1.2" strokeLinejoin="round" />
              </g>
            ) : (
              <g>
                <path d="M24 15C22 6 27 2 32 2C37 2 42 6 40 15H24Z" fill="#E11D48" stroke="#161514" strokeWidth="2" strokeLinejoin="round" />
                <path d="M28 15C27 8 30 5 32 5C34 5 37 8 36 15H28Z" fill="#FFB800" />
              </g>
            )}
            <rect x="25" y="13" width="14" height="3.5" rx="1" fill="#FF4343" stroke="#161514" strokeWidth="1.5" />
            <line x1="28" y1="13" x2="28" y2="16.5" stroke="#FFFFFF" strokeWidth="1.2" />
            <line x1="36" y1="13" x2="36" y2="16.5" stroke="#FFFFFF" strokeWidth="1.2" />
          </g>
        ) : (
          /* === GLADIATOR (DEFAULT): Classic Roman Red Crest Mohawk Plume === */
          <g>
            {state === 'fire' || effectiveExpression === 'cheer' ? (
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
                <circle cx="32" cy="9" r="1.5" fill="#CEF431" />
              </g>
            ) : (
              <g>
                <path
                  d="M24 15C22 6 27 2 32 2C37 2 42 6 40 15H24Z"
                  fill="#E11D48"
                  stroke="#161514"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M28 15C27 8 30 5 32 5C34 5 37 8 36 15H28Z"
                  fill="#FFB800"
                />
              </g>
            )}
            <rect
              x="26"
              y="13.5"
              width="12"
              height="3"
              rx="1"
              fill="#FFB800"
              stroke="#161514"
              strokeWidth="1.5"
            />
          </g>
        )}

        {/* === 2. HELMET & EARS === */}
        {/* Left Ear Bolt */}
        <rect
          x="9"
          y="23"
          width="4.5"
          height="9"
          rx="1.5"
          fill="#E2E8F0"
          stroke="#161514"
          strokeWidth="1.6"
        />
        <rect x="9.8" y="25" width="2" height="5" rx="0.5" fill="#94A3B8" />

        {/* Right Ear Bolt */}
        <rect
          x="50.5"
          y="23"
          width="4.5"
          height="9"
          rx="1.5"
          fill="#E2E8F0"
          stroke="#161514"
          strokeWidth="1.6"
        />
        <rect x="52.2" y="25" width="2" height="5" rx="0.5" fill="#94A3B8" />

        {/* Helmet Main Shell (Crisp Symmetrical Rounded Rect) */}
        <rect
          x="12"
          y="16"
          width="40"
          height="22"
          rx="4.5"
          fill="#FFFFFF"
          stroke="#161514"
          strokeWidth="2"
        />

        {/* Forehead Rivet / Sensor */}
        <circle cx="32" cy="18.5" r="1.3" fill="#CEF431" stroke="#161514" strokeWidth="0.8" />

        {/* === 3. DIGITAL VISOR SCREEN === */}
        <rect
          x="16"
          y="20"
          width="32"
          height="14"
          rx="3"
          fill="#161514"
        />

        {/* Visor Screen Glare / Specular highlight */}
        <path
          d="M17.5 21.5L25 21.5L20 32.5L17.5 32.5Z"
          fill="white"
          fillOpacity="0.08"
        />

        {/* === 4. VISOR EYE EXPRESSIONS === */}
        {isBlinking && effectiveExpression !== 'sleep' ? (
          /* Eyelid Blink line */
          <g>
            <rect x="20" y="26.5" width="8" height="1.8" rx="0.9" fill={visorColor} />
            <rect x="36" y="26.5" width="8" height="1.8" rx="0.9" fill={visorColor} />
          </g>
        ) : effectiveExpression === 'wink' ? (
          /* Playful Wink (Left eye arc ^, Right eye open) */
          <g transform={`translate(${glanceOffset}, 0)`}>
            <path
              d="M21 28C22.5 24.5 25.5 24.5 27 28"
              stroke={visorColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
            <rect x="37" y="23" width="6.5" height="7.5" rx="2" fill={visorColor} />
            <rect x="38" y="24" width="2.2" height="2.5" rx="0.8" fill="#FFFFFF" />
          </g>
        ) : effectiveExpression === 'focus' ? (
          /* Focus HUD Crosshairs */
          <g transform={`translate(${glanceOffset}, 0)`}>
            <circle cx="24" cy="27" r="4" stroke={visorColor} strokeWidth="1.4" fill="none" />
            <circle cx="24" cy="27" r="1.2" fill={visorColor} />
            <line x1="24" y1="21.5" x2="24" y2="32.5" stroke={visorColor} strokeWidth="1" strokeDasharray="1 1" />

            <circle cx="40" cy="27" r="4" stroke={visorColor} strokeWidth="1.4" fill="none" />
            <circle cx="40" cy="27" r="1.2" fill={visorColor} />
            <line x1="40" y1="21.5" x2="40" y2="32.5" stroke={visorColor} strokeWidth="1" strokeDasharray="1 1" />
          </g>
        ) : effectiveExpression === 'fire' ? (
          /* Fighter Angled Eyes (> <) */
          <g transform={`translate(${glanceOffset}, 0)`}>
            <path
              d="M21 24L26 27L21 30"
              stroke={visorColor}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M43 24L38 27L43 30"
              stroke={visorColor}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
        ) : effectiveExpression === 'celebrate' || effectiveExpression === 'cheer' ? (
          /* Golden Star / Happy Joy Arcs (^ ^) */
          <g transform={`translate(${glanceOffset}, 0)`}>
            <path
              d="M20 28C22 23 26 23 28 28"
              stroke={visorColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M36 28C38 23 42 23 44 28"
              stroke={visorColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="18" cy="22" r="1.3" fill="#CEF431" />
            <circle cx="46" cy="22" r="1.3" fill="#CEF431" />
          </g>
        ) : effectiveExpression === 'sleep' ? (
          /* Sleeping Resting LED lines (- -) */
          <g>
            <rect x="21" y="27" width="6.5" height="1.8" rx="0.9" fill={visorColor} />
            <rect x="36.5" y="27" width="6.5" height="1.8" rx="0.9" fill={visorColor} />
          </g>
        ) : (
          /* Idle: Friendly Glowing Cyan Eyes with Glint & Glance offset */
          <g transform={`translate(${glanceOffset}, 0)`}>
            <rect x="21" y="23.5" width="6.5" height="7.5" rx="2" fill={visorColor} />
            <rect x="22" y="24.5" width="2.2" height="2.5" rx="0.8" fill="#FFFFFF" />

            <rect x="36.5" y="23.5" width="6.5" height="7.5" rx="2" fill={visorColor} />
            <rect x="37.5" y="24.5" width="2.2" height="2.5" rx="0.8" fill="#FFFFFF" />
          </g>
        )}

        {/* === 5. CHASSIS / CHESTPLATE & ACCESSORIES === */}
        {/* Neck */}
        <rect
          x="28"
          y="37.5"
          width="8"
          height="3"
          rx="1"
          fill="#94A3B8"
          stroke="#161514"
          strokeWidth="1.5"
        />

        {/* Chest Armor (Tapered Neobrutalist White Plate) */}
        <path
          d="M17 40H47L44 54H20L17 40Z"
          fill="#FFFFFF"
          stroke="#161514"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Modular Chest Emblems & Hand Accessories by Gear */}
        {gear === 'tasks' ? (
          /* Mini Task Clipboard & Gold V */
          <g>
            <path d="M29 44L33 49L37 44" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="6" y="38" width="9" height="12" rx="1.5" fill="#FFFFFF" stroke="#161514" strokeWidth="1.5" />
            <rect x="8.5" y="36.5" width="4" height="2" rx="0.5" fill="#161514" />
            <line x1="8.5" y1="41" x2="12.5" y2="41" stroke="#03D26F" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="8.5" y1="44" x2="12.5" y2="44" stroke="#161514" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        ) : gear === 'study' ? (
          /* Scholar Book / Wisdom Tome */
          <g>
            <path d="M29 44L33 49L37 44" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 40 L10 41.5 L14 40 L14 47.5 L10 49 L6 47.5 Z" fill="#F1F5F9" stroke="#161514" strokeWidth="1.5" />
            <line x1="10" y1="41.5" x2="10" y2="49" stroke="#161514" strokeWidth="1" />
          </g>
        ) : gear === 'money' ? (
          /* Banker Golden Coin Medallion */
          <g>
            <circle cx="32" cy="46" r="4.5" fill="#FFB800" stroke="#161514" strokeWidth="1.5" />
            <path d="M30.5 44.5 H 33.5 M 32 44.5 V 47.5 M 30.5 46 H 33.5" stroke="#161514" strokeWidth="1" strokeLinecap="round" />
          </g>
        ) : gear === 'fitness' ? (
          /* Iron Dumbbell Barbell across chest */
          <g>
            <path d="M29 44L33 49L37 44" stroke="#FF4343" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="5" y1="46" x2="15" y2="46" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="4.5" y="43" width="2.2" height="6" rx="0.5" fill="#161514" />
            <rect x="13.5" y="43" width="2.2" height="6" rx="0.5" fill="#161514" />
          </g>
        ) : (
          /* Classic Invictus Signature 'V' Chest Emblem */
          <path
            d="M27 43.5L32 50L37 43.5"
            stroke="#CEF431"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Cute Hands / Fists */}
        <rect
          x="10.5"
          y="42"
          width="6"
          height="7"
          rx="2"
          fill="#161514"
        />
        <rect
          x="47.5"
          y="42"
          width="6"
          height="7"
          rx="2"
          fill="#161514"
        />

        {/* Base Boots / Feet */}
        <rect
          x="22"
          y="53.5"
          width="7"
          height="4.5"
          rx="1.8"
          fill="#161514"
        />
        <rect
          x="35"
          y="53.5"
          width="7"
          height="4.5"
          rx="1.8"
          fill="#161514"
        />
      </svg>

      {/* Streak flame dot indicator */}
      {streakDays > 0 && (
        <span className="absolute -top-1 -right-1 size-3.5 bg-[#FF4343] border border-[#161514] rounded-full flex items-center justify-center text-[7.5px] font-black text-white shadow-[0.5px_0.5px_0px_#161514]">
          {streakDays > 9 ? '9+' : streakDays}
        </span>
      )}
    </button>
  );
}
