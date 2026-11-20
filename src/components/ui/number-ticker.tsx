"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface NumberTickerProps {
  value: number;
  initialValue?: number;
  direction?: "up" | "down";
  duration?: number; // milliseconds
  delay?: number; // milliseconds
  prefix?: string;
  suffix?: string;
  className?: string;
  decimalPlaces?: number;
  formatWithCommas?: boolean;
}

export function NumberTicker({
  value,
  initialValue,
  duration = 350,
  delay = 0,
  prefix = "",
  suffix = "",
  className,
  decimalPlaces = 0,
  formatWithCommas = true,
}: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState<number>(() =>
    initialValue !== undefined ? initialValue : value
  );
  const prevValueRef = useRef<number>(value);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const targetValue = value;
    prevValueRef.current = targetValue;

    if (startValue === targetValue) {
      setDisplayValue(targetValue);
      return;
    }

    let timeoutId: NodeJS.Timeout | null = null;

    const startAnimation = () => {
      startTimeRef.current = null;

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);

        // Apple / Emil Kowalski spring-like ease-out quint curve: 1 - pow(1 - t, 4)
        const easeOut = 1 - Math.pow(1 - progress, 4);
        const current = startValue + (targetValue - startValue) * easeOut;

        setDisplayValue(current);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayValue(targetValue);
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    };

    if (delay > 0) {
      timeoutId = setTimeout(startAnimation, delay);
    } else {
      startAnimation();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, delay]);

  const formattedNumber = (() => {
    const fixed = displayValue.toFixed(decimalPlaces);
    if (!formatWithCommas) return fixed;

    const parts = fixed.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  })();

  return (
    <span
      className={cn(
        "inline-flex items-baseline font-mono tabular-nums tracking-tight select-none",
        className
      )}
    >
      {prefix && <span className="opacity-80 select-none mr-0.5">{prefix}</span>}
      <span>{formattedNumber}</span>
      {suffix && <span className="opacity-80 select-none ml-0.5">{suffix}</span>}
    </span>
  );
}
