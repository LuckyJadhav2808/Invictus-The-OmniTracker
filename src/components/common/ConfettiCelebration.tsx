'use client';

import React, { useEffect, useRef } from 'react';

interface ConfettiCelebrationProps {
  active: boolean;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const CELEBRATION_COLORS = [
  '#CEF431', // Neon lime
  '#03D26F', // Emerald
  '#FF4343', // Hazard coral
  '#FFB800', // Trophy gold
  '#38BDF8', // Cyan
  '#161514', // Carbon ink
];

export function ConfettiCelebration({ active, onComplete }: ConfettiCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Respect user's reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (onComplete) onComplete();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    // Initialize 90 geometric confetti pieces
    const particles: Particle[] = Array.from({ length: 90 }, () => {
      return {
        x: width * (0.3 + Math.random() * 0.4), // burst from center
        y: height * 0.35,
        w: Math.random() * 8 + 6,
        h: Math.random() * 12 + 8,
        color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
        vx: (Math.random() - 0.5) * 18,
        vy: -Math.random() * 14 - 6, // blast upward
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
      };
    });

    let animationFrameId: number;
    const gravity = 0.45;
    const drag = 0.98;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      let aliveCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.vy += gravity;
        p.vx *= drag;
        p.rotation += p.rotationSpeed;

        // Fade out as it drops below 70% viewport
        if (p.y > height * 0.6) {
          p.opacity -= 0.02;
        }

        if (p.opacity > 0 && p.y < height + 50) {
          aliveCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.opacity);
          // Neobrutalist bold border around confetti piece
          ctx.strokeStyle = '#161514';
          ctx.lineWidth = 1;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }

      if (aliveCount > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
        if (onComplete) onComplete();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    />
  );
}
