"use client";

export interface ConfettiBurstOptions {
  x?: number; // Origin X in viewport coordinates (default: window.innerWidth / 2)
  y?: number; // Origin Y in viewport coordinates (default: window.innerHeight / 2)
  count?: number; // Number of geometric shards (default: 42)
  duration?: number; // Duration in ms before cleanup (default: 800)
}

interface Shard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  shape: "square" | "diamond" | "pill" | "shard";
  color: string;
  rotation: number;
  rotSpeed: number;
  scaleX: number;
  scaleY: number;
  flipSpeed: number;
  opacity: number;
}

const NEOBRUTALIST_PALETTE = [
  "#161514", // Obsidian Ink
  "#CEF431", // Electric Lime
  "#03D26F", // Malachite Emerald
  "#C084FC", // Lavender
  "#FAF8F5", // Cream Surface
  "#FF5C00", // Blaze Orange
];

/**
 * Triggers a Neobrutalist geometric confetti burst (squares, diamonds, pills).
 * Zero external dependencies. Self-cleans DOM in <850ms.
 */
export function confettiBurst(options: ConfettiBurstOptions = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // Respect reduced motion accessibility
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const {
    x = window.innerWidth / 2,
    y = window.innerHeight * 0.45,
    count = 45,
    duration = 800,
  } = options;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.zIndex = "99999";
  canvas.style.pointerEvents = "none";
  canvas.style.userSelect = "none";

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  ctx.scale(dpr, dpr);

  const shards: Shard[] = [];
  const shapes: Array<Shard["shape"]> = ["square", "diamond", "pill", "shard"];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Radial burst with bias upward
    const speed = 6 + Math.random() * 10;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - (3 + Math.random() * 4); // Upward momentum

    const size = 6 + Math.random() * 7;
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const color = NEOBRUTALIST_PALETTE[Math.floor(Math.random() * NEOBRUTALIST_PALETTE.length)];

    shards.push({
      x,
      y,
      vx,
      vy,
      width: shape === "pill" ? size * 1.8 : size,
      height: size,
      shape,
      color,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.25,
      scaleX: 1,
      scaleY: 1,
      flipSpeed: 0.08 + Math.random() * 0.12,
      opacity: 1,
    });
  }

  const startTime = performance.now();

  const render = (time: number) => {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    shards.forEach((s) => {
      // Physics
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.38; // Gravity
      s.vx *= 0.96; // Air resistance
      s.vy *= 0.98;

      s.rotation += s.rotSpeed;
      s.scaleX = Math.cos(elapsed * 0.01 * s.flipSpeed);

      // Fade out towards the end
      if (progress > 0.6) {
        s.opacity = Math.max(0, 1 - (progress - 0.6) / 0.4);
      }

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);
      ctx.scale(s.scaleX, 1);
      ctx.globalAlpha = s.opacity;

      ctx.fillStyle = s.color;
      ctx.strokeStyle = "#161514";
      ctx.lineWidth = 1;

      if (s.shape === "square" || s.shape === "shard") {
        ctx.fillRect(-s.width / 2, -s.height / 2, s.width, s.height);
        ctx.strokeRect(-s.width / 2, -s.height / 2, s.width, s.height);
      } else if (s.shape === "diamond") {
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-s.width / 2, -s.height / 2, s.width, s.height);
        ctx.strokeRect(-s.width / 2, -s.height / 2, s.width, s.height);
      } else if (s.shape === "pill") {
        ctx.beginPath();
        const r = s.height / 2;
        ctx.roundRect(-s.width / 2, -s.height / 2, s.width, s.height, r);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    });

    if (progress < 1) {
      requestAnimationFrame(render);
    } else {
      canvas.remove();
    }
  };

  requestAnimationFrame(render);
}
