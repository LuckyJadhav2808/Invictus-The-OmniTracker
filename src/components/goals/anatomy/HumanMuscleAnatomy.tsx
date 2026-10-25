"use client";

import React, { useState, useId } from "react";
import { MuscleGroup, AnatomyOrientation, MuscleHighlightMap, MUSCLE_REGISTRY } from "./muscle-mapping";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { RotateCw, Sparkles, Flame, Check } from "lucide-react";

export interface HumanMuscleAnatomyProps {
  /**
   * Primary (flame red/neon) and secondary (amber) activated muscles
   */
  highlightedMuscles?: MuscleHighlightMap;
  /**
   * Currently active or selected muscle (for filters)
   */
  selectedMuscle?: MuscleGroup | null;
  /**
   * Initial or forced view orientation
   */
  initialView?: AnatomyOrientation;
  /**
   * Whether to show the Front / Back toggle pill
   */
  showViewToggle?: boolean;
  /**
   * Whether to show both Front and Back side-by-side (great on desktop or wide cards)
   */
  sideBySide?: boolean;
  /**
   * Callback when a user clicks a muscle
   */
  onMuscleClick?: (muscle: MuscleGroup) => void;
  /**
   * Whether muscles are clickable with hover states
   */
  interactive?: boolean;
  /**
   * Primary highlight accent palette
   */
  primaryColor?: "flame" | "emerald";
  /**
   * Optional size variant
   */
  size?: "sm" | "md" | "lg";
  /**
   * Extra CSS class names
   */
  className?: string;
  /**
   * Whether to show legend tags below the model
   */
  showLegend?: boolean;
}

export function HumanMuscleAnatomy({
  highlightedMuscles = {},
  selectedMuscle = null,
  initialView = "front",
  showViewToggle = true,
  sideBySide = false,
  onMuscleClick,
  interactive = true,
  primaryColor = "flame",
  size = "md",
  className,
  showLegend = true,
}: HumanMuscleAnatomyProps) {
  const [activeView, setActiveView] = useState<AnatomyOrientation>(initialView);
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleGroup | null>(null);
  const glowId = useId();

  // Normalize active sets
  const primarySet = new Set<MuscleGroup>(highlightedMuscles.primary || []);
  const secondarySet = new Set<MuscleGroup>(highlightedMuscles.secondary || []);

  const getMuscleTier = (muscle: MuscleGroup): "primary" | "secondary" | "selected" | "inactive" => {
    if (selectedMuscle === muscle) return "selected";
    if (primarySet.has(muscle)) return "primary";
    if (secondarySet.has(muscle)) return "secondary";
    return "inactive";
  };

  const getFillColor = (muscle: MuscleGroup): string => {
    const tier = getMuscleTier(muscle);
    const isHovered = hoveredMuscle === muscle;

    if (tier === "selected") {
      return "#CEF431"; // Invictus electric lime for user selection
    }
    if (tier === "primary") {
      return primaryColor === "emerald" ? "#03D26F" : "#FF4757";
    }
    if (tier === "secondary") {
      return "#F59E0B";
    }
    if (isHovered && interactive) {
      return "#D6D0C2";
    }
    return "#E8E3D7";
  };

  const getGlowFilter = (muscle: MuscleGroup): string => {
    const tier = getMuscleTier(muscle);
    if (tier === "selected") return `url(#${glowId}-selected)`;
    if (tier === "primary") return `url(#${glowId}-primary)`;
    if (tier === "secondary") return `url(#${glowId}-secondary)`;
    return "none";
  };

  const handleMuscleInteraction = (muscle: MuscleGroup) => {
    if (!interactive) return;
    soundFX.playPop();
    if (onMuscleClick) {
      onMuscleClick(muscle);
    }
  };

  // Dimensions based on size variant
  const sizeClasses = {
    sm: "w-28 h-48",
    md: "w-36 h-60 sm:w-44 sm:h-72",
    lg: "w-48 h-80 sm:w-60 sm:h-96",
  }[size];

  // Helper to render an interactive SVG muscle path
  const renderMuscle = (
    muscle: MuscleGroup,
    d: string,
    label: string,
    extraProps: React.SVGProps<SVGPathElement> = {}
  ) => {
    const isClickable = interactive;
    const tier = getMuscleTier(muscle);
    const isTargeted = tier !== "inactive";

    return (
      <path
        key={d.slice(0, 15)}
        d={d}
        fill={getFillColor(muscle)}
        filter={getGlowFilter(muscle)}
        stroke="#161514"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        className={cn(
          "transition-colors duration-200 outline-none",
          isClickable ? "cursor-pointer" : "cursor-default",
          isTargeted && "opacity-100",
          !isTargeted && "opacity-90 hover:opacity-100"
        )}
        onMouseEnter={() => interactive && setHoveredMuscle(muscle)}
        onMouseLeave={() => interactive && setHoveredMuscle(null)}
        onClick={() => handleMuscleInteraction(muscle)}
        aria-label={label}
        {...extraProps}
      >
        <title>{label}</title>
      </path>
    );
  };

  /* -------------------------------------------------------------
   * ANTERIOR (FRONT) BODY SVG
   * ------------------------------------------------------------- */
  const renderFrontBody = () => (
    <svg
      viewBox="0 0 200 360"
      className="w-full h-full select-none overflow-visible"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Flame Red Glow */}
        <filter id={`${glowId}-primary`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="3"
            floodColor={primaryColor === "emerald" ? "#03D26F" : "#FF4757"}
            floodOpacity="0.75"
          />
        </filter>
        {/* Amber Glow */}
        <filter id={`${glowId}-secondary`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#F59E0B" floodOpacity="0.65" />
        </filter>
        {/* Selected Neon Lime Glow */}
        <filter id={`${glowId}-selected`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#CEF431" floodOpacity="0.9" />
        </filter>
      </defs>

      {/* Head & Cranium */}
      <ellipse cx="100" cy="24" rx="14" ry="18" fill="#F0ECE1" stroke="#161514" strokeWidth="1.8" />

      {/* Neck & Traps (Front view) */}
      {renderMuscle(
        "neck",
        "M93,39 C93,45 87,50 82,53 L86,55 C91,55 95,47 96,40 Z M107,39 C107,45 113,50 118,53 L114,55 C109,55 105,47 104,40 Z",
        "Neck (Sternocleidomastoid)"
      )}

      {/* Trapezius - Front Ridge */}
      {renderMuscle(
        "traps",
        "M82,53 C76,57 68,63 64,67 L70,68 C76,64 83,57 86,55 Z M118,53 C124,57 132,63 136,67 L130,68 C124,64 117,57 114,55 Z",
        "Trapezius (Front Collar)"
      )}

      {/* Shoulders - Anterior & Lateral Deltoids */}
      {/* Left Shoulder */}
      {renderMuscle(
        "shoulders",
        "M63,67 C56,71 50,78 48,89 C47,96 49,102 54,103 C57,100 60,93 62,87 C63,80 64,74 65,68 Z",
        "Front Shoulder (Left Deltoid)"
      )}
      {/* Right Shoulder */}
      {renderMuscle(
        "shoulders",
        "M137,67 C144,71 150,78 152,89 C153,96 151,102 146,103 C143,100 140,93 138,87 C137,80 136,74 135,68 Z",
        "Front Shoulder (Right Deltoid)"
      )}

      {/* Chest - Pectoralis Major */}
      {/* Left Pec */}
      {renderMuscle(
        "chest",
        "M67,71 C78,70 88,72 98,76 C98,87 97,97 96,107 C84,109 72,106 64,98 C61,90 62,79 67,71 Z",
        "Pectoralis Major (Left Chest)"
      )}
      {/* Right Pec */}
      {renderMuscle(
        "chest",
        "M133,71 C122,70 112,72 102,76 C102,87 103,97 104,107 C116,109 128,106 136,98 C139,90 138,79 133,71 Z",
        "Pectoralis Major (Right Chest)"
      )}

      {/* Biceps */}
      {/* Left Bicep */}
      {renderMuscle(
        "biceps",
        "M52,104 C47,110 45,120 46,130 C50,131 54,130 57,126 C59,120 59,112 56,104 Z",
        "Left Biceps Brachii"
      )}
      {/* Right Bicep */}
      {renderMuscle(
        "biceps",
        "M148,104 C153,110 155,120 154,130 C150,131 146,130 143,126 C141,120 141,112 144,104 Z",
        "Right Biceps Brachii"
      )}

      {/* Forearms (Front) */}
      {/* Left Forearm */}
      {renderMuscle(
        "forearms",
        "M46,132 C41,142 37,156 38,168 C42,169 46,168 49,163 C52,154 55,143 56,132 Z",
        "Left Forearm (Flexors)"
      )}
      {/* Right Forearm */}
      {renderMuscle(
        "forearms",
        "M154,132 C159,142 163,156 162,168 C158,169 154,168 151,163 C148,154 145,143 144,132 Z",
        "Right Forearm (Flexors)"
      )}

      {/* Hands */}
      <path d="M37,170 C35,176 34,183 36,187 C38,189 42,189 45,185 C46,180 47,175 48,169 Z" fill="#F0ECE1" stroke="#161514" strokeWidth="1.6" />
      <path d="M163,170 C165,176 166,183 164,187 C162,189 158,189 155,185 C154,180 153,175 152,169 Z" fill="#F0ECE1" stroke="#161514" strokeWidth="1.6" />

      {/* Abdominals (6-Pack Rectus Abdominis) */}
      {/* Upper Abs */}
      {renderMuscle(
        "abs",
        "M83,110 L98,110 L98,124 L81,124 C81,119 82,114 83,110 Z M117,110 L102,110 L102,124 L119,124 C119,119 118,114 117,110 Z",
        "Upper Abdominals"
      )}
      {/* Mid Abs */}
      {renderMuscle(
        "abs",
        "M81,126 L98,126 L98,141 L81,141 Z M119,126 L102,126 L102,141 L119,141 Z",
        "Middle Abdominals"
      )}
      {/* Lower Abs */}
      {renderMuscle(
        "abs",
        "M81,143 L98,143 L98,158 C92,163 86,165 80,163 L81,143 Z M119,143 L102,143 L102,158 C108,163 114,165 120,163 L119,143 Z",
        "Lower Abdominals"
      )}

      {/* Obliques (External Obliques) */}
      {/* Left Oblique */}
      {renderMuscle(
        "obliques",
        "M67,112 C72,112 78,116 79,125 L79,152 C72,155 68,146 66,138 C64,128 65,119 67,112 Z",
        "Left Obliques"
      )}
      {/* Right Oblique */}
      {renderMuscle(
        "obliques",
        "M133,112 C128,112 122,116 121,125 L121,152 C128,155 132,146 134,138 C136,128 135,119 133,112 Z",
        "Right Obliques"
      )}

      {/* Pelvis & Hips */}
      <path d="M80,164 C90,167 110,167 120,164 L123,176 C110,183 90,183 77,176 Z" fill="#F0ECE1" stroke="#161514" strokeWidth="1.6" />

      {/* Quadriceps (Front Thighs) */}
      {/* Left Quad */}
      {renderMuscle(
        "quads",
        "M76,177 C88,181 94,183 96,197 C97,215 95,236 92,256 C85,257 78,255 74,248 C70,232 68,206 72,185 Z",
        "Left Quadriceps (Femur)"
      )}
      {/* Right Quad */}
      {renderMuscle(
        "quads",
        "M124,177 C112,181 106,183 104,197 C103,215 105,236 108,256 C115,257 122,255 126,248 C130,232 132,206 128,185 Z",
        "Right Quadriceps (Femur)"
      )}

      {/* Knees */}
      <ellipse cx="83" cy="264" rx="7" ry="6" fill="#F0ECE1" stroke="#161514" strokeWidth="1.6" />
      <ellipse cx="117" cy="264" rx="7" ry="6" fill="#F0ECE1" stroke="#161514" strokeWidth="1.6" />

      {/* Calves (Front Shin / Tibialis) */}
      {/* Left Shin & Calf */}
      {renderMuscle(
        "calves",
        "M75,271 C73,285 71,304 74,324 C79,325 84,324 87,320 C89,305 91,288 90,271 C84,272 79,272 75,271 Z",
        "Left Calf & Tibialis"
      )}
      {/* Right Shin & Calf */}
      {renderMuscle(
        "calves",
        "M125,271 C127,285 129,304 126,324 C121,325 116,324 113,320 C111,305 109,288 110,271 C116,272 121,272 125,271 Z",
        "Right Calf & Tibialis"
      )}

      {/* Feet (Front) */}
      <path d="M72,326 C68,335 66,346 72,350 C77,351 84,349 86,339 L85,326 Z" fill="#F0ECE1" stroke="#161514" strokeWidth="1.6" />
      <path d="M128,326 C132,335 134,346 128,350 C123,351 116,349 114,339 L115,326 Z" fill="#F0ECE1" stroke="#161514" strokeWidth="1.6" />
    </svg>
  );

  /* -------------------------------------------------------------
   * POSTERIOR (BACK) BODY SVG
   * ------------------------------------------------------------- */
  const renderBackBody = () => (
    <svg
      viewBox="0 0 200 360"
      className="w-full h-full select-none overflow-visible"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={`${glowId}-primary-back`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="3"
            floodColor={primaryColor === "emerald" ? "#03D26F" : "#FF4757"}
            floodOpacity="0.75"
          />
        </filter>
        <filter id={`${glowId}-secondary-back`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#F59E0B" floodOpacity="0.65" />
        </filter>
        <filter id={`${glowId}-selected-back`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#CEF431" floodOpacity="0.9" />
        </filter>
      </defs>

      {/* Head (Back of Cranium) */}
      <ellipse cx="100" cy="24" rx="14" ry="18" fill="#F0ECE1" stroke="#161514" strokeWidth="1.8" />

      {/* Trapezius - Massive Upper, Mid & Lower Diamond Traps */}
      {renderMuscle(
        "traps",
        "M100,41 L85,53 L68,66 C78,71 88,72 96,72 L100,105 L104,72 C112,72 122,71 132,66 L115,53 Z",
        "Trapezius (Upper & Mid Back)"
      )}

      {/* Rear Deltoids (Posterior Shoulders) */}
      {/* Left Rear Delt */}
      {renderMuscle(
        "rear-delts",
        "M65,68 C58,72 52,80 49,90 C48,97 50,102 55,103 C58,98 62,88 64,80 C65,75 66,71 67,68 Z",
        "Left Rear Deltoid"
      )}
      {/* Right Rear Delt */}
      {renderMuscle(
        "rear-delts",
        "M135,68 C142,72 148,80 151,90 C152,97 150,102 145,103 C142,98 138,88 136,80 C135,75 134,71 133,68 Z",
        "Right Rear Deltoid"
      )}

      {/* Triceps (Back of Arms) */}
      {/* Left Tricep */}
      {renderMuscle(
        "triceps",
        "M53,104 C48,110 46,121 47,130 C51,131 55,130 58,125 C60,119 59,111 56,104 Z",
        "Left Triceps Brachii"
      )}
      {/* Right Tricep */}
      {renderMuscle(
        "triceps",
        "M147,104 C152,110 154,121 153,130 C149,131 145,130 142,125 C140,119 141,111 144,104 Z",
        "Right Triceps Brachii"
      )}

      {/* Forearms (Back / Extensors) */}
      {/* Left Forearm Back */}
      {renderMuscle(
        "forearms",
        "M47,132 C42,142 38,156 39,168 C43,169 47,168 50,163 C53,154 56,143 57,132 Z",
        "Left Forearm (Extensors)"
      )}
      {/* Right Forearm Back */}
      {renderMuscle(
        "forearms",
        "M153,132 C158,142 162,156 161,168 C157,169 153,168 150,163 C147,154 144,143 143,132 Z",
        "Right Forearm (Extensors)"
      )}

      {/* Hands Back */}
      <path d="M38,170 C36,176 35,183 37,187 C39,189 43,189 46,185 C47,180 48,175 49,169 Z" fill="#F0ECE1" stroke="#161514" strokeWidth="1.6" />
      <path d="M162,170 C164,176 165,183 163,187 C161,189 157,189 154,185 C153,180 152,175 151,169 Z" fill="#F0ECE1" stroke="#161514" strokeWidth="1.6" />

      {/* Latissimus Dorsi (Lats Wings) */}
      {/* Left Lat */}
      {renderMuscle(
        "lats",
        "M67,82 C74,83 85,86 97,97 L97,128 C87,132 77,133 70,123 C66,112 65,96 67,82 Z",
        "Left Latissimus Dorsi (Lat Wing)"
      )}
      {/* Right Lat */}
      {renderMuscle(
        "lats",
        "M133,82 C126,83 115,86 103,97 L103,128 C113,132 123,133 130,123 C134,112 135,96 133,82 Z",
        "Right Latissimus Dorsi (Lat Wing)"
      )}

      {/* Lower Back (Erector Spinae / Lumbar) */}
      {renderMuscle(
        "lower-back",
        "M88,130 L98,130 L98,162 L87,162 C85,152 86,140 88,130 Z M112,130 L102,130 L102,162 L113,162 C115,152 114,140 112,130 Z",
        "Lower Back (Erector Spinae)"
      )}

      {/* Glutes (Gluteus Maximus) */}
      {/* Left Glute */}
      {renderMuscle(
        "glutes",
        "M75,165 C85,164 96,166 98,177 C99,195 95,213 85,218 C75,217 68,206 69,190 C70,179 72,170 75,165 Z",
        "Left Gluteus Maximus"
      )}
      {/* Right Glute */}
      {renderMuscle(
        "glutes",
        "M125,165 C115,164 104,166 102,177 C101,195 105,213 115,218 C125,217 132,206 131,190 C130,179 128,170 125,165 Z",
        "Right Gluteus Maximus"
      )}

      {/* Hamstrings (Back of Thighs) */}
      {/* Left Hamstring */}
      {renderMuscle(
        "hamstrings",
        "M73,220 C82,221 91,221 93,235 C95,248 93,260 88,266 C83,267 76,265 73,257 C70,246 69,232 73,220 Z",
        "Left Hamstring (Biceps Femoris)"
      )}
      {/* Right Hamstring */}
      {renderMuscle(
        "hamstrings",
        "M127,220 C118,221 109,221 107,235 C105,248 107,260 112,266 C117,267 124,265 127,257 C130,246 131,232 127,220 Z",
        "Right Hamstring (Biceps Femoris)"
      )}

      {/* Back of Knees (Popliteal) */}
      <path d="M74,268 L88,268 L86,275 L76,275 Z" fill="#F0ECE1" stroke="#161514" strokeWidth="1.6" />
      <path d="M126,268 L112,268 L114,275 L124,275 Z" fill="#F0ECE1" stroke="#161514" strokeWidth="1.6" />

      {/* Calves - Gastrocnemius & Soleus (Back of Calves) */}
      {/* Left Calf (Double Diamond Bulge) */}
      {renderMuscle(
        "calves",
        "M74,276 C70,286 69,298 72,312 C75,322 80,324 84,324 C88,321 91,308 91,296 C91,286 87,277 84,276 Z",
        "Left Calf (Gastrocnemius)"
      )}
      {/* Right Calf (Double Diamond Bulge) */}
      {renderMuscle(
        "calves",
        "M126,276 C130,286 131,298 128,312 C125,322 120,324 116,324 C112,321 109,308 109,296 C109,286 113,277 116,276 Z",
        "Right Calf (Gastrocnemius)"
      )}

      {/* Heels & Achilles Tendons */}
      <path d="M74,326 C72,336 71,346 76,350 C80,351 84,349 85,339 L85,326 Z" fill="#F0ECE1" stroke="#161514" strokeWidth="1.6" />
      <path d="M126,326 C128,336 129,346 124,350 C120,351 116,349 115,339 L115,326 Z" fill="#F0ECE1" stroke="#161514" strokeWidth="1.6" />
    </svg>
  );

  return (
    <div className={cn("flex flex-col items-center select-none", className)}>
      {/* Orientation View Switcher (Front ↔ Back) */}
      {showViewToggle && !sideBySide && (
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] border-2 border-[#161514] rounded-xl shadow-[2px_2px_0px_0px_#161514] mb-3">
          <button
            type="button"
            onClick={() => {
              setActiveView("front");
              soundFX.playPop();
            }}
            className={cn(
              "px-3 py-1 rounded-lg font-heading font-black text-xs uppercase tracking-wider transition-all cursor-pointer",
              activeView === "front"
                ? "bg-[#161514] text-[#CEF431] shadow-[1px_1px_0px_0px_#161514]"
                : "bg-transparent text-[#161514]/70 hover:text-[#161514]"
            )}
          >
            Anterior (Front)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveView("back");
              soundFX.playPop();
            }}
            className={cn(
              "px-3 py-1 rounded-lg font-heading font-black text-xs uppercase tracking-wider transition-all cursor-pointer",
              activeView === "back"
                ? "bg-[#161514] text-[#CEF431] shadow-[1px_1px_0px_0px_#161514]"
                : "bg-transparent text-[#161514]/70 hover:text-[#161514]"
            )}
          >
            Posterior (Back)
          </button>
        </div>
      )}

      {/* Anatomy Vector Canvas Container */}
      {sideBySide ? (
        <div className="grid grid-cols-2 gap-4 w-full justify-items-center">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-heading font-black uppercase text-[#161514]/60 mb-1">
              Front View
            </span>
            <div className={cn("relative p-2 bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514]", sizeClasses)}>
              {renderFrontBody()}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-heading font-black uppercase text-[#161514]/60 mb-1">
              Back View
            </span>
            <div className={cn("relative p-2 bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514]", sizeClasses)}>
              {renderBackBody()}
            </div>
          </div>
        </div>
      ) : (
        <div className={cn("relative p-2 bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex items-center justify-center", sizeClasses)}>
          {activeView === "front" ? renderFrontBody() : renderBackBody()}

          {/* Quick Flip Button Floating Overlay */}
          {showViewToggle && (
            <button
              type="button"
              onClick={() => {
                setActiveView((v: AnatomyOrientation) => (v === "front" ? "back" : "front"));
                soundFX.playPop();
              }}
              title="Flip to opposite view"
              className="absolute bottom-2.5 right-2.5 size-7 rounded-lg bg-white border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] flex items-center justify-center text-[#161514] hover:bg-amber-100 transition-all cursor-pointer active:translate-y-0.5"
            >
              <RotateCw className="size-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      )}

      {/* Dynamic Hover / Active Indicator with Reserved Stable Height (Zero Cumulative Layout Shift) */}
      {interactive && (
        <div className="h-7 mt-2 flex items-center justify-center overflow-hidden">
          {hoveredMuscle ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#161514] text-white text-[10px] font-heading font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_#161514] animate-in fade-in zoom-in-95 duration-150">
              <span>{MUSCLE_REGISTRY[hoveredMuscle as MuscleGroup]?.name || hoveredMuscle}</span>
              <span className="text-white/60 font-mono text-[9px] hidden sm:inline">
                ({MUSCLE_REGISTRY[hoveredMuscle as MuscleGroup]?.latinName})
              </span>
            </span>
          ) : selectedMuscle ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#FAF8F5] text-[#161514] border-2 border-[#161514] text-[10px] font-heading font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_#161514] animate-in fade-in duration-150">
              <span>Selected: {MUSCLE_REGISTRY[selectedMuscle as MuscleGroup]?.name || selectedMuscle}</span>
            </span>
          ) : (
            <span className="text-[10px] font-heading font-extrabold uppercase text-[#161514]/40 tracking-wider">
              Hover or tap a muscle
            </span>
          )}
        </div>
      )}

      {/* Legend Chips */}
      {showLegend && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3 pt-2 border-t border-[#161514]/10 text-[10px] font-heading font-black uppercase text-[#161514]">
          <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-md border border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
            <span
              className={cn(
                "size-2.5 rounded-full border border-[#161514]",
                primaryColor === "emerald" ? "bg-[#03D26F]" : "bg-[#FF4757]"
              )}
            />
            <span>Primary Target</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-md border border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
            <span className="size-2.5 rounded-full bg-[#F59E0B] border border-[#161514]" />
            <span>Secondary Assist</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-md border border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
            <span className="size-2.5 rounded-full bg-[#E8E3D7] border border-[#161514]" />
            <span>Rested</span>
          </div>
        </div>
      )}
    </div>
  );
}
