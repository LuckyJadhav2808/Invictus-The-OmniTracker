import { useState, useMemo, useEffect } from "react";
import { Sunrise, Zap, Moon } from "lucide-react";

export type DaypartMode = "auto" | "dawn" | "forge" | "night";
export type EffectiveDaypart = "dawn" | "forge" | "night";

export interface DaypartConfig {
  id: EffectiveDaypart;
  title: string;
  greeting: string;
  subtitle: string;
  accentBg: string;
  badgeBg: string;
  textColor: string;
  badgeText: string;
  icon: typeof Sunrise;
  glowBorder: string;
}

export const DAYPART_CONFIGS: Record<EffectiveDaypart, DaypartConfig> = {
  dawn: {
    id: "dawn",
    title: "Dawn Patrol",
    greeting: "Rise & Conquer, Gladiator",
    subtitle: "Morning momentum, hydration & routine check",
    accentBg: "bg-[#CEF431]",
    badgeBg: "bg-[#CEF431]",
    textColor: "text-[#161514]",
    badgeText: "DAWN PATROL • 06:00-12:00",
    icon: Sunrise,
    glowBorder: "border-[#161514]",
  },
  forge: {
    id: "forge",
    title: "The Forge",
    greeting: "Deep Work Sprint in Progress",
    subtitle: "Lock in flow state, track budget & conquer priorities",
    accentBg: "bg-[#C084FC]",
    badgeBg: "bg-[#C084FC]",
    textColor: "text-[#161514]",
    badgeText: "THE FORGE • 12:00-18:00",
    icon: Zap,
    glowBorder: "border-[#161514]",
  },
  night: {
    id: "night",
    title: "Night Fortress",
    greeting: "Evening Reflection & Rest",
    subtitle: "Review today's ledger, preserve streak & plan tomorrow",
    accentBg: "bg-[#161514]",
    badgeBg: "bg-[#161514]",
    textColor: "text-white",
    badgeText: "NIGHT FORTRESS • 18:00-24:00",
    icon: Moon,
    glowBorder: "border-[#161514]",
  },
};

export function getEffectiveDaypartFromHour(hour: number): EffectiveDaypart {
  if (hour >= 5 && hour < 12) return "dawn";
  if (hour >= 12 && hour < 18) return "forge";
  return "night";
}

export function useTodayCockpitViewModel() {
  const [daypartMode, setDaypartMode] = useState<DaypartMode>("auto");
  const [currentHour, setCurrentHour] = useState<number>(() => new Date().getHours());

  // Update current hour periodically (every 60s)
  useEffect(() => {
    const updateHour = () => setCurrentHour(new Date().getHours());
    const interval = setInterval(updateHour, 60000);
    return () => clearInterval(interval);
  }, []);

  // Compute effective daypart
  const effectiveDaypart: EffectiveDaypart = useMemo(() => {
    if (daypartMode !== "auto") return daypartMode;
    return getEffectiveDaypartFromHour(currentHour);
  }, [daypartMode, currentHour]);

  const activeConfig = DAYPART_CONFIGS[effectiveDaypart];

  return {
    daypartMode,
    setDaypartMode,
    effectiveDaypart,
    activeConfig,
  };
}
