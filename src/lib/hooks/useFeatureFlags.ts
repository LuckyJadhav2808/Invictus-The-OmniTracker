"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "invictus_cached_flags";

const DEFAULT_FALLBACK_FLAGS: Record<string, any> = {
  enable_in_app_updater: true,
  enable_offline_mutation_queue: true,
  enable_sound_fx: true,
  enable_vix_companion: true,
  enable_experimental_gym_timer: true,
  maintenance_mode: false,
};

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, any>>(() => {
    if (typeof window === "undefined") return DEFAULT_FALLBACK_FLAGS;
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return { ...DEFAULT_FALLBACK_FLAGS, ...JSON.parse(cached) };
      }
    } catch {}
    return DEFAULT_FALLBACK_FLAGS;
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadFlags() {
      try {
        const res = await fetch("/api/config/flags", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.flags && isMounted) {
            setFlags((prev) => {
              const updated = { ...prev, ...data.flags };
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote feature flags, using cached flags:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadFlags();

    return () => {
      isMounted = false;
    };
  }, []);

  const isEnabled = (key: string, defaultValue: boolean = true): boolean => {
    const val = flags[key];
    if (typeof val === "boolean") return val;
    return defaultValue;
  };

  const getFlag = <T = any>(key: string, defaultValue: T): T => {
    return flags[key] !== undefined ? flags[key] : defaultValue;
  };

  return { flags, isEnabled, getFlag, isLoading };
}
