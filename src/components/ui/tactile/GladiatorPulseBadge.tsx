"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { Shield, Sparkles, Flame, Droplet, LucideIcon } from "lucide-react";

export type GladiatorStatus = "active" | "conquered" | "warning" | "shielded" | "neutral";

export interface GladiatorPulseBadgeProps {
  status?: GladiatorStatus;
  label: string;
  subtext?: string;
  icon?: LucideIcon;
  pulse?: boolean;
  onClick?: () => void;
  className?: string;
}

export function GladiatorPulseBadge({
  status = "active",
  label,
  subtext,
  icon: CustomIcon,
  pulse = true,
  onClick,
  className,
}: GladiatorPulseBadgeProps) {
  const handleClick = () => {
    soundFX.playPop();
    soundFX.vibrate(10);
    onClick?.();
  };

  const statusConfig = {
    active: {
      dotBg: "bg-[#03D26F]",
      radarRing: "bg-[#03D26F]/40",
      badgeBg: "bg-[#03D26F]/10 dark:bg-[#03D26F]/20",
      badgeBorder: "border-[#03D26F]/50",
      textColor: "text-[#065F46] dark:text-[#03D26F]",
      defaultIcon: Flame,
    },
    conquered: {
      dotBg: "bg-[#CEF431]",
      radarRing: "bg-[#CEF431]/40",
      badgeBg: "bg-[#CEF431]/15 dark:bg-[#CEF431]/20",
      badgeBorder: "border-[#CEF431]/60",
      textColor: "text-[#161514] dark:text-[#CEF431]",
      defaultIcon: Sparkles,
    },
    warning: {
      dotBg: "bg-[#F59E0B]",
      radarRing: "bg-[#F59E0B]/40",
      badgeBg: "bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20",
      badgeBorder: "border-[#F59E0B]/50",
      textColor: "text-[#92400E] dark:text-[#FBBF24]",
      defaultIcon: Flame,
    },
    shielded: {
      dotBg: "bg-[#38BDF8]",
      radarRing: "bg-[#38BDF8]/40",
      badgeBg: "bg-[#38BDF8]/10 dark:bg-[#38BDF8]/20",
      badgeBorder: "border-[#38BDF8]/50",
      textColor: "text-[#0369A1] dark:text-[#38BDF8]",
      defaultIcon: Shield,
    },
    neutral: {
      dotBg: "bg-[#161514] dark:bg-[#FAF8F5]",
      radarRing: "bg-black/20 dark:bg-white/20",
      badgeBg: "bg-secondary",
      badgeBorder: "border-border",
      textColor: "text-foreground",
      defaultIcon: Droplet,
    },
  }[status];

  const IconComponent = CustomIcon || statusConfig.defaultIcon;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-heading font-black",
        "transition-all duration-150 select-none cursor-pointer",
        "shadow-[1px_1px_0px_0px_#161514] dark:shadow-[1px_1px_0px_0px_#000000]",
        "active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:scale-[1.02]",
        statusConfig.badgeBg,
        statusConfig.badgeBorder,
        statusConfig.textColor,
        className
      )}
    >
      {/* Radar Dot with Ambient Pulse Ring */}
      <span className="relative flex size-2 shrink-0">
        {pulse && (
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              statusConfig.radarRing
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full size-2",
            statusConfig.dotBg
          )}
        />
      </span>

      {/* Optional Contextual Icon */}
      <IconComponent className="size-3 shrink-0 stroke-[2.5]" />

      {/* Label & Subtext */}
      <span className="tracking-tight">{label}</span>
      {subtext && (
        <span className="font-mono text-[10px] opacity-75 font-semibold tabular-nums">
          • {subtext}
        </span>
      )}
    </button>
  );
}
