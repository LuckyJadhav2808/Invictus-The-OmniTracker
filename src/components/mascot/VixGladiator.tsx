'use client';

import React from 'react';

export type VixState = 'idle' | 'focus' | 'fire' | 'celebrate' | 'sleep' | 'curious';

interface VixGladiatorProps {
  state?: VixState;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  onClick?: () => void;
  showStatusBadge?: boolean;
}

export function VixGladiator({
  state = 'idle',
  size = 'md',
  className = '',
  onClick,
  showStatusBadge = true,
}: VixGladiatorProps) {
  // Dimension presets
  const sizeMap = {
    sm: { width: 48, height: 56, badgeText: 'text-[9px]' },
    md: { width: 72, height: 84, badgeText: 'text-[10px]' },
    lg: { width: 104, height: 120, badgeText: 'text-[11px]' },
    hero: { width: 130, height: 150, badgeText: 'text-xs' },
  };

  const currentSize = sizeMap[size];

  // Visual status pill labels based on state
  const stateLabels: Record<VixState, { text: string; bg: string; textCol: string }> = {
    idle: { text: 'READY', bg: 'bg-[#CEF431]', textCol: 'text-[#161514]' },
    focus: { text: 'FOCUS', bg: 'bg-[#FFB800]', textCol: 'text-[#161514]' },
    fire: { text: 'ON FIRE', bg: 'bg-[#FF4343]', textCol: 'text-white' },
    celebrate: { text: 'VICTORY', bg: 'bg-[#03D26F]', textCol: 'text-[#161514]' },
    sleep: { text: 'RESTING', bg: 'bg-[#7C3AED]', textCol: 'text-white' },
    curious: { text: 'TACTICAL', bg: 'bg-[#38BDF8]', textCol: 'text-[#161514]' },
  };

  const status = stateLabels[state];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Vix the Gladiator Bot: ${status.text}`}
      className={`relative inline-flex flex-col items-center select-none group ${
        onClick ? 'cursor-pointer active:scale-95 transition-transform duration-150 ease-out' : ''
      } ${className}`}
    >
      {/* SVG Canvas for Vix */}
      <svg
        width={currentSize.width}
        height={currentSize.height}
        viewBox="0 0 120 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible drop-shadow-[2px_3px_0px_#161514]"
      >
        {/* GLADIATOR CREST / PLUME */}
        <g id="plume" className={state === 'fire' ? 'animate-pulse' : ''}>
          {state === 'fire' ? (
            /* Flame Crest */
            <>
              <path
                d="M45 28C40 12 55 4 60 0C65 5 76 10 75 28H45Z"
                fill="#FF4343"
                stroke="#161514"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path
                d="M52 28C48 18 57 12 60 7C63 11 70 15 68 28H52Z"
                fill="#FFB800"
                stroke="#161514"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="60" cy="18" r="3" fill="#CEF431" />
            </>
          ) : (
            /* Roman Gladiator Plume Bristles */
            <>
              {/* Plume Base Bracket */}
              <rect
                x="44"
                y="18"
                width="32"
                height="8"
                rx="2"
                fill="#FFB800"
                stroke="#161514"
                strokeWidth="2.5"
              />
              {/* Plume Bristle Arcs */}
              <path
                d="M40 22C38 10 46 4 60 4C74 4 82 10 80 22H40Z"
                fill="#FF4343"
                stroke="#161514"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Segmented feather cuts */}
              <line x1="48" y1="20" x2="46" y2="8" stroke="#161514" strokeWidth="2" />
              <line x1="60" y1="18" x2="60" y2="4" stroke="#161514" strokeWidth="2" />
              <line x1="72" y1="20" x2="74" y2="8" stroke="#161514" strokeWidth="2" />
            </>
          )}
        </g>

        {/* CELEBRATION LAUREL WREATH */}
        {state === 'celebrate' && (
          <g id="laurel-wreath">
            <path
              d="M24 50C20 40 26 28 36 24"
              stroke="#03D26F"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M96 50C100 40 94 28 84 24"
              stroke="#03D26F"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <polygon points="26,36 20,33 24,42" fill="#CEF431" stroke="#161514" strokeWidth="1.5" />
            <polygon points="94,36 100,33 96,42" fill="#CEF431" stroke="#161514" strokeWidth="1.5" />
            <polygon points="34,26 28,21 34,31" fill="#CEF431" stroke="#161514" strokeWidth="1.5" />
            <polygon points="86,26 92,21 86,31" fill="#CEF431" stroke="#161514" strokeWidth="1.5" />
          </g>
        )}

        {/* HEAD CHASSIS (Gladiator Helmet) */}
        <g id="helmet">
          {/* Side ear bolts / antenna */}
          <rect x="22" y="44" width="8" height="18" rx="2" fill="#D6D3D1" stroke="#161514" strokeWidth="2.5" />
          <rect x="90" y="44" width="8" height="18" rx="2" fill="#D6D3D1" stroke="#161514" strokeWidth="2.5" />

          {/* Helmet Dome */}
          <rect
            x="28"
            y="26"
            width="64"
            height="52"
            rx="8"
            fill="#FFFDF8"
            stroke="#161514"
            strokeWidth="3"
          />

          {/* Brow Band */}
          <path
            d="M28 38H92"
            stroke="#161514"
            strokeWidth="2.5"
          />
          <circle cx="34" cy="32" r="2" fill="#161514" />
          <circle cx="86" cy="32" r="2" fill="#161514" />
          <rect x="54" y="29" width="12" height="6" rx="1" fill="#CEF431" stroke="#161514" strokeWidth="1.5" />

          {/* VISOR DISPLAY SCREEN */}
          <rect
            x="34"
            y="42"
            width="52"
            height="26"
            rx="4"
            fill={state === 'sleep' ? '#1E1B4B' : state === 'fire' ? '#450A0A' : '#161514'}
            stroke="#161514"
            strokeWidth="2"
          />

          {/* VISOR FACIAL EXPRESSIONS */}
          {state === 'idle' && (
            <g id="eyes-idle">
              {/* Friendly alert cyan digital eyes */}
              <rect x="42" y="49" width="10" height="10" rx="3" fill="#38BDF8" />
              <rect x="68" y="49" width="10" height="10" rx="3" fill="#38BDF8" />
              <circle cx="45" cy="52" r="1.5" fill="#FFFFFF" />
              <circle cx="71" cy="52" r="1.5" fill="#FFFFFF" />
              <path d="M56 61C58 63 62 63 64 61" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          )}

          {state === 'focus' && (
            <g id="eyes-focus">
              {/* Tactical Amber HUD Eyes with Scanlines */}
              <circle cx="47" cy="54" r="6" fill="#FFB800" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="73" cy="54" r="6" fill="#FFB800" stroke="#FFFFFF" strokeWidth="1" />
              <line x1="41" y1="54" x2="53" y2="54" stroke="#161514" strokeWidth="1.5" />
              <line x1="47" y1="48" x2="47" y2="60" stroke="#161514" strokeWidth="1.5" />
              <line x1="67" y1="54" x2="79" y2="54" stroke="#161514" strokeWidth="1.5" />
              <line x1="73" y1="48" x2="73" y2="60" stroke="#161514" strokeWidth="1.5" />
            </g>
          )}

          {state === 'fire' && (
            <g id="eyes-fire">
              {/* Determined sharp fighter eyes > < */}
              <path d="M42 50L52 55L42 58" fill="none" stroke="#FF4343" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M78 50L68 55L78 58" fill="none" stroke="#FF4343" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M57 60H63" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {state === 'celebrate' && (
            <g id="eyes-celebrate">
              {/* Star Eyes for victory! */}
              <polygon points="47,47 49,52 54,52 50,55 52,60 47,57 43,60 45,55 41,52 46,52" fill="#CEF431" />
              <polygon points="73,47 75,52 80,52 76,55 78,60 73,57 69,60 71,55 67,52 72,52" fill="#CEF431" />
              <path d="M55 62C58 65 62 65 65 62" stroke="#CEF431" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {state === 'sleep' && (
            <g id="eyes-sleep">
              {/* Gentle sleep lines - - */}
              <line x1="42" y1="54" x2="52" y2="54" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="68" y1="54" x2="78" y2="54" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" />
              <text x="84" y="44" fill="#A78BFA" fontSize="11" fontWeight="bold" fontFamily="monospace">z</text>
              <text x="92" y="36" fill="#C4B5FD" fontSize="9" fontWeight="bold" fontFamily="monospace">Z</text>
            </g>
          )}

          {state === 'curious' && (
            <g id="eyes-curious">
              <circle cx="47" cy="54" r="5" fill="#38BDF8" />
              <text x="68" y="60" fill="#38BDF8" fontSize="14" fontWeight="black" fontFamily="sans-serif">?</text>
            </g>
          )}
        </g>

        {/* GLADIATOR CHASSIS & ARMOR */}
        <g id="body">
          {/* Neck Joint */}
          <rect x="52" y="78" width="16" height="6" fill="#78716C" stroke="#161514" strokeWidth="2" />

          {/* Shoulder Armor Pauldrons */}
          <path d="M22 84L34 82V96L20 92Z" fill="#E2E8F0" stroke="#161514" strokeWidth="2.5" />
          <path d="M98 84L86 82V96L100 92Z" fill="#E2E8F0" stroke="#161514" strokeWidth="2.5" />

          {/* Chestplate */}
          <path
            d="M34 82H86L82 116H38L34 82Z"
            fill="#FFFDF8"
            stroke="#161514"
            strokeWidth="3"
          />

          {/* INVICTUS CHEST EMBLEM ('V') */}
          <polygon
            points="60,108 50,88 56,88 60,98 64,88 70,88"
            fill={state === 'celebrate' ? '#03D26F' : state === 'fire' ? '#FF4343' : '#CEF431'}
            stroke="#161514"
            strokeWidth="1.5"
          />

          {/* Belt */}
          <rect x="36" y="116" width="48" height="8" fill="#161514" />
          <rect x="54" y="115" width="12" height="10" rx="1" fill="#FFB800" stroke="#161514" strokeWidth="1.5" />

          {/* Robot Hands */}
          {state === 'celebrate' ? (
            /* Raising a Neobrutalist Gold Trophy */
            <g id="trophy-hand">
              {/* Trophy Cup */}
              <path d="M96 74H114V86C114 94 106 98 105 98V106H94" fill="#FFB800" stroke="#161514" strokeWidth="2" />
              <path d="M114 78H118V84H114" fill="none" stroke="#161514" strokeWidth="1.5" />
              <circle cx="105" cy="84" r="3" fill="#FFFDF8" />
              {/* Hand holding trophy */}
              <circle cx="95" cy="98" r="5" fill="#E2E8F0" stroke="#161514" strokeWidth="2" />
            </g>
          ) : (
            <>
              {/* Resting Fists */}
              <circle cx="26" cy="100" r="6" fill="#E2E8F0" stroke="#161514" strokeWidth="2.5" />
              <circle cx="94" cy="100" r="6" fill="#E2E8F0" stroke="#161514" strokeWidth="2.5" />
            </>
          )}
        </g>
      </svg>

      {/* TELEMETRY STATUS PILL */}
      {showStatusBadge && (
        <span
          className={`mt-1 inline-flex items-center px-2 py-0.5 font-mono font-black uppercase tracking-wider border-2 border-[#161514] shadow-[1.5px_1.5px_0px_#161514] rounded-sm ${status.bg} ${status.textCol} ${currentSize.badgeText}`}
        >
          {status.text}
        </span>
      )}
    </div>
  );
}
