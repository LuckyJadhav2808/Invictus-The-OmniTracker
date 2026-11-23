"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { Check, AlertTriangle, Trash2, LucideIcon } from "lucide-react";

export interface TactileHoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onConfirm: () => void | Promise<void>;
  label?: string;
  confirmingLabel?: string;
  confirmedLabel?: string;
  holdDurationMs?: number;
  variant?: "danger" | "default" | "success";
  icon?: LucideIcon;
}

export function TactileHoldButton({
  onConfirm,
  label = "Hold to Confirm",
  confirmingLabel = "Keep Holding...",
  confirmedLabel = "Confirmed!",
  holdDurationMs = 1200,
  variant = "danger",
  icon: Icon = Trash2,
  className,
  disabled,
  ...props
}: TactileHoldButtonProps) {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const hasTriggeredRef = useRef(false);

  const cancelHold = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    startTimeRef.current = null;
    setIsHolding(false);
    setProgress(0);
  }, []);

  const startHold = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || isConfirmed || isPending) return;
      // Primary click only
      if (e.button !== 0 && e.pointerType === "mouse") return;

      soundFX.playPop();
      soundFX.vibrate(15);
      setIsHolding(true);
      hasTriggeredRef.current = false;
      startTimeRef.current = performance.now();

      const tick = (now: number) => {
        if (!startTimeRef.current) return;
        const elapsed = now - startTimeRef.current;
        const currentProgress = Math.min(100, (elapsed / holdDurationMs) * 100);
        setProgress(currentProgress);

        if (currentProgress >= 100 && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          soundFX.playCompleteChime();
          soundFX.vibrate([20, 40, 20]);
          setIsConfirmed(true);
          setIsPending(true);

          Promise.resolve(onConfirm())
            .catch(() => {})
            .finally(() => {
              setIsPending(false);
              setTimeout(() => {
                setIsConfirmed(false);
                setProgress(0);
              }, 1500);
            });
          return;
        }

        if (currentProgress < 100) {
          animFrameRef.current = requestAnimationFrame(tick);
        }
      };

      animFrameRef.current = requestAnimationFrame(tick);
    },
    [disabled, isConfirmed, isPending, holdDurationMs, onConfirm]
  );

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Theme variants
  const colorMap = {
    danger: {
      border: "border-[#161514] dark:border-[#2A2724]",
      fill: "bg-[#F43F5E]",
      activeText: "text-white",
      hover: "hover:border-[#F43F5E]",
      idleText: "text-[#F43F5E] dark:text-[#FB7185]",
    },
    default: {
      border: "border-[#161514] dark:border-[#2A2724]",
      fill: "bg-[#CEF431]",
      activeText: "text-[#161514]",
      hover: "hover:border-[#CEF431]",
      idleText: "text-[#161514] dark:text-[#FAF8F5]",
    },
    success: {
      border: "border-[#161514] dark:border-[#2A2724]",
      fill: "bg-[#03D26F]",
      activeText: "text-[#161514]",
      hover: "hover:border-[#03D26F]",
      idleText: "text-[#03D26F]",
    },
  }[variant];

  return (
    <button
      type="button"
      disabled={disabled || isPending}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "relative overflow-hidden group select-none touch-none",
        "px-4 py-2.5 rounded-xl border-2 font-heading font-black text-xs",
        "bg-white dark:bg-[#1C1A18] transition-all duration-150 cursor-pointer",
        "shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000]",
        "active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
        colorMap.border,
        colorMap.hover,
        isHolding && "scale-[0.98]",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
      {...props}
    >
      {/* Dynamic Animated Progress Track Fill */}
      <span
        className={cn(
          "absolute inset-0 transition-[width] ease-linear pointer-events-none opacity-85",
          colorMap.fill
        )}
        style={{ width: `${progress}%` }}
        aria-hidden="true"
      />

      {/* Button Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isConfirmed ? (
          <>
            <Check className="size-3.5 stroke-[3] text-white dark:text-[#161514]" />
            <span className="text-white dark:text-[#161514]">{confirmedLabel}</span>
          </>
        ) : isHolding ? (
          <>
            <AlertTriangle className="size-3.5 stroke-[2.5] animate-pulse text-white dark:text-[#161514]" />
            <span className="text-white dark:text-[#161514] font-black">{confirmingLabel}</span>
          </>
        ) : (
          <>
            <Icon className={cn("size-3.5 stroke-[2.5]", colorMap.idleText)} />
            <span className={colorMap.idleText}>{label}</span>
          </>
        )}
      </span>
    </button>
  );
}
