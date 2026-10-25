"use client";

import React, {
  forwardRef,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export type CursorWaveShape = "circle" | "triangle" | "square";

export type CursorWaveColor = string | { stops: [string, string] };

export interface CursorWaveRef {
  burst: (clientX?: number, clientY?: number) => void;
}

export interface CursorWaveProps {
  /** Container width */
  width?: string | number;
  /** Container height */
  height?: string | number;
  /** Additional CSS classes for container */
  className?: string;
  /** Content rendered above the canvas */
  children?: React.ReactNode;
  /** Pixel spacing between cell centres (16–96, default: 38) */
  cellSize?: number;
  /** Cursor influence radius as a percentage of min(width, height) (5–80, default: 28) */
  influenceRadiusVmin?: number;
  /** Time constant in seconds for the swell-up ease (0.05–2, default: 0.4) */
  attackTime?: number;
  /** Time constant in seconds for the relax-down ease (0.05–2, default: 0.6) */
  releaseTime?: number;
  /** Resting scale applied to every shape (0–0.5, default: 0.35) */
  idleScale?: number;
  /** Minimum peak scale assigned per cell on hover (0.5–4, default: 1.2) */
  minPeakScale?: number;
  /** Maximum peak scale assigned per cell on hover (1–6, default: 3.0) */
  maxPeakScale?: number;
  /** Click-burst expansion speed in pixels/second (200–4000, default: 1200) */
  burstSpeed?: number;
  /** Click-burst ring thickness in pixels (40–600, default: 180) */
  burstThickness?: number;
  /** Background fill color. Pass "transparent" to let parent background show through. */
  backgroundColor?: string;
  /** Theme mode: "auto" detects html dark/light class, or explicit "light" | "dark" */
  themeMode?: "auto" | "light" | "dark";
  /** Pool of shapes randomly assigned across the grid */
  shapes?: CursorWaveShape[];
  /** Color pool. Strings are solid hex/CSS colors; objects produce a 2-stop radial gradient */
  colors?: CursorWaveColor[];
  /** Maximum device pixel ratio (caps GPU work) (1–3, default: 2) */
  dpr?: number;
  /** Master alpha (0–1, default: 1) */
  opacity?: number;
  /** Enable automatic ambient bursts when idle (default: true) */
  enableIdleBurst?: boolean;
  /** Custom inline style */
  style?: React.CSSProperties;
}

// Preset color collections
export const CURSOR_WAVE_PALETTES: Record<string, CursorWaveColor[]> = {
  // Monochrome Dark (for dark backgrounds: crisp white, titanium, silver)
  monochromeDark: [
    "#ffffff",
    "#f4f4f5",
    "#e4e4e7",
    "#d4d4d8",
    "#a1a1aa",
    "#71717a",
    { stops: ["#ffffff", "#a1a1aa"] },
    { stops: ["#f4f4f5", "#71717a"] },
    { stops: ["#e4e4e7", "#52525b"] },
  ],
  // Monochrome Light (for light backgrounds: deep obsidian, charcoal, zinc-800, slate-700)
  monochromeLight: [
    "#09090b",
    "#18181b",
    "#27272a",
    "#3f3f46",
    "#52525b",
    "#71717a",
    { stops: ["#09090b", "#52525b"] },
    { stops: ["#18181b", "#71717a"] },
    { stops: ["#27272a", "#3f3f46"] },
  ],
  // Default legacy alias (points to monochromeDark)
  monochrome: [
    "#ffffff",
    "#f4f4f5",
    "#e4e4e7",
    "#d4d4d8",
    "#a1a1aa",
    "#71717a",
    { stops: ["#ffffff", "#a1a1aa"] },
    { stops: ["#e4e4e7", "#52525b"] },
  ],
  cyberNeon: [
    "#06b6d4",
    "#ec4899",
    "#8b5cf6",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    { stops: ["#06b6d4", "#6366f1"] },
    { stops: ["#ec4899", "#8b5cf6"] },
    { stops: ["#10b981", "#06b6d4"] },
    { stops: ["#f59e0b", "#ec4899"] },
  ],
  emeraldMatrix: [
    "#10b981",
    "#059669",
    "#34d399",
    "#6ee7b7",
    "#047857",
    "#14b8a6",
    { stops: ["#34d399", "#059669"] },
    { stops: ["#10b981", "#047857"] },
  ],
  solarFlare: [
    "#f97316",
    "#fb923c",
    "#f59e0b",
    "#ef4444",
    "#facc15",
    { stops: ["#f97316", "#ef4444"] },
    { stops: ["#facc15", "#f97316"] },
    { stops: ["#fb923c", "#dc2626"] },
  ],
  electricViolet: [
    "#8b5cf6",
    "#a78bfa",
    "#6366f1",
    "#c084fc",
    "#ec4899",
    { stops: ["#8b5cf6", "#6366f1"] },
    { stops: ["#c084fc", "#ec4899"] },
    { stops: ["#a78bfa", "#4f46e5"] },
  ],
};

const DEFAULT_SHAPES: CursorWaveShape[] = ["circle", "triangle", "square"];
const TWO_PI = 2 * Math.PI;

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function smoothResponse(timeInSeconds: number): number {
  return timeInSeconds <= 0 ? 1 : 1 - Math.pow(0.05, 1 / (60 * timeInSeconds));
}

interface Cell {
  x: number;
  y: number;
  shape: CursorWaveShape;
  color: CursorWaveColor;
  angle: number;
  size: number;
  scale: number;
  peak: number;
  hovered: boolean;
}

interface Ripple {
  x: number;
  y: number;
  start: number;
}

interface RuntimeState {
  cells: Cell[];
  ripples: Ripple[];
  pointer: { x: number; y: number } | null;
  pointerEnergy: number;
  maskRects: DOMRect[];
  maskFrame: number;
  suspendMasks: boolean;
  suspendMaskUntil: number;
  width: number;
  height: number;
  dpr: number;
  raf: number;
  lastIdleBurst: number;
}

export const CursorWave = forwardRef<CursorWaveRef, CursorWaveProps>(
  (
    {
      width = "100%",
      height = "100%",
      className,
      children,
      cellSize = 38,
      influenceRadiusVmin = 28,
      attackTime = 0.4,
      releaseTime = 0.6,
      idleScale = 0.35,
      minPeakScale = 1.2,
      maxPeakScale = 2.8,
      burstSpeed = 1200,
      burstThickness = 180,
      backgroundColor = "transparent",
      themeMode = "auto",
      shapes = DEFAULT_SHAPES,
      colors,
      dpr = 2,
      opacity = 1,
      enableIdleBurst = true,
      style,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef<RuntimeState | null>(null);

    // Theme state detection
    const { resolvedTheme, theme: nextTheme } = useTheme();
    const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

    useEffect(() => {
      const detectTheme = () => {
        if (themeMode === "light") return false;
        if (themeMode === "dark") return true;

        if (typeof document !== "undefined") {
          if (document.documentElement.classList.contains("dark")) return true;
          if (document.documentElement.classList.contains("light")) return false;
        }
        if (resolvedTheme) return resolvedTheme === "dark";
        if (nextTheme) return nextTheme === "dark";
        return true;
      };

      setIsDarkMode(detectTheme());

      if (themeMode === "auto" && typeof document !== "undefined") {
        const observer = new MutationObserver(() => {
          setIsDarkMode(detectTheme());
        });
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class"],
        });
        return () => observer.disconnect();
      }
    }, [themeMode, resolvedTheme, nextTheme]);

    // Active color pool calculation
    const resolvedColors = useMemo(() => {
      if (colors && colors.length > 0) return colors;
      return isDarkMode
        ? CURSOR_WAVE_PALETTES.monochromeDark
        : CURSOR_WAVE_PALETTES.monochromeLight;
    }, [colors, isDarkMode]);

    if (stateRef.current === null) {
      stateRef.current = {
        cells: [],
        ripples: [],
        pointer: null,
        pointerEnergy: 0,
        maskRects: [],
        maskFrame: 0,
        suspendMasks: false,
        suspendMaskUntil: 0,
        width: 0,
        height: 0,
        dpr: 1,
        raf: 0,
        lastIdleBurst: 0,
      };
    }

    const configRef = useRef({
      cellSize,
      influenceRadiusVmin,
      attackTime,
      releaseTime,
      idleScale,
      minPeakScale,
      maxPeakScale,
      burstSpeed,
      burstThickness,
      backgroundColor,
      shapes,
      colors: resolvedColors,
      opacity,
      enableIdleBurst,
    });

    useEffect(() => {
      configRef.current = {
        cellSize,
        influenceRadiusVmin,
        attackTime,
        releaseTime,
        idleScale,
        minPeakScale,
        maxPeakScale,
        burstSpeed,
        burstThickness,
        backgroundColor,
        shapes,
        colors: resolvedColors,
        opacity,
        enableIdleBurst,
      };
    }, [
      cellSize,
      influenceRadiusVmin,
      attackTime,
      releaseTime,
      idleScale,
      minPeakScale,
      maxPeakScale,
      burstSpeed,
      burstThickness,
      backgroundColor,
      shapes,
      resolvedColors,
      opacity,
      enableIdleBurst,
    ]);

    // Grid recalculation
    const buildGrid = useCallback(() => {
      const state = stateRef.current;
      if (!state) return;
      const w = state.width;
      const h = state.height;
      if (w <= 0 || h <= 0) return;

      const cfg = configRef.current;
      const step = Math.max(cfg.cellSize, 8);
      const cols = Math.max(1, Math.floor(w / step));
      const rows = Math.max(1, Math.floor(h / step));
      const offsetX = (w - (cols - 1) * step) / 2;
      const offsetY = (h - (rows - 1) * step) / 2;

      const shapePool = cfg.shapes.length > 0 ? cfg.shapes : DEFAULT_SHAPES;
      const colorPool = cfg.colors.length > 0 ? cfg.colors : CURSOR_WAVE_PALETTES.monochromeDark;

      const nextCells: Cell[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          nextCells.push({
            x: offsetX + c * step,
            y: offsetY + r * step,
            shape: randomPick(shapePool),
            color: randomPick(colorPool),
            angle: randomRange(0, TWO_PI),
            size: 0.38 * step,
            scale: cfg.idleScale,
            peak: randomRange(cfg.minPeakScale, cfg.maxPeakScale),
            hovered: false,
          });
        }
      }
      state.cells = nextCells;
    }, []);

    // Canvas resize
    const handleResize = useCallback(() => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!state || !canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      const targetDpr = Math.min(
        typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
        Math.max(dpr, 1)
      );

      canvas.width = w * targetDpr;
      canvas.height = h * targetDpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(targetDpr, targetDpr);
      }

      state.width = w;
      state.height = h;
      state.dpr = targetDpr;
      buildGrid();
    }, [buildGrid, dpr]);

    // Imperative Burst trigger
    const triggerBurst = useCallback(
      (clientX?: number, clientY?: number) => {
        const state = stateRef.current;
        const container = containerRef.current;
        if (!state || !container) return;

        let posX: number;
        let posY: number;
        if (clientX === undefined || clientY === undefined) {
          posX = state.width / 2;
          posY = state.height / 2;
        } else {
          const rect = container.getBoundingClientRect();
          posX = clientX - rect.left;
          posY = clientY - rect.top;
        }

        state.ripples.push({
          x: posX,
          y: posY,
          start: performance.now(),
        });

        const maxDiagonal = Math.sqrt(
          state.width * state.width + state.height * state.height
        );
        const duration =
          (maxDiagonal / Math.max(configRef.current.burstSpeed, 1)) * 1000;
        state.suspendMasks = true;
        state.suspendMaskUntil = performance.now() + duration;
      },
      []
    );

    useImperativeHandle(ref, () => ({ burst: triggerBurst }), [triggerBurst]);

    // Main animation loop
    useEffect(() => {
      const state = stateRef.current;
      if (!state) return;
      handleResize();

      const animate = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const cfg = configRef.current;
        const w = state.width;
        const h = state.height;
        const now = performance.now();
        const vminRadius = Math.min(w, h) * (cfg.influenceRadiusVmin / 100);

        // Background drawing: either solid fill or clean transparent clear
        if (cfg.backgroundColor === "transparent" || !cfg.backgroundColor) {
          ctx.clearRect(0, 0, w, h);
        } else {
          ctx.globalAlpha = 1;
          ctx.fillStyle = cfg.backgroundColor;
          ctx.fillRect(0, 0, w, h);
        }

        // Pointer decay
        state.pointerEnergy *= 0.93;

        // Periodic element mask inspection
        state.maskFrame += 1;
        if (state.maskFrame % 12 === 0 && containerRef.current) {
          const maskElements = containerRef.current.querySelectorAll(
            "[data-cursor-wave-mask]"
          );
          const cRect = containerRef.current.getBoundingClientRect();
          const rects: DOMRect[] = [];
          maskElements.forEach((el) => {
            const r = el.getBoundingClientRect();
            rects.push(
              new DOMRect(r.left - cRect.left, r.top - cRect.top, r.width, r.height)
            );
          });
          state.maskRects = rects;
        }

        // Mask suspension check
        if (state.suspendMasks && now >= state.suspendMaskUntil) {
          state.suspendMasks = false;
        }

        // Ambient idle bursts
        if (
          cfg.enableIdleBurst &&
          !state.pointer &&
          now - state.lastIdleBurst > 3200
        ) {
          state.lastIdleBurst = now;
          const ambientX =
            w * (0.2 + 0.6 * (0.5 + 0.5 * Math.sin(now * 0.001)));
          const ambientY =
            h * (0.2 + 0.6 * (0.5 + 0.5 * Math.cos(now * 0.0014)));
          triggerBurst(ambientX + containerRef.current!.getBoundingClientRect().left, ambientY + containerRef.current!.getBoundingClientRect().top);
        }

        // Ripple filtering
        const maxDiagonal = Math.sqrt(w * w + h * h);
        state.ripples = state.ripples.filter(
          (rp) =>
            ((now - rp.start) / 1000) * cfg.burstSpeed <
            maxDiagonal + cfg.burstThickness
        );

        const maskPadding = 0.5 * cfg.cellSize;
        const attackEase = smoothResponse(cfg.attackTime);
        const releaseEase = smoothResponse(cfg.releaseTime);

        ctx.globalAlpha = cfg.opacity;

        // Draw and update each cell
        const cells = state.cells;
        for (let i = 0; i < cells.length; i++) {
          const cell = cells[i];

          // 1. Check DOM Element Masks
          let isMasked = false;
          if (!state.suspendMasks && state.maskRects.length > 0) {
            for (let m = 0; m < state.maskRects.length; m++) {
              const r = state.maskRects[m];
              if (
                cell.x >= r.left - maskPadding &&
                cell.x <= r.right + maskPadding &&
                cell.y >= r.top - maskPadding &&
                cell.y <= r.bottom + maskPadding
              ) {
                isMasked = true;
                break;
              }
            }
          }

          if (isMasked) {
            cell.scale += (0 - cell.scale) * releaseEase;
            if (cell.scale < 0.005) cell.scale = 0;
            continue;
          }

          // 2. Cursor Influence
          let pointerForce = 0;
          if (state.pointer && state.pointerEnergy > 0.001 && vminRadius > 0) {
            const dx = cell.x - state.pointer.x;
            const dy = cell.y - state.pointer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < vminRadius) {
              const norm = 1 - dist / vminRadius;
              const smooth = norm * norm * (3 - 2 * norm);
              pointerForce = smooth * state.pointerEnergy;

              if (pointerForce > 0.05 && !cell.hovered) {
                cell.hovered = true;
                cell.peak = randomRange(cfg.minPeakScale, cfg.maxPeakScale);
                cell.angle = randomRange(0, TWO_PI);
              } else if (pointerForce <= 0.05) {
                cell.hovered = false;
              }
            } else {
              cell.hovered = false;
            }
          } else {
            cell.hovered = false;
          }

          // 3. Ripple Shockwave Influence
          let rippleForce = 0;
          for (let r = 0; r < state.ripples.length; r++) {
            const rp = state.ripples[r];
            const waveRadius = ((now - rp.start) / 1000) * cfg.burstSpeed;
            const dx = cell.x - rp.x;
            const dy = cell.y - rp.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const distDelta = 1 - Math.abs(dist - waveRadius) / cfg.burstThickness;
            if (distDelta > 0) {
              const pulse = Math.sin(Math.PI * distDelta);
              if (pulse > rippleForce) rippleForce = pulse;
            }
          }

          // 4. Harmonic Idle Wave
          const range = cell.peak - cfg.idleScale;
          const idleWave =
            Math.sin(now * 0.002 + cell.x * 0.015 + cell.y * 0.015) * 0.22;
          const targetHover =
            cfg.idleScale + Math.max(0, idleWave) * range * 0.4 + pointerForce * range;
          const targetRipple = cfg.idleScale + rippleForce * range;
          const targetScale = Math.max(targetHover, targetRipple);
          const ease = targetScale > cell.scale ? attackEase : releaseEase;

          cell.scale += (targetScale - cell.scale) * ease;

          // Render Shape
          if (cell.scale < 0.15 * cfg.idleScale) continue;

          ctx.save();
          ctx.translate(cell.x, cell.y);
          ctx.rotate(cell.angle);
          ctx.scale(cell.scale, cell.scale);

          // Apply Fill (solid or radial gradient)
          if (typeof cell.color === "string") {
            ctx.fillStyle = cell.color;
          } else {
            const grad = ctx.createRadialGradient(
              0,
              -0.3 * cell.size,
              0,
              0,
              0.3 * cell.size,
              1.5 * cell.size
            );
            grad.addColorStop(0, cell.color.stops[0]);
            grad.addColorStop(1, cell.color.stops[1]);
            ctx.fillStyle = grad;
          }

          // Draw specific geometry
          switch (cell.shape) {
            case "circle": {
              ctx.beginPath();
              ctx.arc(0, 0, 0.6 * cell.size, 0, TWO_PI);
              ctx.fill();
              break;
            }
            case "square": {
              const half = 0.6 * cell.size;
              ctx.beginPath();
              if (typeof ctx.roundRect === "function") {
                ctx.roundRect(-half, -half, 2 * half, 2 * half, 0.12 * cell.size);
              } else {
                ctx.rect(-half, -half, 2 * half, 2 * half);
              }
              ctx.fill();
              break;
            }
            case "triangle": {
              const radius = 0.78 * cell.size;
              ctx.beginPath();
              for (let pt = 0; pt < 3; pt++) {
                const angle = -Math.PI / 2 + (pt * TWO_PI) / 3;
                const px = Math.cos(angle) * radius;
                const py = Math.sin(angle) * radius;
                if (pt === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.closePath();
              ctx.fill();
              break;
            }
          }

          ctx.restore();
        }

        ctx.globalAlpha = 1;
        state.raf = requestAnimationFrame(animate);
      };

      state.raf = requestAnimationFrame(animate);

      // Resize observation
      let resizeObs: ResizeObserver | null = null;
      const el = containerRef.current;
      if (el && typeof ResizeObserver !== "undefined") {
        resizeObs = new ResizeObserver(() => handleResize());
        resizeObs.observe(el);
      } else {
        window.addEventListener("resize", handleResize);
      }

      return () => {
        cancelAnimationFrame(state.raf);
        if (resizeObs) resizeObs.disconnect();
        else window.removeEventListener("resize", handleResize);
      };
    }, [handleResize, triggerBurst]);

    // Pointer move listener
    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
      const state = stateRef.current;
      const container = containerRef.current;
      if (!state || !container) return;
      const rect = container.getBoundingClientRect();
      state.pointer = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      state.pointerEnergy = 1;
    }, []);

    const handlePointerLeave = useCallback(() => {
      const state = stateRef.current;
      if (state) state.pointer = null;
    }, []);

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        // Trigger burst on click if not clicking on child button or input
        if ((e.target as HTMLElement).closest("button, a, input, select, textarea")) {
          return;
        }
        triggerBurst(e.clientX, e.clientY);
      },
      [triggerBurst]
    );

    const memoKey = useMemo(
      () => `${cellSize}|${shapes.join(",")}|${resolvedColors.length}|${isDarkMode}`,
      [cellSize, shapes, resolvedColors, isDarkMode]
    );

    useEffect(() => {
      buildGrid();
    }, [memoKey, buildGrid]);

    return (
      <div
        ref={containerRef}
        className={cn("relative overflow-hidden select-none", className)}
        style={{
          width,
          height,
          ...style,
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block h-full w-full pointer-events-none"
        />
        {children && (
          <div className="relative z-10 h-full w-full">{children}</div>
        )}
      </div>
    );
  }
);

CursorWave.displayName = "CursorWave";
export default CursorWave;
