"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Screen WakeLock Hook (Benchmark: Forest / Hevy)
 * Prevents mobile devices from sleeping during active timers (workouts, focus sessions).
 */
export function useWakeLock(enabled: boolean = false) {
  const [isLocked, setIsLocked] = useState(false);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
        setIsLocked(false);
      }
      return;
    }

    let isMounted = true;

    async function requestLock() {
      if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
        return;
      }

      try {
        const sentinel = await (navigator as any).wakeLock.request("screen");
        if (isMounted) {
          wakeLockRef.current = sentinel;
          setIsLocked(true);

          sentinel.addEventListener("release", () => {
            if (isMounted) setIsLocked(false);
          });
        }
      } catch (err) {
        // Can fail if battery saver is aggressive
        console.warn("WakeLock request refused:", err);
      }
    }

    requestLock();

    // Re-acquire lock if user switches apps and returns
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && enabled && !wakeLockRef.current) {
        requestLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [enabled]);

  return { isLocked };
}
