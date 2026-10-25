"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useCallback,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export type CelestialPresetName =
  | "celestial"
  | "moonlight"
  | "solar"
  | "spotlight"
  | "aurora";

export interface CelestialRaysConfig {
  palette: string[];
  background: string;
  sourceX: number;
  sourceY: number;
  beamAngle: number;
  perspectiveTilt: number;
  fanSpread: number;
  beamCount: number;
  beamThickness: number;
  reachDistance: number;
  oscillation: number;
  shimmer: number;
  ambientHaze: number;
  luminance: number;
  speed: number;
  cursorFlare: number;
  cursorRadius: number;
}

export const CELESTIAL_RAYS_PRESETS: Record<CelestialPresetName, CelestialRaysConfig> = {
  celestial: {
    palette: ["#5227FF", "#B84DFF", "#FF9FFC", "#FFE6FA"],
    background: "#06040d",
    sourceX: 0.5,
    sourceY: -0.7,
    beamAngle: 0,
    perspectiveTilt: 20,
    fanSpread: 34,
    beamCount: 10,
    beamThickness: 1.0,
    reachDistance: 1.1,
    oscillation: 1.0,
    shimmer: 0.6,
    ambientHaze: 1.0,
    luminance: 1.0,
    speed: 1.0,
    cursorFlare: 1.0,
    cursorRadius: 5.0,
  },
  moonlight: {
    palette: ["#1B3A8C", "#4F7BFF", "#A9C6FF", "#F2F7FF"],
    background: "#03050d",
    sourceX: 0.5,
    sourceY: 1.7,
    beamAngle: 180,
    perspectiveTilt: 15,
    fanSpread: 30,
    beamCount: 10,
    beamThickness: 1.0,
    reachDistance: 1.1,
    oscillation: 0.8,
    shimmer: 0.5,
    ambientHaze: 1.0,
    luminance: 1.0,
    speed: 0.8,
    cursorFlare: 1.0,
    cursorRadius: 5.0,
  },
  solar: {
    palette: ["#7A1238", "#E0445E", "#FF9A5C", "#FFE7C2"],
    background: "#0d0406",
    sourceX: 0.5,
    sourceY: -0.5,
    beamAngle: 0,
    perspectiveTilt: 25,
    fanSpread: 44,
    beamCount: 11,
    beamThickness: 1.0,
    reachDistance: 1.2,
    oscillation: 0.8,
    shimmer: 0.5,
    ambientHaze: 1.1,
    luminance: 1.0,
    speed: 0.8,
    cursorFlare: 1.0,
    cursorRadius: 5.0,
  },
  spotlight: {
    palette: ["#3A3A55", "#9A9AC0", "#E2E2F5", "#FFFFFF"],
    background: "#050507",
    sourceX: 0.12,
    sourceY: 1.6,
    beamAngle: 150,
    perspectiveTilt: 10,
    fanSpread: 16,
    beamCount: 6,
    beamThickness: 1.0,
    reachDistance: 1.4,
    oscillation: 0.6,
    shimmer: 0.4,
    ambientHaze: 0.9,
    luminance: 1.0,
    speed: 0.7,
    cursorFlare: 1.0,
    cursorRadius: 4.0,
  },
  aurora: {
    palette: ["#0B5D63", "#12B5A6", "#6FF2CF", "#E8FFF7"],
    background: "#02080a",
    sourceX: 0.5,
    sourceY: -0.7,
    beamAngle: 0,
    perspectiveTilt: 30,
    fanSpread: 34,
    beamCount: 10,
    beamThickness: 1.1,
    reachDistance: 1.1,
    oscillation: 1.2,
    shimmer: 0.7,
    ambientHaze: 1.0,
    luminance: 1.0,
    speed: 1.0,
    cursorFlare: 1.0,
    cursorRadius: 5.0,
  },
};

export interface CelestialRaysProps {
  /** Preset variant configuration */
  preset?: CelestialPresetName;
  /** Explicit theme override: 'light' (white background + ink rays), 'dark' (black + glow), or 'auto' (sync with document theme) */
  theme?: "light" | "dark" | "auto";
  /** Explicit dark mode indicator boolean override */
  isDark?: boolean;
  /** Blending model: 'auto', 'radiant' (glow on dark surfaces), or 'atmospheric' (ink on light surfaces) */
  themeMode?: "auto" | "radiant" | "atmospheric" | "add" | "ink";
  /** Palette of up to 4 HEX color stops from core to edge */
  palette?: string[];
  /** Custom background color, or 'transparent' (defaults to #ffffff in light mode, preset dark color in dark mode) */
  bgColor?: string;
  /** Horizontal origin anchor of rays (0 to 1) */
  sourceX?: number;
  /** Vertical origin anchor of rays (-1.5 to 2.5) */
  sourceY?: number;
  /** Angle direction of beam travel in degrees (0 = up, 180 = down) */
  beamAngle?: number;
  /** Perspective lean tilt in degrees (-60 to 60) */
  perspectiveTilt?: number;
  /** Total fan spread arc in degrees (4 to 80) */
  fanSpread?: number;
  /** Number of simulated volumetric light rays (1 to 16) */
  beamCount?: number;
  /** Multiplier for ray thickness width */
  beamThickness?: number;
  /** Distance light penetrates into scene before fading out */
  reachDistance?: number;
  /** Natural swaying drift multiplier */
  oscillation?: number;
  /** Temporal shimmer intensity (0 to 1) */
  shimmer?: number;
  /** Volumetric ambient fog scattering density */
  ambientHaze?: number;
  /** Overall beam luminance multiplier */
  luminance?: number;
  /** Animation speed multiplier */
  speed?: number;
  /** Whether rays flare dynamically when hovered by pointer */
  interactive?: boolean;
  /** Flare boost multiplier on hover */
  cursorFlare?: number;
  /** Angular radius of hover reaction in degrees */
  cursorRadius?: number;
  /** Analog film grain noise strength (0 to 1) */
  filmGrain?: number;
  /** Procedural pseudo-random seed variation */
  randomSeed?: number;
  /** Freezes drifting rays motion */
  isPaused?: boolean;
  /** Device pixel ratio ceiling cap */
  maxDpr?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

// --- GLSL Shaders ---

const CELESTIAL_VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
}
`;

const CELESTIAL_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

#define MAX_PALETTE_COLORS 4
#define MAX_VOLUMETRIC_RAYS 16

varying vec2 vUv;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uLabColors[MAX_PALETTE_COLORS];
uniform int uColorCount;
uniform vec3 uBackgroundColor;
uniform float uIsTransparent;
uniform float uIsAtmospheric;
uniform vec2 uSourceOrigin;
uniform vec2 uBeamAxis;
uniform vec2 uHingeAnchor;
uniform vec3 uTiltParams;
uniform float uNearOffset;
uniform float uSpreadAngle;
uniform int uRayCount;
uniform vec4 uRayData[MAX_VOLUMETRIC_RAYS];
uniform float uReachLength;
uniform float uAmbientHaze;
uniform float uLuminance;
uniform float uFilmGrain;
uniform float uSeedValue;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}

float gradientNoise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash22(i), f);
  float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec3 oklabToLinearRgb(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec3 samplePaletteGradient(float t) {
  t = clamp(t, 0.0, 1.0) * mix(1.0, 0.62, uIsAtmospheric);
  vec3 lab = uLabColors[0];
  if (uColorCount > 1) {
    float scaled = t * float(uColorCount - 1);
    for (int i = 1; i < MAX_PALETTE_COLORS; i++) {
      if (i >= uColorCount) break;
      lab = mix(lab, uLabColors[i], smoothstep(0.0, 1.0, clamp(scaled - float(i - 1), 0.0, 1.0)));
    }
  }
  return max(oklabToLinearRgb(lab), 0.0);
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float t = uTime;
  vec2 uvCoord = (vUv - 0.5) * vec2(aspect, 1.0);
  vec2 lateralAxis = vec2(uBeamAxis.y, -uBeamAxis.x);

  float visibility = 1.0;
  float perspectiveScale = 1.0;
  if (abs(uTiltParams.x) > 0.0001) {
    vec2 rel = uvCoord - uHingeAnchor;
    float x = dot(rel, lateralAxis);
    float y = dot(rel, uBeamAxis);
    float xc = dot(-uHingeAnchor, lateralAxis);
    float yc = dot(-uHingeAnchor, uBeamAxis);
    float denom = (y - yc) * uTiltParams.x + uTiltParams.z * uTiltParams.y;
    float k = (uTiltParams.z * uTiltParams.y - yc * uTiltParams.x) / max(denom, 0.02);
    visibility = smoothstep(0.0, 0.12, denom);
    uvCoord = uHingeAnchor + (xc + k * (x - xc)) * lateralAxis + ((yc + k * (y - yc)) / uTiltParams.y) * uBeamAxis;
    perspectiveScale = clamp(1.0 / max(k, 0.05), 0.3, 3.0);
  }

  vec2 delta = uvCoord - uSourceOrigin;
  float dist = length(delta);
  float theta = atan(dot(delta, lateralAxis), dot(delta, uBeamAxis));
  float distPast = max(dist - uNearOffset, 0.0);
  float beamBlur = 0.02 / max(dist, 0.001);

  float lightRaySum = 0.0;
  for (int i = 0; i < MAX_VOLUMETRIC_RAYS; i++) {
    if (i >= uRayCount) break;
    vec4 ray = uRayData[i];
    float w = sqrt(ray.y * ray.y + beamBlur * beamBlur);
    float angularOffset = theta - ray.x;
    lightRaySum += exp(-angularOffset * angularOffset / (w * w)) * (ray.y / w) * ray.z * exp(-distPast / ray.w);
  }

  float hazeAmount = clamp(uAmbientHaze, 0.0, 2.0);
  float turbulence = 1.0 + 0.22 * gradientNoise2D(vec2(theta * 18.0 + uSeedValue * 7.0, t * 0.1));
  float ambientDrift = gradientNoise2D(vec2(theta * 5.0 - uSeedValue * 3.0, distPast * 2.6 - t * 0.32));
  float envelope = 1.0 + 0.2 * min(hazeAmount, 1.5) * ambientDrift;
  float fanArc = max(uSpreadAngle * 0.8, 0.02);
  float fanProfile = exp(-theta * theta / (fanArc * fanArc));
  float fillFog = fanProfile * exp(-distPast / max(uReachLength * 1.35, 0.02));
  float ambientGlow = exp(-distPast / max(uReachLength * 3.0, 0.02)) * mix(0.1, 1.0, fanProfile);

  float volumetricEnergy = lightRaySum * turbulence * envelope * 2.0;
  volumetricEnergy += fillFog * envelope * 0.4 * hazeAmount;
  volumetricEnergy += ambientGlow * 0.02 * hazeAmount;
  volumetricEnergy *= uLuminance * visibility * sqrt(perspectiveScale);

  float toneCurve = 1.0 - exp(-volumetricEnergy * 0.3);
  vec3 hdrSpectrum = samplePaletteGradient(toneCurve) * volumetricEnergy * 1.3;

  vec3 finalColor;
  float finalAlpha = 1.0;

  if (uIsAtmospheric < 0.5) {
    // Radiant Glow Mode (Additive Emission for Dark Backgrounds)
    vec3 glowEmission = 1.0 - exp(-hdrSpectrum);
    if (uIsTransparent > 0.5) {
      finalColor = glowEmission;
      finalAlpha = clamp(max(glowEmission.r, max(glowEmission.g, glowEmission.b)), 0.0, 1.0);
    } else {
      finalColor = 1.0 - (1.0 - uBackgroundColor) * (1.0 - glowEmission);
    }
  } else {
    // Atmospheric Ink Absorption Mode (Subtle Shading for Light Backgrounds)
    float intensityPeak = max(hdrSpectrum.r, max(hdrSpectrum.g, hdrSpectrum.b));
    float coverage = smoothstep(0.02, 0.95, 1.0 - exp(-intensityPeak * 1.4));
    vec3 chromaticHue = intensityPeak > 0.0001 ? hdrSpectrum / intensityPeak : vec3(1.0);
    float luma = dot(chromaticHue, vec3(0.299, 0.587, 0.114));
    vec3 pigmentTone = clamp(mix(vec3(luma), chromaticHue, 1.12), 0.0, 1.0) * mix(1.0, 0.8, coverage);
    if (uIsTransparent > 0.5) {
      finalColor = pigmentTone * coverage;
      finalAlpha = coverage;
    } else {
      finalColor = uBackgroundColor * mix(vec3(1.0), pigmentTone, coverage);
    }
  }

  gl_FragColor = linearToOutputTexel(vec4(finalColor, finalAlpha));

  // High precision dithering to eliminate color banding
  float ditherVal = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  gl_FragColor.rgb += (ditherVal - 0.5) / 255.0;

  if (uFilmGrain > 0.0) {
    float noiseGrain = hash21(gl_FragCoord.xy + fract(uTime * 7.13) * 91.7) - 0.5;
    gl_FragColor.rgb += noiseGrain * uFilmGrain * 0.05 * finalAlpha;
  }
}
`;

// --- Mathematical Helper Functions ---

const clampValue = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val));

const degToRadians = (deg: number) => (deg * Math.PI) / 180;

const smoothStepCurve = (min: number, max: number, val: number) => {
  const x = clampValue((val - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
};

const hashRandom1D = (val: number) => {
  const t = 43758.5453 * Math.sin(127.1 * val + 311.7);
  return t - Math.floor(t);
};

const smoothNoise1D = (val: number) => {
  const t = Math.floor(val);
  const a = val - t;
  const r = (2 * hashRandom1D(t) - 1) * a;
  return (
    (r +
      ((2 * hashRandom1D(t + 1) - 1) * (a - 1) - r) *
        (a * a * a * (a * (6 * a - 15) + 10))) *
    2
  );
};

const checkIsTransparent = (colorStr: string) => {
  const str = colorStr.trim().toLowerCase();
  return (
    str === "transparent" ||
    (/^#[0-9a-f]{8}$/.test(str)
      ? str.endsWith("00")
      : /^#[0-9a-f]{4}$/.test(str)
      ? str.endsWith("0")
      : Boolean(str.match(/^(?:rgba?|hsla?)\(.*[,/]\s*(0|0?\.0+|0%)\s*\)$/)))
  );
};

const rgbToOklabSpace = (col: THREE.Color, target: THREE.Vector3) => {
  const l = Math.cbrt(0.4122214708 * col.r + 0.5363325363 * col.g + 0.0514459929 * col.b);
  const m = Math.cbrt(0.2119034982 * col.r + 0.6806995451 * col.g + 0.1073969566 * col.b);
  const s = Math.cbrt(0.0883024619 * col.r + 0.2817188376 * col.g + 0.6299787005 * col.b);
  return target.set(
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  );
};

const parseColorSafe = (target: THREE.Color, hex: string, fallback: string) => {
  const trimmed = hex.trim();
  try {
    target.set(/^#[0-9a-f]{8}$/i.test(trimmed) ? trimmed.slice(0, 7) : trimmed);
  } catch {
    target.set(fallback);
  }
  return target;
};

// --- WebGL Mesh Scene ---

interface CelestialMeshProps {
  config: CelestialRaysProps & {
    reducedMotion: boolean;
    computedAtmospheric: boolean;
    computedBgColor: string;
  };
  pointerRef: React.MutableRefObject<{ x: number; y: number; inside: boolean }>;
  wakeRef: React.MutableRefObject<(() => void) | null>;
}

const CelestialMesh: React.FC<CelestialMeshProps> = ({
  config,
  pointerRef,
  wakeRef,
}) => {
  const { size, invalidate } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const animTimeline = useRef({
    time: 12.5,
    glowRays: new Float32Array(16),
  });

  const uniforms = useMemo(
    () => ({
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uLabColors: { value: Array.from({ length: 4 }, () => new THREE.Vector3()) },
      uColorCount: { value: 4 },
      uBackgroundColor: { value: new THREE.Color() },
      uIsTransparent: { value: 0 },
      uIsAtmospheric: { value: 0 },
      uSourceOrigin: { value: new THREE.Vector2(0, -1.2) },
      uBeamAxis: { value: new THREE.Vector2(0, 1) },
      uHingeAnchor: { value: new THREE.Vector2(0, -0.5) },
      uTiltParams: { value: new THREE.Vector3(0, 1, 1.2) },
      uNearOffset: { value: 0.7 },
      uSpreadAngle: { value: degToRadians(36) },
      uRayCount: { value: 9 },
      uRayData: { value: Array.from({ length: 16 }, () => new THREE.Vector4()) },
      uReachLength: { value: 0.3 },
      uAmbientHaze: { value: 1 },
      uLuminance: { value: 1 },
      uFilmGrain: { value: 0 },
      uSeedValue: { value: 0 },
    }),
    []
  );

  const colorsKey = (config.palette || CELESTIAL_RAYS_PRESETS.celestial.palette).join("|");
  const bgColor = config.computedBgColor;
  const isAtmospheric = config.computedAtmospheric;

  useEffect(() => {
    wakeRef.current = invalidate;
    return () => {
      wakeRef.current = null;
    };
  }, [invalidate, wakeRef]);

  useEffect(() => {
    const mat = materialRef.current;
    if (!mat) return;
    const u = mat.uniforms;
    const colorsList = colorsKey ? colorsKey.split("|") : CELESTIAL_RAYS_PRESETS.celestial.palette;
    const count = Math.min(colorsList.length, 4);
    const scratchColor = new THREE.Color();

    for (let i = 0; i < 4; i++) {
      parseColorSafe(
        scratchColor,
        colorsList[Math.min(i, count - 1)],
        CELESTIAL_RAYS_PRESETS.celestial.palette[Math.min(i, 3)]
      );
      rgbToOklabSpace(scratchColor, u.uLabColors.value[i]);
    }
    u.uColorCount.value = count;

    const isTrans = checkIsTransparent(bgColor);
    parseColorSafe(u.uBackgroundColor.value, isTrans ? "#000000" : bgColor, "#000000");
    u.uIsTransparent.value = isTrans ? 1 : 0;
    u.uIsAtmospheric.value = isAtmospheric ? 1 : 0;
    invalidate();
  }, [colorsKey, bgColor, isAtmospheric, invalidate]);

  useEffect(() => {
    invalidate();
  }, [config, size, invalidate]);

  useFrame((state, delta) => {
    const mat = materialRef.current;
    if (!mat) return;
    const u = mat.uniforms;
    const anim = animTimeline.current;
    const ptr = pointerRef.current;

    const dt = Math.min(Math.max(delta, 0), 0.05);
    const speed = config.speed ?? 1.0;
    const isRunning = !config.isPaused && !config.reducedMotion && speed > 0;
    if (isRunning) {
      anim.time += dt * speed;
    }
    const curTime = anim.time;

    const aspect = size.width / Math.max(size.height, 1);
    const angleRad = degToRadians(config.beamAngle ?? 0);
    const tiltRad = degToRadians(clampValue(config.perspectiveTilt ?? 20, -60, 60));
    const origX = ((config.sourceX ?? 0.5) - 0.5) * aspect;
    const origY = (config.sourceY ?? -0.7) - 0.5;
    const axisX = Math.sin(angleRad);
    const axisY = Math.cos(angleRad);

    // Volumetric intersection computation
    const [hingeX, hingeY] = ((ox, oy, dx, dy, asp) => {
      const halfBox = [asp / 2, 0.5];
      const pos = [ox, oy];
      const dir = [dx, dy];
      let tMin = 0;
      let tMax = Infinity;
      for (let i = 0; i < 2; i++) {
        if (Math.abs(dir[i]) < 1e-6) {
          if (pos[i] < -halfBox[i] || pos[i] > halfBox[i]) return [ox, oy];
          continue;
        }
        const t1 = (-halfBox[i] - pos[i]) / dir[i];
        const t2 = (halfBox[i] - pos[i]) / dir[i];
        tMin = Math.max(tMin, Math.min(t1, t2));
        tMax = Math.min(tMax, Math.max(t1, t2));
      }
      return tMin > tMax ? [ox, oy] : [ox + dx * tMin, oy + dy * tMin];
    })(origX, origY, axisX, axisY, aspect);

    const geom = {
      aspect,
      originX: origX,
      originY: origY,
      axisX,
      axisY,
      hingeX,
      hingeY,
      sin: Math.sin(tiltRad),
      cos: Math.cos(tiltRad),
    };

    const isCursorInside =
      (config.interactive ?? true) && !config.reducedMotion && ptr.inside;
    let cursorTheta = 0;

    if (isCursorInside) {
      const [px, py] = ((cx, cy, g) => {
        if (Math.abs(g.sin) < 1e-4) return [cx, cy];
        const perpX = -g.axisX;
        const dx = cx - g.hingeX;
        const dy = cy - g.hingeY;
        const dParallel = dx * g.axisX + dy * g.axisY;
        const hPerp = -g.hingeX * g.axisY - g.hingeY * perpX;
        const hParallel = -g.hingeX * g.axisX - g.hingeY * g.axisY;
        const denom = Math.max((dParallel - hParallel) * g.sin + 1.2 * g.cos, 0.02);
        const factor = (1.2 * g.cos - hParallel * g.sin) / denom;
        const vx = hPerp + factor * (dx * g.axisY + dy * perpX - hPerp);
        const vy = (hParallel + factor * (dParallel - hParallel)) / g.cos;
        return [g.hingeX + vx * g.axisY + vy * g.axisX, g.hingeY + vx * perpX + vy * g.axisY];
      })((ptr.x - 0.5) * aspect, ptr.y - 0.5, geom);

      const relX = px - origX;
      const relY = py - origY;
      cursorTheta = Math.atan2(
        relX * axisY - relY * axisX,
        relX * axisX + relY * axisY
      );
    }

    const spreadRad = degToRadians(clampValue(config.fanSpread ?? 34, 2, 85));
    const count = Math.round(clampValue(config.beamCount ?? 10, 1, 16));
    const osc = clampValue(config.oscillation ?? 1, 0, 3);
    const shimmer = clampValue(config.shimmer ?? 0.6, 0, 1);
    const reach = clampValue(config.reachDistance ?? 1.1, 0.05, 4) / 3;
    const thickness = clampValue(config.beamThickness ?? 1, 0.2, 4);
    const cursorRad = degToRadians(clampValue(config.cursorRadius ?? 5, 1, 60));
    const flare = clampValue(config.cursorFlare ?? 1, 0, 3);
    const seed = config.randomSeed ?? 0;

    let hasGlowDelta = false;

    for (let i = 0; i < count; i++) {
      const pIndex = 7.31 * i + 13 * seed + 1.7;
      const r1 = hashRandom1D(pIndex);
      const r2 = hashRandom1D(pIndex + 0.37);
      const r3 = hashRandom1D(pIndex + 0.71);
      const r4 = hashRandom1D(pIndex + 1.13);

      const baseAngle =
        spreadRad *
          (count > 1 ? ((i + 0.5 + (r1 - 0.5) * 0.6) / count) * 2 - 1 : 0) *
          0.92 +
        smoothNoise1D(curTime * (0.07 + 0.05 * r2) + 61 * r3) * osc * spreadRad * 0.1;

      const beamW =
        (0.024 + 0.07 * Math.pow(r4, 1.3)) *
        thickness *
        (0.85 + 0.15 * smoothNoise1D(0.05 * curTime + 23 * r1));

      const intensityMod =
        (0.45 + 0.75 * Math.pow(r3, 1.2)) *
        (1 -
          shimmer +
          shimmer *
            (0.15 +
              0.85 *
                smoothStepCurve(
                  -0.7,
                  0.8,
                  smoothNoise1D(curTime * (0.18 + 0.12 * r1) + 97 * r2)
                )));

      const diff = baseAngle - cursorTheta;
      const targetGlow = isCursorInside
        ? Math.exp(-(diff * diff) / (cursorRad * cursorRad))
        : 0;

      const currentGlow = anim.glowRays[i];
      const lerpSpeed = targetGlow > currentGlow ? 9 : 2.2;
      anim.glowRays[i] =
        currentGlow + (targetGlow - currentGlow) * (1 - Math.exp(-dt * lerpSpeed));

      if (Math.abs(targetGlow - anim.glowRays[i]) > 0.002) {
        hasGlowDelta = true;
      }

      u.uRayData.value[i].set(
        baseAngle,
        beamW,
        intensityMod * (1 + anim.glowRays[i] * flare * 2.6),
        reach * (0.7 + 0.6 * r2)
      );
    }

    u.uResolution.value.set(
      size.width * state.viewport.dpr,
      size.height * state.viewport.dpr
    );
    u.uTime.value = curTime;
    u.uIsAtmospheric.value = config.computedAtmospheric ? 1 : 0;
    u.uSourceOrigin.value.set(origX, origY);
    u.uBeamAxis.value.set(axisX, axisY);
    u.uHingeAnchor.value.set(hingeX, hingeY);
    u.uTiltParams.value.set(geom.sin, geom.cos, 1.2);
    u.uNearOffset.value = Math.hypot(hingeX - origX, hingeY - origY);
    u.uSpreadAngle.value = spreadRad;
    u.uRayCount.value = count;
    u.uReachLength.value = reach;
    u.uAmbientHaze.value = clampValue(config.ambientHaze ?? 1, 0, 2);
    u.uLuminance.value = clampValue(config.luminance ?? 1, 0, 4);
    u.uFilmGrain.value = clampValue(config.filmGrain ?? 0, 0, 1);
    u.uSeedValue.value = seed;

    if (!isRunning && (hasGlowDelta || isCursorInside)) {
      invalidate();
    }
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={CELESTIAL_VERTEX_SHADER}
        fragmentShader={CELESTIAL_FRAGMENT_SHADER}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
        blending={THREE.NoBlending}
      />
    </mesh>
  );
};

// --- Celestial Rays Root Component ---

export const CelestialRays: React.FC<CelestialRaysProps> = ({
  preset,
  theme = "auto",
  isDark: propIsDark,
  themeMode = "auto",
  palette: propPalette,
  bgColor: propBgColor,
  sourceX: propSourceX,
  sourceY: propSourceY,
  beamAngle: propBeamAngle,
  perspectiveTilt: propPerspectiveTilt,
  fanSpread: propFanSpread,
  beamCount: propBeamCount,
  beamThickness: propBeamThickness,
  reachDistance: propReachDistance,
  oscillation: propOscillation,
  shimmer: propShimmer,
  ambientHaze: propAmbientHaze,
  luminance: propLuminance,
  speed: propSpeed,
  interactive = true,
  cursorFlare: propCursorFlare,
  cursorRadius: propCursorRadius,
  filmGrain = 0,
  randomSeed = 0,
  isPaused = false,
  maxDpr = 1.5,
  className,
  style,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5, inside: false });
  const wakeRef = useRef<(() => void) | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Safe next-themes access
  let resolvedTheme: string | undefined;
  let nextTheme: string | undefined;
  try {
    const context = useTheme();
    resolvedTheme = context.resolvedTheme;
    nextTheme = context.theme;
  } catch {
    // ignore
  }

  // Active theme detector function
  const checkIsLight = useCallback((): boolean => {
    if (typeof propIsDark === "boolean") return !propIsDark;
    if (theme === "light") return true;
    if (theme === "dark") return false;

    if (typeof document !== "undefined") {
      const cl = document.documentElement.classList;
      if (cl.contains("dark")) return false;
      if (cl.contains("light")) return true;

      const dt = document.documentElement.getAttribute("data-theme") || document.documentElement.getAttribute("data-mode");
      if (dt === "dark") return false;
      if (dt === "light") return true;
    }

    if (resolvedTheme === "dark" || nextTheme === "dark") return false;
    if (resolvedTheme === "light" || nextTheme === "light") return true;

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const saved = localStorage.getItem("theme");
        if (saved === "dark") return false;
        if (saved === "light") return true;
      } catch {
        // ignore
      }
    }

    if (typeof document !== "undefined") {
      return !document.documentElement.classList.contains("dark");
    }

    if (typeof window !== "undefined" && window.matchMedia) {
      return !window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  }, [theme, propIsDark, resolvedTheme, nextTheme]);

  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    if (typeof propIsDark === "boolean") return !propIsDark;
    if (theme === "light") return true;
    if (theme === "dark") return false;
    if (typeof document !== "undefined") {
      if (document.documentElement.classList.contains("dark")) return false;
      if (document.documentElement.classList.contains("light")) return true;
      return !document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    setIsLightMode(checkIsLight());

    if (typeof document !== "undefined") {
      const observer = new MutationObserver(() => {
        setIsLightMode(checkIsLight());
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme", "data-mode"],
      });

      const handleStorage = (e: StorageEvent) => {
        if (e.key === "theme") {
          setIsLightMode(checkIsLight());
        }
      };
      window.addEventListener("storage", handleStorage);

      return () => {
        observer.disconnect();
        window.removeEventListener("storage", handleStorage);
      };
    }
  }, [checkIsLight]);

  // Determine whether to use atmospheric ink (light mode) or radiant glow (dark mode)
  const isAtmospheric = useMemo(() => {
    if (themeMode === "atmospheric" || themeMode === "ink") return true;
    if (themeMode === "radiant" || themeMode === "add") return false;
    // When themeMode is 'auto', follow current document theme
    return isLightMode;
  }, [themeMode, isLightMode]);

  // Match preset defaults if passed
  const presetConfig = preset ? CELESTIAL_RAYS_PRESETS[preset] : CELESTIAL_RAYS_PRESETS.celestial;

  const activePalette = propPalette ?? presetConfig.palette;

  // Background color automatically adapts: crisp white in light/atmospheric mode, preset dark in dark mode
  const activeBgColor = useMemo(() => {
    if (propBgColor) return propBgColor;
    return isAtmospheric ? "#ffffff" : presetConfig.background;
  }, [propBgColor, isAtmospheric, presetConfig.background]);

  const activeSourceX = propSourceX ?? presetConfig.sourceX;
  const activeSourceY = propSourceY ?? presetConfig.sourceY;
  const activeBeamAngle = propBeamAngle ?? presetConfig.beamAngle;
  const activeTilt = propPerspectiveTilt ?? presetConfig.perspectiveTilt;
  const activeFanSpread = propFanSpread ?? presetConfig.fanSpread;
  const activeBeamCount = propBeamCount ?? presetConfig.beamCount;
  const activeThickness = propBeamThickness ?? presetConfig.beamThickness;
  const activeReach = propReachDistance ?? presetConfig.reachDistance;
  const activeOscillation = propOscillation ?? presetConfig.oscillation;
  const activeShimmer = propShimmer ?? presetConfig.shimmer;
  const activeAmbientHaze = propAmbientHaze ?? presetConfig.ambientHaze;
  const activeLuminance = propLuminance ?? presetConfig.luminance;
  const activeSpeed = propSpeed ?? presetConfig.speed;
  const activeCursorFlare = propCursorFlare ?? presetConfig.cursorFlare;
  const activeCursorRadius = propCursorRadius ?? presetConfig.cursorRadius;

  // Accessibility reduced motion check
  const reducedMotion = useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", callback);
      return () => mq.removeEventListener("change", callback);
    },
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );

  // Adaptive device pixel ratio
  const screenDpr = useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia("(min-resolution: 2dppx)");
      mq.addEventListener("change", callback);
      window.addEventListener("resize", callback);
      return () => {
        mq.removeEventListener("change", callback);
        window.removeEventListener("resize", callback);
      };
    },
    () => (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1),
    () => 1
  );

  const effectiveDpr = Math.min(screenDpr, Math.max(maxDpr, 0.5));
  const isAnimating = !isPaused && !reducedMotion && activeSpeed > 0;
  const isTransparentBg = checkIsTransparent(activeBgColor);

  // Viewport IntersectionObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "80px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Pointer event listeners
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pointerRef.current.x = (e.clientX - rect.left) / Math.max(rect.width, 1);
      pointerRef.current.y = 1 - (e.clientY - rect.top) / Math.max(rect.height, 1);
      pointerRef.current.inside = true;
      wakeRef.current?.();
    };

    const onPointerLeave = (e: PointerEvent) => {
      if (e.type !== "pointerup" || e.pointerType !== "mouse") {
        pointerRef.current.inside = false;
        wakeRef.current?.();
      }
    };

    el.addEventListener("pointermove", onPointerMove, { passive: true });
    el.addEventListener("pointerdown", onPointerMove, { passive: true });
    el.addEventListener("pointerleave", onPointerLeave, { passive: true });
    el.addEventListener("pointercancel", onPointerLeave, { passive: true });
    el.addEventListener("pointerup", onPointerLeave, { passive: true });

    return () => {
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerdown", onPointerMove);
      el.removeEventListener("pointerleave", onPointerLeave);
      el.removeEventListener("pointercancel", onPointerLeave);
      el.removeEventListener("pointerup", onPointerLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative isolate overflow-hidden w-full h-full min-h-[300px] transition-colors duration-300",
        className
      )}
      style={{
        backgroundColor: isTransparentBg ? undefined : activeBgColor,
        ...style,
      }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <Canvas
          orthographic
          dpr={effectiveDpr}
          frameloop={isVisible && isAnimating ? "always" : "demand"}
          gl={{
            antialias: false,
            alpha: true,
            premultipliedAlpha: true,
            powerPreference: "high-performance",
          }}
          style={{ pointerEvents: "none" }}
        >
          <CelestialMesh
            config={{
              palette: activePalette,
              bgColor: activeBgColor,
              themeMode: isAtmospheric ? "atmospheric" : "radiant",
              sourceX: activeSourceX,
              sourceY: activeSourceY,
              beamAngle: activeBeamAngle,
              perspectiveTilt: activeTilt,
              fanSpread: activeFanSpread,
              beamCount: activeBeamCount,
              beamThickness: activeThickness,
              reachDistance: activeReach,
              oscillation: activeOscillation,
              shimmer: activeShimmer,
              ambientHaze: activeAmbientHaze,
              luminance: activeLuminance,
              speed: activeSpeed,
              interactive,
              cursorFlare: activeCursorFlare,
              cursorRadius: activeCursorRadius,
              filmGrain,
              randomSeed,
              isPaused,
              reducedMotion,
              computedAtmospheric: isAtmospheric,
              computedBgColor: activeBgColor,
            }}
            pointerRef={pointerRef}
            wakeRef={wakeRef}
          />
        </Canvas>
      </div>

      {children ? (
        <div className="relative z-10 w-full h-full flex flex-col justify-center items-center">
          {children}
        </div>
      ) : null}
    </div>
  );
};

export default CelestialRays;
